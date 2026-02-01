import { createContext, useContext, useMemo, ReactNode } from "react";
import { useLocation } from "react-router-dom";

// Tenant configuration type
export interface TenantConfig {
  id: string;
  name: string;
  logo?: string;
  tagline: string;
  primaryColor: string; // HSL values
  accentColor: string;
  marketFilter?: {
    categories?: string[];
    regions?: string[];
    tags?: string[];
  };
  features: {
    walletTrading: boolean;
    paperTrading: boolean;
    leaderboard: boolean;
    weeklyReports: boolean;
  };
  authMethods: ("wallet" | "email" | "social")[];
}

// Tenant configurations
const TENANT_CONFIGS: Record<string, TenantConfig> = {
  augurion: {
    id: "augurion",
    name: "Augurion",
    tagline: "Predict Africa's Future",
    primaryColor: "142 76% 36%", // Current green
    accentColor: "38 92% 50%",
    features: {
      walletTrading: true,
      paperTrading: false,
      leaderboard: false,
      weeklyReports: true,
    },
    authMethods: ["wallet", "email"],
  },
  "soccer-laduma": {
    id: "soccer-laduma",
    name: "Soccer Laduma Predictions",
    tagline: "Predict. Compete. Win.",
    primaryColor: "0 84% 50%", // Red for Soccer Laduma
    accentColor: "45 100% 50%", // Gold accent
    marketFilter: {
      categories: ["Sport"],
      tags: ["soccer", "football", "psl", "afcon"],
    },
    features: {
      walletTrading: false,
      paperTrading: true,
      leaderboard: true,
      weeklyReports: false,
    },
    authMethods: ["email", "social"],
  },
};

interface TenantContextValue {
  tenant: TenantConfig;
  tenantId: string;
  isDefaultTenant: boolean;
}

const TenantContext = createContext<TenantContextValue | null>(null);

// Detect tenant from URL path
function detectTenantFromPath(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0]?.toLowerCase();
  
  if (firstSegment && TENANT_CONFIGS[firstSegment]) {
    return firstSegment;
  }
  
  return "augurion"; // Default tenant
}

interface TenantProviderProps {
  children: ReactNode;
}

export function TenantProvider({ children }: TenantProviderProps) {
  const location = useLocation();
  
  const value = useMemo(() => {
    const tenantId = detectTenantFromPath(location.pathname);
    const tenant = TENANT_CONFIGS[tenantId] || TENANT_CONFIGS.augurion;
    
    return {
      tenant,
      tenantId,
      isDefaultTenant: tenantId === "augurion",
    };
  }, [location.pathname]);
  
  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}

// Helper to get tenant-aware path
export function getTenantPath(basePath: string, tenantId: string): string {
  if (tenantId === "augurion") {
    return basePath;
  }
  return `/${tenantId}${basePath}`;
}

// Export configs for reference
export { TENANT_CONFIGS };
