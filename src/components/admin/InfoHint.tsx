import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface InfoHintProps {
  text: string;
  className?: string;
}

/** Small ⓘ icon with a hover/tap tooltip — for explaining admin sections. */
export function InfoHint({ text, className }: InfoHintProps) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="More info"
            className={`inline-flex items-center text-muted-foreground hover:text-primary transition-colors ${className ?? ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed whitespace-pre-line">
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
