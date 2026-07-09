import type { JobStatus } from "../types/index";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const FUNCTIONS_BASE = `${SUPABASE_URL}/functions/v1`;

export class APIError extends Error {
  statusCode?: number;
  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = "APIError";
    this.statusCode = statusCode;
  }
}

function supabaseHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    ...extra,
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const body = await response.json() as { error?: string };
      errorMessage = body.error ?? errorMessage;
    } catch {
      // ignore
    }
    throw new APIError(errorMessage, response.status);
  }
  return response.json() as Promise<T>;
}

export interface UploadResponse {
  fileName: string;
  fileSize: number;
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
  totalColumns: number;
  parseWarnings: string[];
}

/** Upload a CSV file to the edge function for server-side parsing */
export async function uploadCSV(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${FUNCTIONS_BASE}/csv-upload`, {
    method: "POST",
    headers: supabaseHeaders(),
    body: formData,
  });

  return handleResponse<UploadResponse>(response);
}

/** Send pre-parsed data (from PapaParse) directly — skips re-upload */
export async function sendParsedCSV(
  headers: string[],
  rows: Record<string, string>[],
  fileName: string,
  fileSize: number
): Promise<UploadResponse> {
  const response = await fetch(`${FUNCTIONS_BASE}/csv-upload`, {
    method: "POST",
    headers: supabaseHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ headers, rows, fileName, fileSize }),
  });

  return handleResponse<UploadResponse>(response);
}

export interface StartProcessResponse {
  jobId: string;
  totalBatches: number;
  totalRows: number;
}

/** Start AI processing — returns jobId immediately, processing runs in background */
export async function startProcess(
  rows: Record<string, string>[],
  headers: string[],
  fileName: string,
  batchSize?: number
): Promise<StartProcessResponse> {
  const response = await fetch(`${FUNCTIONS_BASE}/csv-process`, {
    method: "POST",
    headers: supabaseHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ rows, headers, fileName, batchSize }),
  });

  return handleResponse<StartProcessResponse>(response);
}

/** Poll job status from the database-backed edge function */
export async function getJobStatus(jobId: string): Promise<JobStatus> {
  const response = await fetch(`${FUNCTIONS_BASE}/job-status/${jobId}`, {
    headers: supabaseHeaders(),
  });

  return handleResponse<JobStatus>(response);
}

export async function checkHealth(): Promise<{ status: string }> {
  try {
    const response = await fetch(`${FUNCTIONS_BASE}/csv-upload`, {
      method: "OPTIONS",
      headers: supabaseHeaders(),
    });
    return { status: response.ok ? "ok" : "error" };
  } catch {
    return { status: "error" };
  }
}
