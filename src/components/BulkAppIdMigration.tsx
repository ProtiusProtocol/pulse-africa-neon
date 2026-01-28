import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  Download,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  ArrowRightLeft,
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Market = Tables<'markets'>;

interface MigrationRow {
  outcome_ref: string;
  new_app_id: string;
  current_app_id?: string;
  status: 'pending' | 'valid' | 'invalid' | 'updated';
  error?: string;
}

interface BulkAppIdMigrationProps {
  markets: Market[];
  onMigrationComplete: () => void;
}

export function BulkAppIdMigration({ markets, onMigrationComplete }: BulkAppIdMigrationProps) {
  const [migrationRows, setMigrationRows] = useState<MigrationRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Export current outcome_ref → app_id mapping as CSV
  const handleExportMapping = () => {
    const csvContent = [
      'outcome_ref,current_app_id,title',
      ...markets.map(m => 
        `"${m.outcome_ref || ''}","${m.app_id}","${m.title.replace(/"/g, '""')}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `market-mapping-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export complete",
      description: `Exported ${markets.length} markets to CSV`,
    });
  };

  // Parse uploaded CSV
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      // Skip header row
      const dataLines = lines.slice(1);
      
      const rows: MigrationRow[] = dataLines.map(line => {
        // Simple CSV parsing (handles quoted values)
        const matches = line.match(/("([^"]*)"|[^,]+)/g) || [];
        const cleanValue = (val: string) => val?.replace(/^"|"$/g, '').trim() || '';
        
        const outcome_ref = cleanValue(matches[0] || '');
        const new_app_id = cleanValue(matches[1] || '');

        // Validate against existing markets
        const existingMarket = markets.find(m => m.outcome_ref === outcome_ref);
        
        if (!outcome_ref) {
          return {
            outcome_ref,
            new_app_id,
            status: 'invalid' as const,
            error: 'Missing outcome_ref',
          };
        }

        if (!new_app_id) {
          return {
            outcome_ref,
            new_app_id,
            status: 'invalid' as const,
            error: 'Missing new_app_id',
          };
        }

        if (!existingMarket) {
          return {
            outcome_ref,
            new_app_id,
            status: 'invalid' as const,
            error: 'No market found with this outcome_ref',
          };
        }

        return {
          outcome_ref,
          new_app_id,
          current_app_id: existingMarket.app_id,
          status: 'valid' as const,
        };
      });

      setMigrationRows(rows);
      setShowPreview(true);
    };

    reader.readAsText(file);
    
    // Reset input so same file can be re-uploaded
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Execute the migration
  const handleExecuteMigration = async () => {
    const validRows = migrationRows.filter(r => r.status === 'valid');
    
    if (validRows.length === 0) {
      toast({
        title: "No valid rows",
        description: "Please fix the errors before proceeding",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    let successCount = 0;
    let errorCount = 0;

    const updatedRows = [...migrationRows];

    for (let i = 0; i < updatedRows.length; i++) {
      const row = updatedRows[i];
      if (row.status !== 'valid') continue;

      try {
        const { error } = await supabase
          .from('markets')
          .update({ app_id: row.new_app_id })
          .eq('outcome_ref', row.outcome_ref);

        if (error) {
          updatedRows[i] = { ...row, status: 'invalid', error: error.message };
          errorCount++;
        } else {
          updatedRows[i] = { ...row, status: 'updated' };
          successCount++;
        }
      } catch (err) {
        updatedRows[i] = { 
          ...row, 
          status: 'invalid', 
          error: err instanceof Error ? err.message : 'Unknown error' 
        };
        errorCount++;
      }

      setMigrationRows([...updatedRows]);
    }

    setIsProcessing(false);

    toast({
      title: "Migration complete",
      description: `Updated ${successCount} markets${errorCount > 0 ? `, ${errorCount} errors` : ''}`,
      variant: errorCount > 0 ? "destructive" : "default",
    });

    if (successCount > 0) {
      onMigrationComplete();
    }
  };

  const validCount = migrationRows.filter(r => r.status === 'valid').length;
  const invalidCount = migrationRows.filter(r => r.status === 'invalid').length;
  const updatedCount = migrationRows.filter(r => r.status === 'updated').length;

  return (
    <Card className="border-secondary/50 bg-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5 text-secondary" />
          <CardTitle className="text-lg">Bulk App ID Migration</CardTitle>
        </div>
        <CardDescription>
          Migrate from TestNet to MainNet by updating app_id values in bulk using outcome_ref mapping
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Step 1: Export */}
        <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-sm">
            1
          </div>
          <div className="flex-1">
            <h4 className="font-medium mb-1">Export Current Mapping</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Download CSV with outcome_ref → app_id mapping to use as template
            </p>
            <Button variant="outline" size="sm" onClick={handleExportMapping}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV ({markets.length} markets)
            </Button>
          </div>
        </div>

        {/* Step 2: Upload */}
        <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-sm">
            2
          </div>
          <div className="flex-1">
            <h4 className="font-medium mb-1">Upload Updated CSV</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Update the CSV with new MainNet app_id values (columns: outcome_ref, new_app_id)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload CSV
            </Button>
          </div>
        </div>

        {/* Preview & Execute */}
        {showPreview && migrationRows.length > 0 && (
          <div className="space-y-4 border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">Migration Preview</h4>
                <Badge variant="outline" className="text-xs">
                  {migrationRows.length} rows
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                {validCount > 0 && (
                  <Badge className="bg-primary/20 text-primary border-primary text-xs">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {validCount} valid
                  </Badge>
                )}
                {invalidCount > 0 && (
                  <Badge className="bg-destructive/20 text-destructive border-destructive text-xs">
                    <XCircle className="w-3 h-3 mr-1" />
                    {invalidCount} invalid
                  </Badge>
                )}
                {updatedCount > 0 && (
                  <Badge className="bg-accent/20 text-accent border-accent text-xs">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {updatedCount} updated
                  </Badge>
                )}
              </div>
            </div>

            {/* Preview Table */}
            <div className="max-h-64 overflow-y-auto border border-border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left p-2 font-medium">Status</th>
                    <th className="text-left p-2 font-medium">Outcome Ref</th>
                    <th className="text-left p-2 font-medium">Current App ID</th>
                    <th className="text-left p-2 font-medium">New App ID</th>
                    <th className="text-left p-2 font-medium">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {migrationRows.map((row, idx) => (
                    <tr key={idx} className="border-t border-border/50">
                      <td className="p-2">
                        {row.status === 'valid' && (
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                        )}
                        {row.status === 'invalid' && (
                          <XCircle className="w-4 h-4 text-destructive" />
                        )}
                        {row.status === 'updated' && (
                          <CheckCircle2 className="w-4 h-4 text-accent" />
                        )}
                        {row.status === 'pending' && (
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        )}
                      </td>
                      <td className="p-2 font-mono text-xs">{row.outcome_ref || '—'}</td>
                      <td className="p-2 font-mono text-xs text-muted-foreground">
                        {row.current_app_id || '—'}
                      </td>
                      <td className="p-2 font-mono text-xs">{row.new_app_id || '—'}</td>
                      <td className="p-2 text-xs text-destructive">{row.error || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Execute Button */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertTriangle className="w-4 h-4 text-secondary" />
                This will update app_id values in the database
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setShowPreview(false);
                    setMigrationRows([]);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="neon"
                  size="sm"
                  onClick={handleExecuteMigration}
                  disabled={isProcessing || validCount === 0}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Migrating...
                    </>
                  ) : (
                    <>
                      <ArrowRightLeft className="w-4 h-4 mr-2" />
                      Execute Migration ({validCount})
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
