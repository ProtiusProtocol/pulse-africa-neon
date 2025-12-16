import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
  variant?: "pulse" | "brief";
}

// Parse inline formatting (bold, italic, links)
const parseInline = (text: string): ReactNode => {
  const parts: ReactNode[] = [];
  let remaining = text;
  let key = 0;

  // Pattern for **bold**, *italic*, and [links](url)
  const patterns = [
    { regex: /\*\*([^*]+)\*\*/, render: (match: string) => <strong key={key++} className="font-semibold text-foreground">{match}</strong> },
    { regex: /\*([^*]+)\*/, render: (match: string) => <em key={key++} className="italic">{match}</em> },
    { regex: /\[([^\]]+)\]\(([^)]+)\)/, render: (match: string, url: string) => <a key={key++} href={url} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">{match}</a> },
  ];

  while (remaining.length > 0) {
    let earliestMatch: { index: number; length: number; node: ReactNode } | null = null;

    // Check for **bold**
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
    if (boldMatch && boldMatch.index !== undefined) {
      if (!earliestMatch || boldMatch.index < earliestMatch.index) {
        earliestMatch = {
          index: boldMatch.index,
          length: boldMatch[0].length,
          node: <strong key={key++} className="font-semibold text-foreground">{boldMatch[1]}</strong>
        };
      }
    }

    // Check for *italic* (not **bold**)
    const italicMatch = remaining.match(/(?<!\*)\*([^*]+)\*(?!\*)/);
    if (italicMatch && italicMatch.index !== undefined) {
      if (!earliestMatch || italicMatch.index < earliestMatch.index) {
        earliestMatch = {
          index: italicMatch.index,
          length: italicMatch[0].length,
          node: <em key={key++} className="italic text-muted-foreground">{italicMatch[1]}</em>
        };
      }
    }

    // Check for [link](url)
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch && linkMatch.index !== undefined) {
      if (!earliestMatch || linkMatch.index < earliestMatch.index) {
        earliestMatch = {
          index: linkMatch.index,
          length: linkMatch[0].length,
          node: <a key={key++} href={linkMatch[2]} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">{linkMatch[1]}</a>
        };
      }
    }

    if (earliestMatch) {
      if (earliestMatch.index > 0) {
        parts.push(remaining.slice(0, earliestMatch.index));
      }
      parts.push(earliestMatch.node);
      remaining = remaining.slice(earliestMatch.index + earliestMatch.length);
    } else {
      parts.push(remaining);
      break;
    }
  }

  return parts.length === 1 && typeof parts[0] === "string" ? parts[0] : <>{parts}</>;
};

