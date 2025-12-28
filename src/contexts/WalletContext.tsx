import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { PeraWalletConnect } from '@perawallet/connect';
import algosdk from 'algosdk';
import { toast } from 'sonner';

type TransactionSigner = (txnGroup: algosdk.Transaction[], indexesToSign: number[]) => Promise<Uint8Array[]>;

interface WalletContextType {
  walletAddress: string | null;
  isConnecting: boolean;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  signTransactions: TransactionSigner;
  getSigner: () => TransactionSigner;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Initialize Pera Wallet - single instance
const peraWallet = new PeraWalletConnect({
  shouldShowSignTxnToast: true,
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    peraWallet.reconnectSession().then((accounts) => {
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        console.log('Reconnected to wallet:', accounts[0]);
      }
    }).catch((error) => {
      console.log('No existing session:', error);
    });

    // Listen for disconnect events
    peraWallet.connector?.on('disconnect', () => {
      setWalletAddress(null);
      console.log('Wallet disconnected');
    });
  }, []);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      const accounts = await peraWallet.connect();
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        toast.success('Wallet connected!');
        console.log('Connected wallet:', accounts[0]);
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      if ((error as Error).message?.includes('CONNECT_MODAL_CLOSED')) {
        // User closed modal - not an error
        return;
      }
      toast.error('Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    peraWallet.disconnect();
    setWalletAddress(null);
    toast.success('Wallet disconnected');
  }, []);

  const signTransactions = useCallback(async (
    txnGroup: algosdk.Transaction[],
    indexesToSign: number[]
  ): Promise<Uint8Array[]> => {
    if (!walletAddress) {
      throw new Error('Wallet not connected');
    }

    console.log('Preparing', txnGroup.length, 'transactions for signing, indexes:', indexesToSign);

    // Prepare transactions for Pera Wallet signing format
    // Pera expects SignerTransaction[] with { txn: Transaction, signers?: string[] }
    const txnsToSign = txnGroup.map((txn, index) => {
      if (indexesToSign.includes(index)) {
        // This transaction needs to be signed
        return { txn };
      }
      // Skip signing this transaction (empty signers array)
      return { txn, signers: [] as string[] };
    });

    console.log('Sending', txnsToSign.length, 'transactions to Pera Wallet for signing...');

    // Sign with Pera Wallet - it expects SignerTransaction[][] (array of groups)
    const signedTxns = await peraWallet.signTransaction([txnsToSign]);
    
    console.log('Received', signedTxns.length, 'signed transactions from wallet');

    return signedTxns;
  }, [walletAddress]);

  const getSigner = useCallback((): TransactionSigner => {
    return signTransactions;
  }, [signTransactions]);

  return (
    <WalletContext.Provider value={{
      walletAddress,
      isConnecting,
      isConnected: !!walletAddress,
      connect,
      disconnect,
      signTransactions,
      getSigner,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
