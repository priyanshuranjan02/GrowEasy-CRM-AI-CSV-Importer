import { create } from "zustand";
import type { AppStep, ParsedCSV, ProcessingJob, ImportResults } from "../types/index";

interface AppState {
  step: AppStep;
  parsedCSV: ParsedCSV | null;
  processingJob: ProcessingJob | null;
  importResults: ImportResults | null;
  setStep: (step: AppStep) => void;
  setParsedCSV: (csv: ParsedCSV | null) => void;
  setProcessingJob: (job: ProcessingJob | null) => void;
  setImportResults: (results: ImportResults | null) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  step: "landing",
  parsedCSV: null,
  processingJob: null,
  importResults: null,
  setStep: (step: AppStep) => set({ step }),
  setParsedCSV: (parsedCSV: ParsedCSV | null) => set({ parsedCSV }),
  setProcessingJob: (processingJob: ProcessingJob | null) => set({ processingJob }),
  setImportResults: (importResults: ImportResults | null) => set({ importResults }),
  reset: () => set({ step: "landing", parsedCSV: null, processingJob: null, importResults: null }),
}));

// Dev helper
if (typeof window !== "undefined" && import.meta.env.DEV) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__appStore = useAppStore;
}
