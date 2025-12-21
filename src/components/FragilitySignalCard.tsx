import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";

interface CoreComponent {
  name: string;
  description: string;
}

interface FragilitySignal {
  id: string;
  signal_code: string;
  name: string;
  description: string;
  core_components: (string | CoreComponent)[];
  why_it_matters: string;
  current_direction: string;
  last_updated: string;
}

interface FragilitySignalCardProps {
  signal: FragilitySignal;
}

export const FragilitySignalCard = ({ signal }: FragilitySignalCardProps) => {
  const directionConfig: Record<string, { icon: React.ReactNode; label: string; color: string; badgeVariant: "default" | "secondary" | "destructive" }> = {
    elevated: {
      icon: <TrendingUp className="w-4 h-4" />,
      label: "↑ Elevated",
      color: "text-accent",
      badgeVariant: "destructive",
    },
    stable: {
      icon: <Minus className="w-4 h-4" />,
      label: "→ Stable",
      color: "text-muted-foreground",
      badgeVariant: "secondary",
    },
    improving: {
      icon: <TrendingDown className="w-4 h-4" />,
      label: "↓ Improving",
      color: "text-primary",
      badgeVariant: "default",
    },
  };

  const config = directionConfig[signal.current_direction] || directionConfig.stable;

  return (
    <Card className="group p-6 bg-card border-border hover:border-primary/50 transition-all duration-300 hover:glow-primary">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded">
              {signal.signal_code}
            </span>
            <Badge variant={config.badgeVariant} className="flex items-center gap-1">
              {config.icon}
              {config.label}
            </Badge>
          </div>
          <AlertTriangle className={`w-5 h-5 ${signal.current_direction === 'elevated' ? 'text-accent animate-pulse' : 'text-muted-foreground/30'}`} />
        </div>

        {/* Title & Description */}
        <div>
          <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors mb-2">
            {signal.name}
          </h3>
          <p className="text-sm text-muted-foreground">
            {signal.description}
          </p>
        </div>

        {/* Core Components */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Core Components
          </h4>
          <div className="flex flex-wrap gap-2">
            {signal.core_components.map((component, i) => {
              const displayName = typeof component === 'string' 
                ? component 
                : component.name;
              return (
                <span
                  key={i}
                  className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground"
                >
                  {displayName}
                </span>
              );
            })}
          </div>
        </div>

        {/* Why It Matters */}
        <div className="pt-3 border-t border-border">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Why It Matters
          </h4>
          <p className="text-sm text-foreground/80">
            {signal.why_it_matters}
          </p>
        </div>

        {/* Last Updated */}
        <div className="text-xs text-muted-foreground">
          Last updated: {new Date(signal.last_updated).toLocaleDateString()}
        </div>
      </div>
    </Card>
  );
};
