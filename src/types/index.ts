export interface CRMRecord {
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
  crm_status: CRMStatus | "";
  crm_note: string;
  data_source: DataSource | "";
  possession_time: string;
  description: string;
}

export type CRMStatus =
  | "GOOD_LEAD_FOLLOW_UP"
  | "DID_NOT_CONNECT"
  | "BAD_LEAD"
  | "SALE_DONE";

export type DataSource =
  | "leads_on_demand"
  | "meridian_tower"
  | "eden_park"
  | "varah_swamy"
  | "sarjapur_plots"
  | "";

export type AppStep = "landing" | "preview" | "processing" | "results";

export interface ParsedCSV {
  headers: string[];
  rows: Record<string, string>[];
  fileName: string;
  fileSize: number;
  totalRows: number;
  totalColumns: number;
}

export interface ProcessingJob {
  jobId: string;
  totalBatches: number;
  totalRows: number;
}

export interface JobStatus {
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  totalBatches: number;
  completedBatches: number;
  totalRows: number;
  processedRecords: number;
  skippedCount: number;
  fileName: string;
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
  results: CRMRecord[];
}

export interface ImportResults {
  imported: CRMRecord[];
  skippedCount: number;
  totalRows: number;
  fileName: string;
  completedAt: string;
}
