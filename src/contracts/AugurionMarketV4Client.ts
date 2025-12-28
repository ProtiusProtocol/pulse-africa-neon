/**
 * Minimal typed client for AugurionMarketV4 smart contract
 * Based on the contract ABI - only includes methods needed for the UI
 */
import algosdk, { ABIMethod, AtomicTransactionComposer } from 'algosdk';
import { algodClient } from '@/lib/algorand';

// Contract method selectors (from ABI)
const METHODS = {
  create: new ABIMethod({ name: 'create', args: [], returns: { type: 'void' } }),
  configure_market: new ABIMethod({
    name: 'configure_market',
    args: [
      { type: 'byte[]', name: 'outcomeRef' },
      { type: 'uint64', name: 'expiryRound' },
      { type: 'uint64', name: 'feeBps' }
    ],
    returns: { type: 'string' }
  }),
  open_market: new ABIMethod({ name: 'open_market', args: [], returns: { type: 'string' } }),
  freeze_market: new ABIMethod({ name: 'freeze_market', args: [], returns: { type: 'string' } }),
  cancel_market: new ABIMethod({ name: 'cancel_market', args: [], returns: { type: 'string' } }),
  bet_yes: new ABIMethod({
    name: 'bet_yes',
    args: [{ type: 'uint64', name: 'amount' }],
    returns: { type: 'string' }
  }),
  bet_no: new ABIMethod({
    name: 'bet_no',
    args: [{ type: 'uint64', name: 'amount' }],
    returns: { type: 'string' }
  }),
  resolve_market: new ABIMethod({
    name: 'resolve_market',
    args: [{ type: 'uint64', name: 'winningSide' }],
    returns: { type: 'string' }
  }),
  claim_payout: new ABIMethod({ name: 'claim_payout', args: [], returns: { type: 'string' } }),
  claim_refund: new ABIMethod({ name: 'claim_refund', args: [], returns: { type: 'string' } }),
  get_market_meta: new ABIMethod({ name: 'get_market_meta', args: [], returns: { type: 'string' } }),
};

// Market status enum matching contract
export enum MarketStatus {
  PENDING = 0,
  OPEN = 1,
  FROZEN = 2,
  RESOLVED = 3,
  CANCELLED = 4,
}

// Winning side enum matching contract
export enum WinningSide {
  NONE = 0,
  YES = 1,
  NO = 2,
}

// Global state interface
export interface MarketGlobalState {
  status: MarketStatus;
  admin: string;
  outcomeRef: string;
  expiryRound: number;
  yesTotal: number;
  noTotal: number;
  totalBets: number;
  feeBps: number;
  winningSide: WinningSide;
}

// Signer type for wallet integration
export type TransactionSigner = (
  txnGroup: algosdk.Transaction[],
  indexesToSign: number[]
) => Promise<Uint8Array[]>;

/**
 * Minimal client for AugurionMarketV4 contract
 */
export class AugurionMarketV4Client {
  readonly appId: number;
  readonly appAddress: string;

  constructor(appId: number) {
    this.appId = appId;
    this.appAddress = algosdk.getApplicationAddress(appId) as unknown as string;
  }

  /**
   * Read the market's global state
   */
  async getGlobalState(): Promise<MarketGlobalState | null> {
    try {
      const appInfo = await algodClient.getApplicationByID(this.appId).do();
      const globalState = appInfo['params']['global-state'] || [];

      const state: Partial<MarketGlobalState> = {};

      for (const item of globalState) {
        const key = Buffer.from(item.key, 'base64').toString();
        const value = item.value;

        switch (key) {
          case 'status':
            state.status = value.uint as MarketStatus;
            break;
          case 'admin':
            state.admin = algosdk.encodeAddress(Buffer.from(value.bytes, 'base64') as unknown as Uint8Array) as unknown as string;
            break;
          case 'outcomeRef':
            state.outcomeRef = Buffer.from(value.bytes, 'base64').toString();
            break;
          case 'expiryRound':
            state.expiryRound = value.uint;
            break;
          case 'yesTotal':
            state.yesTotal = value.uint;
            break;
          case 'noTotal':
            state.noTotal = value.uint;
            break;
          case 'totalBets':
            state.totalBets = value.uint;
            break;
          case 'feeBps':
            state.feeBps = value.uint;
            break;
          case 'winningSide':
            state.winningSide = value.uint as WinningSide;
            break;
        }
      }

      return state as MarketGlobalState;
    } catch (error) {
      console.error('Failed to fetch global state:', error);
      return null;
    }
  }

  /**
   * Place a YES bet - requires grouped payment transaction
   */
  async betYes(
    sender: string,
    amount: number,
    signer: TransactionSigner
  ): Promise<{ success: boolean; txId?: string; result?: string; error?: string }> {
    return this.placeBet('yes', sender, amount, signer);
  }

  /**
   * Place a NO bet - requires grouped payment transaction
   */
  async betNo(
    sender: string,
    amount: number,
    signer: TransactionSigner
  ): Promise<{ success: boolean; txId?: string; result?: string; error?: string }> {
    return this.placeBet('no', sender, amount, signer);
  }

  private async placeBet(
    side: 'yes' | 'no',
    sender: string,
    amount: number,
    signer: TransactionSigner
  ): Promise<{ success: boolean; txId?: string; result?: string; error?: string }> {
    try {
      const suggestedParams = await algodClient.getTransactionParams().do();
      const method = side === 'yes' ? METHODS.bet_yes : METHODS.bet_no;

      // Build transactions manually for better control
      // Payment transaction (must be first in group)
      const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender,
        receiver: this.appAddress,
        amount,
        suggestedParams,
      });

