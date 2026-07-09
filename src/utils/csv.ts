import Papa from "papaparse";
import type { CRMRecord } from "../types/index";

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function exportToJSON(records: CRMRecord[], fileName: string): void {
  const data = JSON.stringify(records, null, 2);
  downloadBlob(new Blob([data], { type: "application/json" }), `${stripExt(fileName)}_imported.json`);
}

export function exportToCSV(records: CRMRecord[], fileName: string): void {
  const csv = Papa.unparse(records, { header: true, newline: "\r\n" });
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), `${stripExt(fileName)}_imported.csv`);
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function stripExt(fileName: string): string {
  return fileName.replace(/\.[^/.]+$/, "");
}

export function validateCSVFile(file: File): string | null {
  if (file.size > 10 * 1024 * 1024) {
    return `File too large. Maximum size is 10MB (got ${formatFileSize(file.size)})`;
  }
  const ext = file.name.toLowerCase();
  if (!ext.endsWith(".csv") && file.type !== "text/csv" && file.type !== "application/csv") {
    return "Invalid file type. Please upload a CSV file";
  }
  return null;
}

export function parseCSVLocally(file: File): Promise<{
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
  totalColumns: number;
}> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      transform: (v) => v.trim(),
      dynamicTyping: false,
      complete: (results) => {
        const headers = results.meta.fields ?? [];
        const rows = results.data;
        if (headers.length === 0) { reject(new Error("CSV file has no headers")); return; }
        if (rows.length === 0) { reject(new Error("CSV file has no data rows")); return; }
        resolve({ headers, rows, totalRows: rows.length, totalColumns: headers.length });
      },
      error: (err) => reject(new Error(err.message)),
    });
  });
}
