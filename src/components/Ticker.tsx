import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface TickerItem {
  event: string;
  yes: number;
  no: number;
  change: number;
}

const TICKER_DATA: TickerItem[] = [
  { event: "SA Cabinet Reshuffle", yes: 64, no: 36, change: 12 },
  { event: "Naira < ₦2000", yes: 78, no: 22, change: -5 },
  { event: "Kenya No-Confidence", yes: 42, no: 58, change: 8 },
  { event: "Load-shedding Ends", yes: 31, no: 69, change: -15 },
  { event: "Minister Resigns", yes: 55, no: 45, change: 22 },
  { event: "Coalition Breaks", yes: 67, no: 33, change: 18 },
];

export const Ticker = () => {
  const [items, setItems] = useState(TICKER_DATA);

  useEffect(() => {
    const interval = setInterval(() => {
      setItems(prev => [...prev.slice(1), prev[0]]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-card border-y border-border overflow-hidden py-3">
      <div className="flex animate-ticker">
        {[...items, ...items].map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-4 px-8 whitespace-nowrap border-r border-border/50"
          >
            <span className="text-muted-foreground font-medium">{item.event}</span>
            <span className="text-primary text-glow-primary font-bold">
              YES {item.yes}%
            </span>
            <span className="text-secondary text-glow-secondary font-bold">
              NO {item.no}%
            </span>
            <span
              className={`flex items-center gap-1 font-bold ${
                item.change > 0 ? "text-primary" : "text-accent"
              }`}
            >
              {item.change > 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              {Math.abs(item.change)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