// Render a table from markdown
const renderTable = (lines: string[]): ReactNode => {
  const headerLine = lines[0];
  const dataLines = lines.slice(2); // Skip header and separator

  const headers = headerLine.split("|").filter(c => c.trim()).map(c => c.trim());
  const rows = dataLines.map(line => 
    line.split("|").filter(c => c.trim()).map(c => c.trim())
  );

  return (
    <div className="overflow-x-auto my-4">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-primary/30">
            {headers.map((header, i) => (
              <th key={i} className="text-left py-3 px-4 text-sm font-semibold text-foreground bg-card/50">
                {parseInline(header)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
              {row.map((cell, j) => {
                // Special styling for trend indicators
                const hasUpArrow = cell.includes("↑");
                const hasDownArrow = cell.includes("↓");
                const hasRightArrow = cell.includes("→");
                
                return (
                  <td key={j} className="py-3 px-4 text-sm text-muted-foreground">
                    {hasUpArrow ? (
                      <span className="flex items-center gap-1 text-primary">
                        <TrendingUp className="w-4 h-4" />
                        {cell.replace("↑", "").trim()}
                      </span>
                    ) : hasDownArrow ? (
                      <span className="flex items-center gap-1 text-destructive">
                        <TrendingDown className="w-4 h-4" />
                        {cell.replace("↓", "").trim()}
                      </span>
                    ) : hasRightArrow ? (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <ArrowRight className="w-4 h-4" />
                        {cell.replace("→", "").trim()}
                      </span>
                    ) : (
                      parseInline(cell)
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export function MarkdownRenderer({ content, variant = "pulse" }: MarkdownRendererProps) {
  // Handle escaped newlines from database
  const normalizedContent = content.replace(/\\n/g, "\n");
  const lines = normalizedContent.split("\n");
  const elements: ReactNode[] = [];
  let i = 0;
  let listItems: { type: "ul" | "ol"; items: ReactNode[] } | null = null;

  const flushList = () => {
    if (listItems) {
      if (listItems.type === "ul") {
        elements.push(
          <ul key={elements.length} className="my-4 space-y-2 pl-6">
            {listItems.items.map((item, idx) => (
              <li key={idx} className="text-muted-foreground flex items-start gap-2">
                <span className="text-primary mt-1.5 text-xs">●</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        );
      } else {
        elements.push(
          <ol key={elements.length} className="my-4 space-y-2 pl-6 list-decimal list-inside">
            {listItems.items.map((item, idx) => (
              <li key={idx} className="text-muted-foreground">
                {item}
              </li>
            ))}
          </ol>
        );
      }
      listItems = null;
    }
  };

  while (i < lines.length) {
    const line = lines[i];

    // Check for table (starts with |)
    if (line.startsWith("|") && i + 1 < lines.length && lines[i + 1].includes("---")) {
      flushList();
      const tableLines: string[] = [line];
      i++;
      while (i < lines.length && lines[i].startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      elements.push(<div key={elements.length}>{renderTable(tableLines)}</div>);
      continue;
    }

    // H1
    if (line.startsWith("# ")) {
      flushList();
      elements.push(
        <h1 key={elements.length} className="text-2xl md:text-3xl font-bold text-foreground mb-6 mt-8 first:mt-0 pb-3 border-b border-primary/30">
          {parseInline(line.slice(2))}
        </h1>
      );
      i++;
      continue;
    }

    // H2
    if (line.startsWith("## ")) {
      flushList();
      elements.push(
        <h2 key={elements.length} className="text-xl md:text-2xl font-semibold text-foreground mb-4 mt-8 flex items-center gap-2">
          <span className="w-1 h-6 bg-primary rounded-full" />
          {parseInline(line.slice(3))}
        </h2>
      );
      i++;
      continue;
    }

    // H3
    if (line.startsWith("### ")) {
      flushList();
      elements.push(
        <h3 key={elements.length} className="text-lg font-medium text-foreground mb-3 mt-6">
          {parseInline(line.slice(4))}
        </h3>
      );
      i++;
      continue;
    }

    // Horizontal rule
    if (line.match(/^-{3,}$/) || line.match(/^\*{3,}$/)) {
      flushList();
      elements.push(
        <hr key={elements.length} className="my-8 border-t border-border/50" />
      );
      i++;
      continue;
    }

    // Unordered list
    if (line.match(/^[-*]\s/)) {
      if (!listItems || listItems.type !== "ul") {
        flushList();
        listItems = { type: "ul", items: [] };
      }
      listItems.items.push(parseInline(line.slice(2)));
      i++;
      continue;
    }

    // Ordered list
    if (line.match(/^\d+\.\s/)) {
      if (!listItems || listItems.type !== "ol") {
        flushList();
        listItems = { type: "ol", items: [] };
      }
      listItems.items.push(parseInline(line.replace(/^\d+\.\s/, "")));
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith(">")) {
      flushList();
      const quoteText = line.slice(1).trim();
      elements.push(
        <blockquote key={elements.length} className="my-4 pl-4 border-l-4 border-primary/50 italic text-muted-foreground bg-muted/20 py-3 pr-4 rounded-r">
          {parseInline(quoteText)}
        </blockquote>
      );
      i++;
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      flushList();
      i++;
      continue;
    }

    // Regular paragraph
    flushList();
    elements.push(
      <p key={elements.length} className="text-muted-foreground mb-4 leading-relaxed">
        {parseInline(line)}
      </p>
    );
    i++;
  }

  flushList();

  return (
    <div className="markdown-content">
      {elements}
    </div>
  );
}