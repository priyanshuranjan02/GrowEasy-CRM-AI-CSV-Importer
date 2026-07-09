import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "GET") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const url = new URL(req.url);
    // URL pattern: /job-status/{jobId}
    const pathParts = url.pathname.split("/").filter(Boolean);
    const jobId = pathParts[pathParts.length - 1];

    if (!jobId || jobId === "job-status") {
      return jsonResponse({ error: "Job ID is required" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: job, error } = await supabase
      .from("import_jobs")
      .select("id, status, file_name, total_rows, total_batches, completed_batches, processed_records, skipped_count, results, error_message, created_at, updated_at")
      .eq("id", jobId)
      .maybeSingle();

    if (error) {
      return jsonResponse({ error: "Database error" }, 500);
    }

    if (!job) {
      return jsonResponse({ error: "Job not found" }, 404);
    }

    return jsonResponse({
      jobId: job.id,
      status: job.status,
      fileName: job.file_name,
      totalRows: job.total_rows,
      totalBatches: job.total_batches,
      completedBatches: job.completed_batches,
      processedRecords: job.processed_records,
      skippedCount: job.skipped_count,
      startedAt: job.created_at,
      completedAt: job.status === "completed" ? job.updated_at : undefined,
      errorMessage: job.error_message,
      results: job.status === "completed" ? job.results : [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return jsonResponse({ error: message }, 500);
  }
});
