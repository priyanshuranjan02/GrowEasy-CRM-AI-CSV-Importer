export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const DEFAULT_BATCH_SIZE = 20;
export const POLL_INTERVAL_MS = 2000;

export const CRM_STATUS_LABELS: Record<string, string> = {
  GOOD_LEAD_FOLLOW_UP: "Good Lead - Follow Up",
  DID_NOT_CONNECT: "Did Not Connect",
  BAD_LEAD: "Bad Lead",
  SALE_DONE: "Sale Done",
};

export const CRM_STATUS_COLORS: Record<string, string> = {
  GOOD_LEAD_FOLLOW_UP: "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950 dark:border-emerald-800",
  DID_NOT_CONNECT: "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950 dark:border-amber-800",
  BAD_LEAD: "text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950 dark:border-red-800",
  SALE_DONE: "text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950 dark:border-blue-800",
};

export const DATA_SOURCE_LABELS: Record<string, string> = {
  leads_on_demand: "Leads on Demand",
  meridian_tower: "Meridian Tower",
  eden_park: "Eden Park",
  varah_swamy: "Varah Swamy",
  sarjapur_plots: "Sarjapur Plots",
};

export const SUPPORTED_FORMATS = [
  "Facebook Lead Ads",
  "Google Ads",
  "Excel Export",
  "Real Estate CRM",
  "Marketing Agency",
  "Sales Reports",
  "Manual Spreadsheets",
  "Unknown Formats",
];
