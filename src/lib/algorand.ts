import algosdk from 'algosdk';

// Algorand TestNet configuration
const ALGOD_SERVER = 'https://testnet-api.algonode.cloud';
const ALGOD_PORT = '';
const ALGOD_TOKEN = '';

// Initialize Algorand client
export const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);

// Market contract types
export interface Market {
  id: string;
  appId: number;
  name: string;
  description: string;
  status: 'OPEN' | 'FROZEN' | 'RESOLVED';
  outcome?: 'YES' | 'NO';
  yesTotal: number;
  noTotal: number;
  totalBets: number;
  feePercent: number;
  yesOdds: number;
  noOdds: number;
  createdAt: Date;
  resolvesAt: Date;
}

export interface Bet {
  id: string;
  marketId: string;
  marketName: string;
  side: 'YES' | 'NO';
  amount: number;
  status: 'PENDING' | 'WON' | 'LOST' | 'CLAIMED';
  timestamp: Date;
}

export interface FragilityIndicator {
  id: string;
  name: string;
  country: string;
  value: number;
  previousValue: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  lastUpdated: Date;
  category: 'POLITICAL' | 'ECONOMIC' | 'SOCIAL' | 'SECURITY';
}

// Mock data for development (replace with actual contract calls)
export const mockMarkets: Market[] = [
  {
    id: '1',
    appId: 123456789,
    name: 'ANC Coalition 2027',
    description: 'Will the ANC retain majority coalition control in the 2027 general elections?',
    status: 'OPEN',
    yesTotal: 15000,
    noTotal: 12500,
    totalBets: 145,
    feePercent: 2.5,
    yesOdds: 54.5,
    noOdds: 45.5,
    createdAt: new Date('2024-01-15'),
    resolvesAt: new Date('2027-05-15'),
  },
  {
    id: '2',
    appId: 123456790,
    name: 'Tinubu 2027 Re-election',
    description: 'Will Bola Tinubu win the 2027 Nigerian presidential election?',
    status: 'OPEN',
    yesTotal: 8500,
    noTotal: 9200,
    totalBets: 89,
    feePercent: 2.5,
    yesOdds: 48.0,
    noOdds: 52.0,
    createdAt: new Date('2024-02-01'),
    resolvesAt: new Date('2027-02-25'),
  },
  {
    id: '3',
    appId: 123456791,
    name: 'Kenya Coalition Collapse',
    description: 'Will Kenya\'s ruling coalition face a major split before 2026?',
    status: 'FROZEN',
    yesTotal: 5200,
    noTotal: 4800,
    totalBets: 67,
    feePercent: 2.5,
    yesOdds: 52.0,
    noOdds: 48.0,
    createdAt: new Date('2024-03-10'),
    resolvesAt: new Date('2025-12-31'),
  },
];

export const mockBets: Bet[] = [
  {
    id: '1',
    marketId: '1',
    marketName: 'ANC Coalition 2027',
    side: 'YES',
    amount: 500,
    status: 'PENDING',
    timestamp: new Date('2024-06-15'),
  },
  {
    id: '2',
    marketId: '2',
    marketName: 'Tinubu 2027 Re-election',
    side: 'NO',
    amount: 250,
    status: 'PENDING',
    timestamp: new Date('2024-07-20'),
  },
];

export const mockFragilityIndicators: FragilityIndicator[] = [
  {
    id: '1',
    name: 'Political Stability Index',
    country: 'South Africa',
    value: 62,
    previousValue: 58,
    trend: 'UP',
    lastUpdated: new Date(),
    category: 'POLITICAL',
  },
  {
    id: '2',
    name: 'Coalition Cohesion Score',
    country: 'South Africa',
    value: 45,
    previousValue: 52,
    trend: 'DOWN',
    lastUpdated: new Date(),
    category: 'POLITICAL',
  },
  {
    id: '3',
    name: 'Economic Sentiment',
    country: 'Nigeria',
    value: 38,
    previousValue: 35,
    trend: 'UP',
    lastUpdated: new Date(),
    category: 'ECONOMIC',
  },
  {
    id: '4',
    name: 'Social Unrest Index',
    country: 'Kenya',
    value: 71,
    previousValue: 68,
    trend: 'UP',
    lastUpdated: new Date(),
    category: 'SOCIAL',
  },
];

// Algorand wallet connection
export const connectWallet = async (): Promise<string | null> => {
  // In production, integrate with Pera Wallet or similar
  // For now, return mock address
  return 'MOCK_WALLET_ADDRESS_FOR_TESTING';
};

// Place a bet on a market
export const placeBet = async (
  marketAppId: number,
  side: 'YES' | 'NO',
  amount: number,
  walletAddress: string
): Promise<{ success: boolean; txId?: string; error?: string }> => {
  try {
    // In production, this would:
    // 1. Create an application call transaction to the market smart contract
    // 2. Include the bet amount as a payment
    // 3. Sign with user's wallet
    // 4. Submit to network
    
    console.log(`Placing ${side} bet of ${amount} ALGO on market ${marketAppId}`);
    
    // Mock successful transaction
    return {
      success: true,
      txId: `MOCK_TX_${Date.now()}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Admin: Freeze a market
export const freezeMarket = async (
  marketAppId: number,
  adminAddress: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log(`Freezing market ${marketAppId}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Admin: Resolve a market
export const resolveMarket = async (
  marketAppId: number,
  winningSide: 'YES' | 'NO',
  adminAddress: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log(`Resolving market ${marketAppId} with winner: ${winningSide}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Claim payout for won bet
export const claimPayout = async (
  marketAppId: number,
  betId: string,
  walletAddress: string
): Promise<{ success: boolean; amount?: number; error?: string }> => {
  try {
    console.log(`Claiming payout for bet ${betId} on market ${marketAppId}`);
    return {
      success: true,
      amount: 750, // Mock payout amount
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
