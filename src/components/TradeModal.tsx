import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useWallet } from '@/contexts/WalletContext';
import { AugurionMarketV4Client } from '@/contracts/AugurionMarketV4Client';
import { toast } from 'sonner';
import { Loader2, TrendingUp, TrendingDown, Wallet, ExternalLink } from 'lucide-react';

interface Market {
  id: string;
  title: string;
  category: string;
  app_id: string;
  yes_total: number | null;
  no_total: number | null;
  linked_signals: string[] | null;
  resolution_criteria: string | null;
}

interface TradeModalProps {
  market: Market | null;
  isOpen: boolean;
  onClose: () => void;
  onTradeComplete?: () => void;
}

export const TradeModal = ({ market, isOpen, onClose, onTradeComplete }: TradeModalProps) => {
  const { walletAddress, isConnected, connect, signTransactions } = useWallet();
  const [side, setSide] = useState<'YES' | 'NO'>('YES');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!market) return null;

  // Calculate implied odds
  const yesTotal = market.yes_total || 0;
  const noTotal = market.no_total || 0;
  const total = yesTotal + noTotal;
  const yesOdds = total > 0 ? Math.round((yesTotal / total) * 100) : 50;
  const noOdds = total > 0 ? Math.round((noTotal / total) * 100) : 50;

  // Calculate potential payout (simplified - in production would factor in fees)
  const amountNum = parseFloat(amount) || 0;
  const selectedOdds = side === 'YES' ? yesOdds : noOdds;
  const potentialPayout = selectedOdds > 0 ? (amountNum * 100 / selectedOdds).toFixed(2) : '0.00';

  const handleTrade = async () => {
    if (!isConnected || !walletAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    // Parse app_id to number - handle various formats
    const appIdStr = market.app_id.replace(/\D/g, '') || '0';
    const appId = parseInt(appIdStr, 10);
    
    if (!appId || appId === 0) {
      toast.error('This market is not yet deployed on-chain');
      return;
    }

    setIsSubmitting(true);
    try {
      const client = new AugurionMarketV4Client(appId);
      const microAlgos = Math.floor(parseFloat(amount) * 1_000_000); // Convert ALGO to microALGO

      console.log(`Placing ${side} bet of ${microAlgos} microALGO on app ${appId}`);

      const result = side === 'YES'
        ? await client.betYes(walletAddress, microAlgos, signTransactions)
        : await client.betNo(walletAddress, microAlgos, signTransactions);

      if (result.success) {
        toast.success(
          <div className="flex flex-col gap-1">
            <span>Trade submitted!</span>
            {result.txId && (
              <a 
                href={`https://testnet.algoexplorer.io/tx/${result.txId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary flex items-center gap-1"
              >
                View on AlgoExplorer <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        );
        onTradeComplete?.();
        onClose();
        setAmount('');
      } else {
        throw new Error(result.error || 'Transaction failed');
      }
    } catch (error) {
      console.error('Trade error:', error);
      toast.error(error instanceof Error ? error.message : 'Trade failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Trade</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {market.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Linked Signals */}
          {market.linked_signals && market.linked_signals.length > 0 && (
            <div className="flex gap-2">
              {market.linked_signals.map((signal) => (
                <Badge key={signal} variant="outline" className="text-xs">
                  {signal}
                </Badge>
              ))}
            </div>
          )}

          {/* Side Selection */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSide('YES')}
              className={`p-4 rounded-lg border-2 transition-all ${
                side === 'YES'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <TrendingUp className={`w-5 h-5 ${side === 'YES' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`font-bold text-lg ${side === 'YES' ? 'text-primary' : 'text-foreground'}`}>
                  YES
                </span>
              </div>
              <div className="text-2xl font-bold text-primary mt-1">{yesOdds}%</div>
            </button>

            <button
              onClick={() => setSide('NO')}
              className={`p-4 rounded-lg border-2 transition-all ${
                side === 'NO'
                  ? 'border-secondary bg-secondary/10'
                  : 'border-border hover:border-secondary/50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <TrendingDown className={`w-5 h-5 ${side === 'NO' ? 'text-secondary' : 'text-muted-foreground'}`} />
                <span className={`font-bold text-lg ${side === 'NO' ? 'text-secondary' : 'text-foreground'}`}>
                  NO
                </span>
              </div>
              <div className="text-2xl font-bold text-secondary mt-1">{noOdds}%</div>
            </button>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (ALGO)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.1"
              className="text-lg"
            />
          </div>

          {/* Potential Payout */}
          {amountNum > 0 && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Potential payout</span>
                <span className="font-bold text-foreground">{potentialPayout} ALGO</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>If {side} wins</span>
                <span>Before fees</span>
              </div>
            </div>
          )}

          {/* Resolution Criteria */}
          {market.resolution_criteria && (
            <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
              <strong>Resolution:</strong> {market.resolution_criteria}
            </div>
          )}

          {/* Action Button */}
          {isConnected ? (
            <Button
              onClick={handleTrade}
              disabled={isSubmitting || !amount || parseFloat(amount) <= 0}
              className="w-full"
              variant={side === 'YES' ? 'default' : 'secondary'}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Place {side} Trade
                </>
              )}
            </Button>
          ) : (
            <Button onClick={connect} className="w-full" variant="hero">
              <Wallet className="w-4 h-4 mr-2" />
              Connect Wallet to Trade
            </Button>
          )}

          {/* Network Notice */}
          <p className="text-xs text-center text-muted-foreground">
            Trading on Algorand TestNet
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
