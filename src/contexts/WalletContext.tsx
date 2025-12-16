import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { PeraWalletConnect } from '@perawallet/connect';
import algosdk from 'algosdk';
import { toast } from 'sonner';

interface WalletContextType {
  walletAddress: string | null;
  isConnecting: boolean;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  signTransactions: (txnGroup: algosdk.Transaction[], indexesToSign: number[]) => Promise<Uint8Array[]>;
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

    // Prepare transactions for signing
    const txnsToSign = txnGroup.map((txn, index) => {
      if (indexesToSign.includes(index)) {
        return { txn, signers: [walletAddress] };
      }
      return { txn, signers: [] };
    });

    const signedTxns = await peraWallet.signTransaction([txnsToSign]);
    return signedTxns;
  }, [walletAddress]);

  return (
    <WalletContext.Provider value={{
      walletAddress,
      isConnecting,
      isConnected: !!walletAddress,
      connect,
      disconnect,
      signTransactions,
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
