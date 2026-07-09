import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.21.0";

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

interface CRMRecord {
  created_at: string;
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: string;
  crm_note: string;
  data_source: string;
  possession_time: string;
  description: string;
}

function buildPrompt(headers: string[], rows: Record<string, string>[], batchIndex: number, totalBatches: number): string {
  return `You are a CRM data extraction AI. Map CSV data from ANY format into GrowEasy CRM standard format.

Batch ${batchIndex + 1} of ${totalBatches}.

CSV Headers: ${headers.join(", ")}

RECORDS TO PROCESS (JSON):
${JSON.stringify(rows)}

FIELD MAPPING RULES (map any column name intelligently, case-insensitive):
- "name": Full Name, Customer Name, Lead Name, Person, Contact Name, Client, fname+lname, Name
- "email": Email, Email Address, Mail, Primary Email, E-mail
- "mobile_without_country_code": Mobile, Phone, WhatsApp, Cell, Contact Number, Tel
- "country_code": Country Code, Dial Code, ISD. Strip from mobile if starts with +. Default "91"
- "company": Company, Organization, Firm, Business, Employer
- "city": City, Town, Location, Area, Locality
- "state": State, Province, Region
- "country": Country, Nation
- "lead_owner": Owner, Assigned To, Sales Rep, Agent, Executive, Handler
- "crm_status": Status, Stage, Lead Status, Deal Stage
- "crm_note": Notes, Remarks, Comments, Follow Up, Feedback + extra emails/phones
- "data_source": Source, Lead Source, Campaign
- "created_at": Date, Created At, Timestamp, Form Date
- "possession_time": Possession, Move In, Available From
- "description": Description, Details, Summary, Product, Property

crm_status ALLOWED VALUES ONLY (map intelligently):
- "GOOD_LEAD_FOLLOW_UP": hot, interested, follow up, warm, callback, active, new, fresh, open
- "DID_NOT_CONNECT": no answer, not connected, unreachable, busy, voicemail, dnc, switched off
- "BAD_LEAD": not interested, invalid, junk, spam, wrong number, rejected, fake, closed lost
- "SALE_DONE": sold, closed won, converted, purchased, booked, deal closed, won
- "" (empty string) if undetermined

data_source ALLOWED VALUES ONLY:
- "leads_on_demand", "meridian_tower", "eden_park", "varah_swamy", "sarjapur_plots"
- "" (empty string) if no match

RULES:
1. Strip country code from mobile. Store digits only. Default country_code="91"
2. Multiple phones: first in mobile_without_country_code, others in crm_note
3. Multiple emails: first in email, others in crm_note
4. created_at: ISO 8601 format like 2026-05-13T14:20:48Z. Use current time if missing.
5. SKIP records missing BOTH email AND mobile — do not include them in the output array
6. Lowercase emails, digits-only phones, title-case names

CRITICAL: Return ONLY valid JSON. No markdown, no code fences, no explanation text.
Return EXACTLY this schema with one object per VALID record (skip invalid ones):
{"records":[{"created_at":"","name":"","email":"","country_code":"","mobile_without_country_code":"","company":"","city":"","state":"","country":"","lead_owner":"","crm_status":"","crm_note":"","data_source":"","possession_time":"","description":""}]}

Process all ${rows.length} records now. Return ONLY the JSON.`;
}

function cleanJson(raw: string): string {
  let s = raw.trim();
  // Strip markdown code fences
  s = s.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");
  // Find JSON object boundaries
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start !== -1 && end !== -1) {
    s = s.substring(start, end + 1);
  }
  return s;
}

const ALLOWED_STATUSES = new Set(["GOOD_LEAD_FOLLOW_UP", "DID_NOT_CONNECT", "BAD_LEAD", "SALE_DONE", ""]);
const ALLOWED_SOURCES = new Set(["leads_on_demand", "meridian_tower", "eden_park", "varah_swamy", "sarjapur_plots", ""]);

function validateRecord(r: Partial<CRMRecord>): CRMRecord {
  return {
    created_at: r.created_at || new Date().toISOString(),
    name: (r.name ?? "").trim(),
    email: (r.email ?? "").toLowerCase().trim(),
    country_code: (r.country_code ?? "91").trim(),
    mobile_without_country_code: (r.mobile_without_country_code ?? "").replace(/\D/g, ""),
    company: (r.company ?? "").trim(),
    city: (r.city ?? "").trim(),
    state: (r.state ?? "").trim(),
    country: (r.country ?? "").trim(),
    lead_owner: (r.lead_owner ?? "").trim(),
    crm_status: ALLOWED_STATUSES.has((r.crm_status ?? "").trim()) ? (r.crm_status ?? "").trim() : "",
    crm_note: (r.crm_note ?? "").trim(),
    data_source: ALLOWED_SOURCES.has((r.data_source ?? "").trim()) ? (r.data_source ?? "").trim() : "",
    possession_time: (r.possession_time ?? "").trim(),
    description: (r.description ?? "").trim(),
  };
}

async function callGemini(
  genAI: GoogleGenerativeAI,
  modelName: string,
  prompt: string
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.1,
      topP: 0.8,
      maxOutputTokens: 8192,
    },
  });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

