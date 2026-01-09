import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, HeadingLevel, WidthType, BorderStyle } from "https://esm.sh/docx@8.5.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Outcome {
  id: string;
  signal_code: string;
  question_text: string;
  resolution_criteria: string | null;
  deadline: string;
  status: string;
  probability_current: number | null;
  drift_direction: string | null;
  category: string;
  region: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting outcomes export to DOCX');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch all outcomes ordered by signal code
    const { data: outcomes, error } = await supabase
      .from('outcomes_watchlist')
      .select('*')
      .order('signal_code', { ascending: true })
      .order('deadline', { ascending: true });

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    console.log(`Fetched ${outcomes?.length || 0} outcomes`);

    // Group outcomes by signal code
    const groupedOutcomes: Record<string, Outcome[]> = {};
    for (const outcome of outcomes || []) {
      if (!groupedOutcomes[outcome.signal_code]) {
        groupedOutcomes[outcome.signal_code] = [];
      }
      groupedOutcomes[outcome.signal_code].push(outcome);
    }

    // Build document sections
    const children: any[] = [
      new Paragraph({
        text: "Augurion Outcomes Watchlist",
        heading: HeadingLevel.TITLE,
        spacing: { after: 400 },
      }),
      new Paragraph({
        text: `Exported: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`,
        spacing: { after: 400 },
      }),
      new Paragraph({
        text: `Total Outcomes: ${outcomes?.length || 0}`,
        spacing: { after: 600 },
      }),
    ];

    // Add each signal group
    const signalCodes = Object.keys(groupedOutcomes).sort();
    
    for (const signalCode of signalCodes) {
      const signalOutcomes = groupedOutcomes[signalCode];
      
      // Signal header
      children.push(
        new Paragraph({
          text: `${signalCode} (${signalOutcomes.length} outcomes)`,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        })
      );

      // Create table for this signal's outcomes
      const tableRows = [
        // Header row
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "#", bold: true })] })],
              width: { size: 5, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "Question", bold: true })] })],
              width: { size: 40, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "Status", bold: true })] })],
              width: { size: 10, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "Deadline", bold: true })] })],
              width: { size: 15, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "Probability", bold: true })] })],
              width: { size: 10, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "Resolution Criteria", bold: true })] })],
              width: { size: 20, type: WidthType.PERCENTAGE },
            }),
          ],
        }),
      ];

      // Data rows
      signalOutcomes.forEach((outcome, index) => {
        const deadlineDate = new Date(outcome.deadline);
        const formattedDeadline = deadlineDate.toLocaleDateString('en-GB', { 
          day: 'numeric', 
          month: 'short', 
          year: 'numeric' 
        });

        tableRows.push(
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: String(index + 1) })],
              }),
              new TableCell({
                children: [new Paragraph({ text: outcome.question_text })],
              }),
              new TableCell({
                children: [new Paragraph({ text: outcome.status })],
              }),
              new TableCell({
                children: [new Paragraph({ text: formattedDeadline })],
              }),
              new TableCell({
                children: [new Paragraph({ text: outcome.probability_current ? `${outcome.probability_current}%` : '-' })],
              }),
              new TableCell({
                children: [new Paragraph({ text: outcome.resolution_criteria || '-' })],
              }),
            ],
          })
        );
      });

      children.push(
        new Table({
          rows: tableRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
        })
      );

      children.push(new Paragraph({ text: "", spacing: { after: 400 } }));
    }

    // Create document
    const doc = new Document({
      sections: [{
        properties: {},
        children: children,
      }],
    });

    // Generate buffer
    const buffer = await Packer.toBuffer(doc);
    console.log('Document generated successfully');

    return new Response(buffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="Augurion_Outcomes_Watchlist.docx"',
      },
    });

  } catch (error: unknown) {
    console.error('Export error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
