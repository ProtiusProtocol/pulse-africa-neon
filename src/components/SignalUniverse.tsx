import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SignalUniverseProps {
  tenantId?: string;
  className?: string;
}

interface PredictionPoint {
  x: number;
  y: number;
  size: number;
  side: "yes" | "no";
  opacity: number;
  pulsePhase: number;
}

const SignalUniverse = ({ tenantId = "soccer-laduma", className = "" }: SignalUniverseProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  // Fetch aggregated prediction data
  const { data: predictions } = useQuery({
    queryKey: ["signal-universe", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("paper_predictions")
        .select("side, points_staked, status, created_at")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;
      return data || [];
    },
  });

  // Generate prediction points for visualization
  const generatePoints = (predictions: any[]): PredictionPoint[] => {
    const points: PredictionPoint[] = [];
    const now = Date.now();

    predictions.forEach((pred, index) => {
      const isYes = pred.side === "yes";
      const createdAt = new Date(pred.created_at).getTime();
      const age = (now - createdAt) / (1000 * 60 * 60 * 24); // Days old
      
      // Position: YES on left (0-0.4), NO on right (0.6-1.0)
      const baseX = isYes ? 0.2 : 0.8;
      const xSpread = (Math.random() - 0.5) * 0.3;
      
      // Y position based on recency (newer = center, older = edges)
      const yBase = 0.5;
      const ySpread = Math.min(age / 30, 0.4) * (Math.random() > 0.5 ? 1 : -1);
      
      // Size based on points staked
      const size = Math.max(2, Math.min(8, (pred.points_staked || 50) / 15));
      
      // Opacity based on age (newer = brighter)
      const opacity = Math.max(0.3, 1 - age / 60);

      points.push({
        x: baseX + xSpread,
        y: yBase + ySpread + (Math.random() - 0.5) * 0.3,
        size,
        side: pred.side,
        opacity,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    });

    // Add ambient dust particles
    for (let i = 0; i < 50; i++) {
      const isYes = Math.random() > 0.5;
      points.push({
        x: isYes ? 0.1 + Math.random() * 0.35 : 0.55 + Math.random() * 0.35,
        y: Math.random(),
        size: 1 + Math.random() * 1.5,
        side: isYes ? "yes" : "no",
        opacity: 0.15 + Math.random() * 0.2,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }

    return points;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    const points = generatePoints(predictions || []);
    let time = 0;

    const draw = () => {
      const width = canvas.width / window.devicePixelRatio;
      const height = canvas.height / window.devicePixelRatio;

      // Clear with dark background
      ctx.fillStyle = "rgba(10, 10, 15, 1)";
      ctx.fillRect(0, 0, width, height);

      // Draw center divider glow
      const gradient = ctx.createLinearGradient(width * 0.45, 0, width * 0.55, 0);
      gradient.addColorStop(0, "rgba(255, 255, 255, 0)");
      gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.1)");
      gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(width * 0.45, 0, width * 0.1, height);

      // Draw nebula glows
      // YES nebula (green/lime)
      const yesGradient = ctx.createRadialGradient(
        width * 0.2, height * 0.5, 0,
        width * 0.2, height * 0.5, width * 0.25
      );
      yesGradient.addColorStop(0, "rgba(34, 197, 94, 0.3)");
      yesGradient.addColorStop(0.5, "rgba(34, 197, 94, 0.1)");
      yesGradient.addColorStop(1, "rgba(34, 197, 94, 0)");
      ctx.fillStyle = yesGradient;
      ctx.fillRect(0, 0, width * 0.5, height);

      // NO nebula (red)
      const noGradient = ctx.createRadialGradient(
        width * 0.8, height * 0.5, 0,
        width * 0.8, height * 0.5, width * 0.25
      );
      noGradient.addColorStop(0, "rgba(220, 38, 38, 0.3)");
      noGradient.addColorStop(0.5, "rgba(220, 38, 38, 0.1)");
      noGradient.addColorStop(1, "rgba(220, 38, 38, 0)");
      ctx.fillStyle = noGradient;
      ctx.fillRect(width * 0.5, 0, width * 0.5, height);

      // Draw prediction stars
      points.forEach((point) => {
        const x = point.x * width;
        const y = point.y * height;
        const pulse = 1 + Math.sin(time * 2 + point.pulsePhase) * 0.2;
        const size = point.size * pulse;

        // Star glow
        const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, size * 3);
        const color = point.side === "yes" 
          ? `rgba(34, 197, 94, ${point.opacity * 0.5})`
          : `rgba(220, 38, 38, ${point.opacity * 0.5})`;
        const colorTransparent = point.side === "yes"
          ? "rgba(34, 197, 94, 0)"
          : "rgba(220, 38, 38, 0)";
        
        glowGradient.addColorStop(0, color);
        glowGradient.addColorStop(1, colorTransparent);
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(x, y, size * 3, 0, Math.PI * 2);
        ctx.fill();

        // Star core
        ctx.fillStyle = point.side === "yes"
          ? `rgba(134, 239, 172, ${point.opacity})`
          : `rgba(252, 165, 165, ${point.opacity})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw labels
      ctx.font = "bold 14px system-ui";
      ctx.textAlign = "center";
      
      // YES label
      ctx.fillStyle = "rgba(34, 197, 94, 0.8)";
      ctx.fillText("YES", width * 0.2, height - 20);
      
      // NO label
      ctx.fillStyle = "rgba(220, 38, 38, 0.8)";
      ctx.fillText("NO", width * 0.8, height - 20);

      time += 0.016;
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [predictions]);

  const yesCount = predictions?.filter(p => p.side === "yes").length || 0;
  const noCount = predictions?.filter(p => p.side === "no").length || 0;
  const total = yesCount + noCount;

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-lg"
        style={{ background: "rgb(10, 10, 15)" }}
      />
      
      {/* Stats overlay */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between text-sm">
        <div className="bg-green-500/20 backdrop-blur-sm rounded px-3 py-1 border border-green-500/30">
          <span className="text-green-400 font-bold">{yesCount}</span>
          <span className="text-green-400/70 ml-1">YES</span>
          {total > 0 && (
            <span className="text-green-400/50 ml-2">
              ({Math.round((yesCount / total) * 100)}%)
            </span>
          )}
        </div>
        <div className="bg-red-500/20 backdrop-blur-sm rounded px-3 py-1 border border-red-500/30">
          <span className="text-red-400 font-bold">{noCount}</span>
          <span className="text-red-400/70 ml-1">NO</span>
          {total > 0 && (
            <span className="text-red-400/50 ml-2">
              ({Math.round((noCount / total) * 100)}%)
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignalUniverse;
