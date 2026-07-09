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

// Minimal CSV parser for Deno (no PapaParse available easily)
function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[]; errors: string[] } {
  const errors: string[] = [];
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");

  if (lines.length === 0) {
    return { headers: [], rows: [], errors: ["CSV file is empty"] };
  }

  // Parse a single CSV line respecting quoted fields
  function parseLine(line: string): string[] {
    const fields: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        fields.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    fields.push(current.trim());
    return fields;
  }

  const headers = parseLine(lines[0]).map((h) => h.replace(/^"|"$/g, "").trim());

  if (headers.length === 0 || headers.every((h) => h === "")) {
    return { headers: [], rows: [], errors: ["CSV file has no headers"] };
  }

  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]).map((v) => v.replace(/^"|"$/g, "").trim());
    if (values.length === 0 || values.every((v) => v === "")) continue;
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? "";
    });
    rows.push(row);
  }

  if (rows.length === 0) {
    errors.push("CSV file has no data rows");
  }

  return { headers, rows, errors };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const contentType = req.headers.get("content-type") ?? "";

    let fileContent = "";
    let fileName = "upload.csv";
    let fileSize = 0;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return jsonResponse({ error: "No file uploaded" }, 400);
      }

      // Validate file type
      const ext = file.name.toLowerCase();
      if (!ext.endsWith(".csv") && file.type !== "text/csv") {
        return jsonResponse({ error: "Only CSV files are allowed" }, 400);
      }

      // 10MB limit
      if (file.size > 10 * 1024 * 1024) {
        return jsonResponse({ error: "File too large. Maximum size is 10MB" }, 400);
      }

      fileContent = await file.text();
      fileName = file.name;
      fileSize = file.size;
    } else if (contentType.includes("application/json")) {
      // Accept pre-parsed data from frontend PapaParse
      const body = await req.json() as {
        fileName?: string;
        fileSize?: number;
        headers?: string[];
        rows?: Record<string, string>[];
      };

      return jsonResponse({
        fileName: body.fileName ?? "upload.csv",
        fileSize: body.fileSize ?? 0,
        headers: body.headers ?? [],
        rows: body.rows ?? [],
        totalRows: (body.rows ?? []).length,
        totalColumns: (body.headers ?? []).length,
        parseWarnings: [],
      });
    } else {
      return jsonResponse({ error: "Unsupported content type" }, 400);
    }

    if (!fileContent || fileContent.trim() === "") {
      return jsonResponse({ error: "Uploaded file is empty" }, 400);
    }

    const { headers, rows, errors } = parseCSV(fileContent);

    if (errors.length > 0 && rows.length === 0) {
      return jsonResponse({ error: errors[0] }, 400);
    }

    return jsonResponse({
      fileName,
      fileSize,
      headers,
      rows,
      totalRows: rows.length,
      totalColumns: headers.length,
      parseWarnings: errors,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return jsonResponse({ error: message }, 500);
  }
});