async function processBatchWithRetry(
  genAI: GoogleGenerativeAI,
  headers: string[],
  batch: Record<string, string>[],
  batchIndex: number,
  totalBatches: number,
  maxRetries = 4
): Promise<{ records: CRMRecord[]; skipped: number; error?: string }> {
  // Try models in priority order — if one hits quota, fall back to the next
  const modelQueue = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-flash-latest"];
  let lastError = "";

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Pick a model based on attempt — cycle through the queue
    const modelName = modelQueue[attempt % modelQueue.length];

    try {
      if (attempt > 0) {
        // Respect Gemini's retryDelay if we can parse it, otherwise exponential backoff
        const delay = Math.min(45000, 5000 * Math.pow(2, attempt - 1));
        await new Promise((r) => setTimeout(r, delay));
      }

      const prompt = buildPrompt(headers, batch, batchIndex, totalBatches);
      const text = await callGemini(genAI, modelName, prompt);

      if (!text || text.trim() === "") {
        throw new Error("Empty AI response");
      }

      const cleaned = cleanJson(text);
      let parsed: { records?: Partial<CRMRecord>[] };

      try {
        parsed = JSON.parse(cleaned);
      } catch (parseErr) {
        throw new Error(`JSON parse failed: ${(parseErr as Error).message}. Raw (first 300 chars): ${text.substring(0, 300)}`);
      }

      if (!parsed || !Array.isArray(parsed.records)) {
        throw new Error(`Invalid AI response format: no records array. Raw (first 300 chars): ${text.substring(0, 300)}`);
      }

      const validRecords: CRMRecord[] = [];
      let skipped = 0;

      for (const rec of parsed.records) {
        const v = validateRecord(rec);
        const hasEmail = v.email.length > 0 && v.email.includes("@");
        const hasMobile = v.mobile_without_country_code.length >= 7;

        if (!hasEmail && !hasMobile) {
          skipped++;
          continue;
        }
        validRecords.push(v);
      }

      const totalProcessed = validRecords.length + skipped;
      if (totalProcessed < batch.length) {
        skipped += batch.length - totalProcessed;
      }

      return { records: validRecords, skipped };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      console.error(`Batch ${batchIndex + 1} attempt ${attempt + 1} (${modelName}) failed: ${lastError}`);

      // If it's a 404 (model not found) or 429 (quota), try the next model immediately
      if (lastError.includes("404") || lastError.includes("not found")) {
        continue; // skip to next model in queue
      }
      // For 429 quota errors, the backoff above will handle it
    }
  }

  return { records: [], skipped: batch.length, error: lastError };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) {
      return jsonResponse({ error: "Gemini API key not configured. Add GEMINI_API_KEY to Supabase Vault." }, 500);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json() as {
      rows: Record<string, string>[];
      headers: string[];
      fileName?: string;
      batchSize?: number;
    };

    const { rows, headers, fileName = "upload.csv", batchSize = 20 } = body;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return jsonResponse({ error: "No rows provided" }, 400);
    }
    if (!headers || !Array.isArray(headers) || headers.length === 0) {
      return jsonResponse({ error: "No headers provided" }, 400);
    }

    const totalBatches = Math.ceil(rows.length / batchSize);

    // Create job record in DB
    const { data: job, error: jobErr } = await supabase
      .from("import_jobs")
      .insert({
        status: "processing",
        file_name: fileName,
        total_rows: rows.length,
        total_batches: totalBatches,
        completed_batches: 0,
        processed_records: 0,
        skipped_count: 0,
        results: [],
        headers: headers,
        rows: rows,
      })
      .select("id")
      .single();

    if (jobErr || !job) {
      return jsonResponse({ error: "Failed to create job: " + (jobErr?.message ?? "unknown") }, 500);
    }

    const jobId = job.id as string;

    // Respond immediately with jobId
    const responsePromise = jsonResponse({ jobId, totalBatches, totalRows: rows.length });

    // Process all batches in background
    const genAI = new GoogleGenerativeAI(geminiKey);

    const processingTask = (async () => {
      let allRecords: CRMRecord[] = [];
      let totalSkipped = 0;
      const batchErrors: string[] = [];

      for (let i = 0; i < totalBatches; i++) {
        const start = i * batchSize;
        const end = Math.min(start + batchSize, rows.length);
        const batch = rows.slice(start, end);

        const { records, skipped, error } = await processBatchWithRetry(genAI, headers, batch, i, totalBatches);
        allRecords = [...allRecords, ...records];
        totalSkipped += skipped;
        if (error) batchErrors.push(`Batch ${i + 1}: ${error}`);

        // Update progress after each batch
        await supabase
          .from("import_jobs")
          .update({
            completed_batches: i + 1,
            processed_records: allRecords.length,
            skipped_count: totalSkipped,
          })
          .eq("id", jobId);

        // Rate limit: pause between batches to respect free-tier RPM limits
        // (Gemini free tier allows ~15 RPM for 2.0-flash)
        if (i < totalBatches - 1) {
          await new Promise((r) => setTimeout(r, 5000));
        }
      }

      // Mark completed with all results
      await supabase
        .from("import_jobs")
        .update({
          status: "completed",
          completed_batches: totalBatches,
          processed_records: allRecords.length,
          skipped_count: totalSkipped,
          results: allRecords,
          rows: [],
          error_message: batchErrors.length > 0 ? batchErrors.join("; ") : null,
        })
        .eq("id", jobId);
    })();

    if (typeof EdgeRuntime !== "undefined") {
      EdgeRuntime.waitUntil(
        processingTask.catch(async (err) => {
          await supabase
            .from("import_jobs")
            .update({ status: "failed", error_message: err instanceof Error ? err.message : "Unknown error" })
            .eq("id", jobId);
        })
      );
    } else {
      await processingTask.catch(async (err) => {
        await supabase
          .from("import_jobs")
          .update({ status: "failed", error_message: err instanceof Error ? err.message : "Unknown error" })
          .eq("id", jobId);
      });
    }

    return responsePromise;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return jsonResponse({ error: message }, 500);
  }
});