      // App call transaction with box references
      const appCallTxn = algosdk.makeApplicationCallTxnFromObject({
        appIndex: this.appId,
        onComplete: algosdk.OnApplicationComplete.NoOpOC,
        sender,
        suggestedParams,
        appArgs: [
          method.getSelector(),
          algosdk.encodeUint64(amount),
        ],
        boxes: [
          { appIndex: this.appId, name: new Uint8Array([...Buffer.from(side + ':'), ...algosdk.decodeAddress(sender).publicKey]) },
        ],
      });

      // Assign group ID to both transactions
      const txnGroup = algosdk.assignGroupID([paymentTxn, appCallTxn]);

      console.log('Requesting wallet signature for', txnGroup.length, 'transactions...');

      // Sign with wallet - request signature for both transactions
      const signedTxns = await signer(txnGroup, [0, 1]);

      console.log('Signed', signedTxns.length, 'transactions, submitting...');

      // Submit the signed transaction group
      const { txid } = await algodClient.sendRawTransaction(signedTxns).do();

      // Wait for confirmation
      await algosdk.waitForConfirmation(algodClient, txid, 4);

      console.log('Transaction confirmed:', txid);

      return {
        success: true,
        txId: txid,
        result: 'Bet placed successfully',
      };
    } catch (error) {
      console.error('placeBet error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Claim payout after market resolution
   */
  async claimPayout(
    sender: string,
    signer: TransactionSigner
  ): Promise<{ success: boolean; txId?: string; result?: string; error?: string }> {
    try {
      const suggestedParams = await algodClient.getTransactionParams().do();
      const atc = new AtomicTransactionComposer();
      const publicKey = algosdk.decodeAddress(sender).publicKey;

      atc.addMethodCall({
        appID: this.appId,
        method: METHODS.claim_payout,
        methodArgs: [],
        sender,
        suggestedParams,
        signer,
        boxes: [
          { appIndex: this.appId, name: new Uint8Array([...Buffer.from('yes:'), ...publicKey]) },
          { appIndex: this.appId, name: new Uint8Array([...Buffer.from('no:'), ...publicKey]) },
          { appIndex: this.appId, name: new Uint8Array([...Buffer.from('claimed:'), ...publicKey]) },
        ],
      });

      const result = await atc.execute(algodClient, 4);
      const methodResult = result.methodResults[0];

      return {
        success: true,
        txId: result.txIDs[0],
        result: methodResult?.returnValue?.toString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Claim refund if market was cancelled
   */
  async claimRefund(
    sender: string,
    signer: TransactionSigner
  ): Promise<{ success: boolean; txId?: string; result?: string; error?: string }> {
    try {
      const suggestedParams = await algodClient.getTransactionParams().do();
      const atc = new AtomicTransactionComposer();
      const publicKey = algosdk.decodeAddress(sender).publicKey;

      atc.addMethodCall({
        appID: this.appId,
        method: METHODS.claim_refund,
        methodArgs: [],
        sender,
        suggestedParams,
        signer,
        boxes: [
          { appIndex: this.appId, name: new Uint8Array([...Buffer.from('yes:'), ...publicKey]) },
          { appIndex: this.appId, name: new Uint8Array([...Buffer.from('no:'), ...publicKey]) },
          { appIndex: this.appId, name: new Uint8Array([...Buffer.from('refunded:'), ...publicKey]) },
        ],
      });

      const result = await atc.execute(algodClient, 4);
      const methodResult = result.methodResults[0];

      return {
        success: true,
        txId: result.txIDs[0],
        result: methodResult?.returnValue?.toString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Admin: Freeze the market
   */
  async freezeMarket(
    sender: string,
    signer: TransactionSigner
  ): Promise<{ success: boolean; txId?: string; result?: string; error?: string }> {
    return this.callAdminMethod(METHODS.freeze_market, [], sender, signer);
  }

  /**
   * Admin: Resolve the market with winning side (1=YES, 2=NO)
   */
  async resolveMarket(
    winningSide: WinningSide,
    sender: string,
    signer: TransactionSigner
  ): Promise<{ success: boolean; txId?: string; result?: string; error?: string }> {
    return this.callAdminMethod(METHODS.resolve_market, [winningSide], sender, signer);
  }

  /**
   * Admin: Cancel the market
   */
  async cancelMarket(
    sender: string,
    signer: TransactionSigner
  ): Promise<{ success: boolean; txId?: string; result?: string; error?: string }> {
    return this.callAdminMethod(METHODS.cancel_market, [], sender, signer);
  }

  /**
   * Admin: Open the market for betting
   */
  async openMarket(
    sender: string,
    signer: TransactionSigner
  ): Promise<{ success: boolean; txId?: string; result?: string; error?: string }> {
    return this.callAdminMethod(METHODS.open_market, [], sender, signer);
  }

  private async callAdminMethod(
    method: ABIMethod,
    args: any[],
    sender: string,
    signer: TransactionSigner
  ): Promise<{ success: boolean; txId?: string; result?: string; error?: string }> {
    try {
      const suggestedParams = await algodClient.getTransactionParams().do();
      const atc = new AtomicTransactionComposer();

      atc.addMethodCall({
        appID: this.appId,
        method,
        methodArgs: args,
        sender,
        suggestedParams,
        signer,
      });

      const result = await atc.execute(algodClient, 4);
      const methodResult = result.methodResults[0];

      return {
        success: true,
        txId: result.txIDs[0],
        result: methodResult?.returnValue?.toString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * Create a client instance for a deployed market
 */
export function getMarketClient(appId: number): AugurionMarketV4Client {
  return new AugurionMarketV4Client(appId);
}
