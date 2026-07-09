import { useMemo, useState, useCallback } from "react";
import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  getFilteredRowModel, getPaginationRowModel, flexRender,
  type ColumnDef, type SortingState,
} from "@tanstack/react-table";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight,
  Search, FileText, ArrowLeft, Sparkles, ArrowRight, Table2, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "../store/appStore";
import { formatFileSize } from "../utils/csv";
import { startProcess } from "../services/api";
import { GeminiKeyBanner } from "../components/GeminiKeyBanner";
import type { ProcessingJob } from "../types";

export function PreviewPage() {
  const { parsedCSV, setStep, setProcessingJob, reset } = useAppStore();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [showKeyBanner, setShowKeyBanner] = useState(false);

  const data = useMemo(() => parsedCSV?.rows ?? [], [parsedCSV?.rows]);

  const columns = useMemo<ColumnDef<Record<string, string>>[]>(() => {
    if (!parsedCSV?.headers) return [];
    return parsedCSV.headers.map((header) => ({
      accessorKey: header,
      header,
      cell: ({ getValue }) => {
        const value = getValue() as string;
        return (
          <div className="max-w-[200px] truncate text-sm text-foreground" title={value}>
            {value || <span className="text-muted-foreground/50 italic">—</span>}
          </div>
        );
      },
    }));
  }, [parsedCSV?.headers]);

  const table = useReactTable({
    data, columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 25 } },
  });

  const handleConfirm = useCallback(async () => {
    if (!parsedCSV) return;
    setIsConfirming(true);
    try {
      const result = await startProcess(parsedCSV.rows, parsedCSV.headers, parsedCSV.fileName, 20);
      const job: ProcessingJob = { jobId: result.jobId, totalBatches: result.totalBatches, totalRows: result.totalRows };
      setProcessingJob(job);
      setStep("processing");
      toast.success("AI processing started!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to start processing";
      toast.error(msg);
      if (msg.toLowerCase().includes("gemini") || msg.toLowerCase().includes("api key") || msg.toLowerCase().includes("500")) {
        setShowKeyBanner(true);
      }
    } finally {
      setIsConfirming(false);
    }
  }, [parsedCSV, setProcessingJob, setStep]);

  if (!parsedCSV) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FileText className="size-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No CSV data loaded</p>
          <Button variant="outline" className="mt-4" onClick={() => setStep("landing")}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => { reset(); setStep("landing"); }}>
              <ArrowLeft className="size-4" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-lg bg-primary flex items-center justify-center">
                <Sparkles className="size-3.5 text-primary-foreground" />
              </div>
              <span className="font-semibold tracking-tight">GrowEasy CRM</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-muted-foreground">
              <ChevronRight className="size-4" />
              <span className="text-sm">Preview</span>
            </div>
          </div>
          <Button onClick={handleConfirm} disabled={isConfirming} size="lg" className="gap-2 shrink-0">
            {isConfirming ? <><RefreshCw className="size-4 animate-spin" />Starting...</> : <><Sparkles className="size-4" />Confirm Import<ArrowRight className="size-4" /></>}
          </Button>
        </div>
      </header>

      <div className="flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 py-6">
        {showKeyBanner && <GeminiKeyBanner />}

        {/* Stats cards */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: "File Name", value: parsedCSV.fileName, icon: FileText, truncate: true },
            { label: "File Size", value: formatFileSize(parsedCSV.fileSize), icon: Table2 },
            { label: "Total Rows", value: parsedCSV.totalRows.toLocaleString(), icon: Table2 },
            { label: "Columns", value: parsedCSV.totalColumns.toLocaleString(), icon: Table2 },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-border/60 bg-card p-4">
              <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">{item.label}</p>
              <p className={`font-semibold text-sm ${item.truncate ? "truncate" : ""}`} title={item.value}>{item.value}</p>
            </div>
          ))}
        </motion.div>

        {/* Detected headers */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Detected Headers</p>
          <div className="flex flex-wrap gap-1.5">
            {parsedCSV.headers.map((h) => (
              <Badge key={h} variant="secondary" className="text-xs font-mono">{h}</Badge>
            ))}
          </div>
        </motion.div>

        {/* Search bar */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Search all columns..." value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} className="pl-9" />
          </div>
          <span className="text-sm text-muted-foreground self-center">
            {table.getFilteredRowModel().rows.length.toLocaleString()} rows
          </span>
        </motion.div>

        {/* Table */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-border/60 bg-card overflow-hidden">
          <div className="overflow-auto max-h-[calc(100vh-460px)] min-h-[300px]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm border-b border-border/60">
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    <th className="w-12 px-3 py-3 text-left text-xs font-medium text-muted-foreground border-r border-border/40">#</th>
                    {hg.headers.map((header) => (
                      <th key={header.id} className="px-3 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap cursor-pointer select-none hover:text-foreground group" onClick={header.column.getToggleSortingHandler()}>
                        <div className="flex items-center gap-1.5">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <span className="text-muted-foreground/50">
                            {header.column.getIsSorted() === "asc" ? <ChevronUp className="size-3.5" /> : header.column.getIsSorted() === "desc" ? <ChevronDown className="size-3.5" /> : <ChevronsUpDown className="size-3.5 opacity-0 group-hover:opacity-100" />}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.length === 0 ? (
                  <tr><td colSpan={parsedCSV.headers.length + 1} className="px-4 py-16 text-center text-muted-foreground">
                    <Search className="size-8 mx-auto mb-2 opacity-30" /><p>No rows match your search</p>
                  </td></tr>
                ) : (
                  table.getRowModel().rows.map((row, idx) => (
                    <tr key={row.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2.5 text-xs text-muted-foreground border-r border-border/30 select-none">
                        {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + idx + 1}
                      </td>
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-3 py-2.5">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border/40 bg-muted/20">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Rows per page:</span>
              <Select value={String(table.getState().pagination.pageSize)} onValueChange={(v) => table.setPageSize(Number(v))}>
                <SelectTrigger className="h-8 w-16"><SelectValue /></SelectTrigger>
                <SelectContent>{[25, 50, 100].map((s) => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span>Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}</span>
              <div className="flex gap-1 ml-3">
                <Button variant="outline" size="icon" className="size-8" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}><ChevronLeft className="size-4" /></Button>
                <Button variant="outline" size="icon" className="size-8" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}><ChevronRight className="size-4" /></Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-xl border border-primary/20 bg-primary/5">
          <div>
            <p className="font-semibold">Ready to import?</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {parsedCSV.totalRows.toLocaleString()} rows will be processed by AI in ~{Math.ceil(parsedCSV.totalRows / 20)} batch{Math.ceil(parsedCSV.totalRows / 20) !== 1 ? "es" : ""}
            </p>
          </div>
          <Button onClick={handleConfirm} disabled={isConfirming} size="lg" className="gap-2 w-full sm:w-auto">
            {isConfirming ? <><RefreshCw className="size-4 animate-spin" />Starting...</> : <><Sparkles className="size-4" />Confirm Import</>}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
