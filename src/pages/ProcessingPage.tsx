import { useEffect, useRef, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Sparkles, CheckCircle2, AlertCircle, Loader2, BarChart3, FileText, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "../store/appStore";
import { getJobStatus } from "../services/api";
import { POLL_INTERVAL_MS } from "../constants";
import type { ImportResults, JobStatus } from "../types";

export function ProcessingPage() {
  const { processingJob, parsedCSV, setImportResults, setStep } = useAppStore();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusRef = useRef<JobStatus | null>(null);
  const pollingRef = useRef(false);
  const forceUpdate = useCallback(() => { setTick((n) => n + 1); }, []);

  // Force re-render via state update when poll completes
  const [tick, setTick] = useState(0);
  void tick;

  const finishJob = useCallback((status: JobStatus) => {
    const results: ImportResults = {
      imported: status.results,
      skippedCount: status.skippedCount,
      totalRows: status.totalRows,
      fileName: status.fileName,
      completedAt: status.completedAt ?? new Date().toISOString(),
    };
    setImportResults(results);
    setTimeout(() => setStep("results"), 1000);
  }, [setImportResults, setStep]);

  const poll = useCallback(async () => {
    if (!processingJob || pollingRef.current) return;
    pollingRef.current = true;
    try {
      const status = await getJobStatus(processingJob.jobId);
      statusRef.current = status;
      forceUpdate();
      if (status.status === "completed") { finishJob(status); return; }
      if (status.status === "failed") { toast.error(status.errorMessage ?? "Processing failed"); return; }
      timerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
    } catch {
      timerRef.current = setTimeout(poll, POLL_INTERVAL_MS * 2);
    } finally {
      pollingRef.current = false;
    }
  }, [processingJob, finishJob, forceUpdate]);

  useEffect(() => {
    if (!processingJob) return;
    timerRef.current = setTimeout(poll, 1000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [processingJob, poll]);

  if (!processingJob) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="size-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No processing job found</p>
          <Button variant="outline" className="mt-4" onClick={() => setStep("landing")}>Go Back</Button>
        </div>
      </div>
    );
  }

  const currentStatus = statusRef.current;
  const completedBatches = currentStatus?.completedBatches ?? 0;
  const totalBatches = processingJob.totalBatches;
  const progress = totalBatches > 0 ? (completedBatches / totalBatches) * 100 : 0;
  const isDone = currentStatus?.status === "completed";
  const isFailed = currentStatus?.status === "failed";

  const statusLabel = isDone
    ? "Import Complete!"
    : isFailed
      ? "Processing Failed"
      : completedBatches === 0
        ? "Starting AI Processing..."
        : `Processing Batch ${completedBatches}/${totalBatches}`;

  const statusSub = isDone
    ? `${(currentStatus?.processedRecords ?? 0).toLocaleString()} records imported`
    : isFailed
      ? (currentStatus?.errorMessage ?? "An error occurred")
      : `Gemini AI is intelligently mapping your CSV fields`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-background to-background" />
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-xl">
        <div className="rounded-2xl border border-border/60 bg-card shadow-xl p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="size-5 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold text-lg">GrowEasy AI Importer</h1>
              <p className="text-sm text-muted-foreground">{parsedCSV?.fileName ?? "Processing..."}</p>
            </div>
          </div>

          {/* Status icon + label */}
          <AnimatePresence mode="wait">
            <motion.div key={statusLabel} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-6 text-center">
              <div className="flex justify-center mb-4">
                {isDone ? (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}
                    className="size-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle2 className="size-8 text-emerald-500" />
                  </motion.div>
                ) : isFailed ? (
                  <div className="size-16 rounded-full bg-destructive/10 flex items-center justify-center">
                    <AlertCircle className="size-8 text-destructive" />
                  </div>
                ) : (
                  <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Loader2 className="size-8 text-primary animate-spin" />
                  </div>
                )}
              </div>
              <h2 className="text-xl font-semibold mb-1">{statusLabel}</h2>
              <p className="text-sm text-muted-foreground">{statusSub}</p>
            </motion.div>
          </AnimatePresence>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>{completedBatches}/{totalBatches} batches</span>
              <span>{isDone ? 100 : Math.round(progress)}%</span>
            </div>
            <Progress value={isDone ? 100 : progress} className="h-2" />
          </div>

          {/* Batch list */}
          {totalBatches > 0 && (
            <div className="rounded-xl border border-border/40 bg-muted/20 p-3 max-h-48 overflow-y-auto mb-4">
              <div className="space-y-1.5">
                {Array.from({ length: totalBatches }, (_, i) => {
                  const batchStatus = i < completedBatches ? "done" : i === completedBatches && !isDone ? "current" : "pending";
                  return (
                    <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${batchStatus === "current" ? "bg-primary/10 border border-primary/20" : batchStatus === "done" ? "bg-emerald-500/5" : ""}`}>
                      <div className="shrink-0">
                        {batchStatus === "done" ? <CheckCircle2 className="size-4 text-emerald-500" />
                          : batchStatus === "current" ? <Loader2 className="size-4 text-primary animate-spin" />
                          : <div className="size-4 rounded-full border-2 border-muted-foreground/30" />}
                      </div>
                      <span className={`text-xs font-medium ${batchStatus === "done" ? "text-muted-foreground" : batchStatus === "current" ? "text-foreground" : "text-muted-foreground/50"}`}>
                        Batch {i + 1}/{totalBatches}
                      </span>
                      {batchStatus === "done" && (
                        <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">Done</Badge>
                      )}
                      {batchStatus === "current" && (
                        <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 bg-primary/10 text-primary border-primary/20">AI Processing</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total Rows", value: processingJob.totalRows.toLocaleString(), icon: FileText },
              { label: "Processed", value: (currentStatus?.processedRecords ?? 0).toLocaleString(), icon: BarChart3 },
              { label: "Skipped", value: (currentStatus?.skippedCount ?? 0).toLocaleString(), icon: Clock },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-border/40 bg-muted/20 p-3 text-center">
                <p className="text-xs text-muted-foreground mb-0.5">{s.label}</p>
                <p className="font-semibold text-sm">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-4 text-center text-xs text-muted-foreground">
          Gemini AI is mapping your CSV fields to CRM format via Supabase Edge Functions.
        </motion.p>
      </motion.div>
    </div>
  );
}
