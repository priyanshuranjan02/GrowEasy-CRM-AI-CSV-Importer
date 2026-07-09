import { useMemo, useState } from "react";
import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  getFilteredRowModel, getPaginationRowModel, flexRender,
  type ColumnDef, type SortingState,
} from "@tanstack/react-table";
import { motion } from "framer-motion";
import {
  Download, Search, RefreshCw, CheckCircle2, XCircle,
  ChevronLeft, ChevronRight, ChevronsUpDown, ChevronUp, ChevronDown,
  FileJson, FileText, Sparkles, TrendingUp, Users, SkipForward, BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAppStore } from "../store/appStore";
import { exportToCSV, exportToJSON } from "../utils/csv";
import { CRM_STATUS_LABELS, CRM_STATUS_COLORS, DATA_SOURCE_LABELS } from "../constants";
import type { CRMRecord } from "../types";

function StatusBadge({ status }: { status: string }) {
  if (!status) return <span className="text-muted-foreground/50 text-xs">—</span>;
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${CRM_STATUS_COLORS[status] ?? "bg-muted text-muted-foreground border-border"}`}>
      {CRM_STATUS_LABELS[status] ?? status}
    </span>
  );
}

function SourceBadge({ source }: { source: string }) {
  if (!source) return <span className="text-muted-foreground/50 text-xs">—</span>;
  return <Badge variant="outline" className="text-xs">{DATA_SOURCE_LABELS[source] ?? source}</Badge>;
}

export function ResultsPage() {
  const { importResults, reset } = useAppStore();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const records = useMemo(() => importResults?.imported ?? [], [importResults?.imported]);

  const stats = useMemo(() => {
    const total = importResults?.totalRows ?? 0;
    const imported = records.length;
    const skipped = importResults?.skippedCount ?? 0;
    const successRate = total > 0 ? Math.round((imported / total) * 100) : 0;
    const breakdown = records.reduce((acc, r) => {
      if (r.crm_status) acc[r.crm_status] = (acc[r.crm_status] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return { total, imported, skipped, successRate, breakdown };
  }, [records, importResults]);

  const columns = useMemo<ColumnDef<CRMRecord>[]>(() => [
    {
      accessorKey: "name", header: "Name",
      cell: ({ getValue }) => <div className="font-medium text-sm max-w-[150px] truncate" title={getValue() as string}>{(getValue() as string) || <span className="text-muted-foreground/50">—</span>}</div>,
    },
    {
      accessorKey: "email", header: "Email",
      cell: ({ getValue }) => <div className="text-xs font-mono text-muted-foreground max-w-[200px] truncate" title={getValue() as string}>{(getValue() as string) || <span className="opacity-50">—</span>}</div>,
    },
    {
      id: "phone", header: "Mobile",
      cell: ({ row }) => {
        const code = row.original.country_code;
        const num = row.original.mobile_without_country_code;
        if (!num) return <span className="text-muted-foreground/50 text-xs">—</span>;
        return <div className="text-xs font-mono whitespace-nowrap">{code ? `+${code} ` : ""}{num}</div>;
      },
    },
    {
      accessorKey: "company", header: "Company",
      cell: ({ getValue }) => <div className="text-sm max-w-[150px] truncate" title={getValue() as string}>{(getValue() as string) || <span className="text-muted-foreground/50">—</span>}</div>,
    },
    {
      id: "location", header: "Location",
      cell: ({ row }) => {
        const loc = [row.original.city, row.original.state, row.original.country].filter(Boolean).join(", ");
        return <div className="text-sm text-muted-foreground max-w-[150px] truncate" title={loc}>{loc || <span className="opacity-50">—</span>}</div>;
      },
    },
    { accessorKey: "crm_status", header: "Status", cell: ({ getValue }) => <StatusBadge status={getValue() as string} /> },
    { accessorKey: "data_source", header: "Source", cell: ({ getValue }) => <SourceBadge source={getValue() as string} /> },
    {
      accessorKey: "lead_owner", header: "Owner",
      cell: ({ getValue }) => <div className="text-sm text-muted-foreground max-w-[120px] truncate">{(getValue() as string) || <span className="opacity-50">—</span>}</div>,
    },
    {
      accessorKey: "crm_note", header: "Notes",
      cell: ({ getValue }) => {
        const v = getValue() as string;
        return v ? <div className="text-xs text-muted-foreground max-w-[200px] truncate" title={v}>{v}</div> : <span className="text-muted-foreground/50 text-xs">—</span>;
      },
    },
    {
      accessorKey: "created_at", header: "Date",
      cell: ({ getValue }) => {
        const v = getValue() as string;
        if (!v) return <span className="text-muted-foreground/50 text-xs">—</span>;
        try { return <div className="text-xs text-muted-foreground whitespace-nowrap">{new Date(v).toLocaleDateString()}</div>; }
        catch { return <div className="text-xs text-muted-foreground">{v}</div>; }
      },
    },
  ], []);

  const table = useReactTable({
    data: records, columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 25 } },
  });

  if (!importResults) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircle className="size-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No results available</p>
          <Button variant="outline" className="mt-4" onClick={reset}>Start Over</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="size-7 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="size-3.5 text-primary-foreground" />
            </div>
            <span className="font-semibold tracking-tight">GrowEasy CRM</span>
            <span className="text-muted-foreground text-sm hidden sm:block">/ Import Results</span>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2"><Download className="size-4" />Export</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => exportToJSON(records, importResults.fileName)} className="gap-2">
                  <FileJson className="size-4" />Export as JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportToCSV(records, importResults.fileName)} className="gap-2">
                  <FileText className="size-4" />Export as CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="sm" className="gap-2" onClick={reset}>
              <RefreshCw className="size-4" />New Import
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 py-6">
        {/* Success banner */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-6">
          <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />
          <div>
            <p className="font-semibold text-emerald-700 dark:text-emerald-400">Import completed successfully</p>
            <p className="text-sm text-emerald-600/80 dark:text-emerald-500/80">
              {importResults.fileName} · processed at {new Date(importResults.completedAt).toLocaleTimeString()}
            </p>
          </div>
        </motion.div>

        {/* Summary cards */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Input", value: stats.total.toLocaleString(), icon: BarChart3, color: "text-foreground" },
            { label: "Imported", value: stats.imported.toLocaleString(), icon: Users, color: "text-emerald-600 dark:text-emerald-400" },
            { label: "Skipped", value: stats.skipped.toLocaleString(), icon: SkipForward, color: "text-amber-600 dark:text-amber-400" },
            { label: "Success Rate", value: `${stats.successRate}%`, icon: TrendingUp, color: stats.successRate >= 80 ? "text-emerald-600 dark:text-emerald-400" : stats.successRate >= 50 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400" },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }} className="rounded-xl border border-border/60 bg-card p-5">
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{s.label}</p>
                <s.icon className={`size-4 ${s.color}`} />
              </div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Status breakdown */}
        {Object.keys(stats.breakdown).length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-5 flex flex-wrap gap-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide self-center">Status breakdown:</span>
            {Object.entries(stats.breakdown).map(([status, count]) => (
              <span key={status} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${CRM_STATUS_COLORS[status] ?? "bg-muted text-muted-foreground border-border"}`}>
                {CRM_STATUS_LABELS[status] ?? status}
                <span className="rounded-full bg-current/10 px-1.5 py-0.5 font-bold">{count}</span>
              </span>
            ))}
          </motion.div>
        )}

        {/* Controls */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Search records..." value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} className="pl-9" />
          </div>
          <span className="text-sm text-muted-foreground self-center">{table.getFilteredRowModel().rows.length.toLocaleString()} records</span>
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => exportToJSON(records, importResults.fileName)}><FileJson className="size-4" />JSON</Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => exportToCSV(records, importResults.fileName)}><FileText className="size-4" />CSV</Button>
          </div>
        </motion.div>

        {/* Table */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-xl border border-border/60 bg-card overflow-hidden">
          {records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <XCircle className="size-12 text-muted-foreground/30 mb-4" />
              <p className="text-lg font-medium text-muted-foreground mb-1">No records imported</p>
              <p className="text-sm text-muted-foreground/70">All records were skipped due to missing email and mobile</p>
              <Button variant="outline" className="mt-6" onClick={reset}>Try another file</Button>
            </div>
          ) : (
            <>
              <div className="overflow-auto max-h-[calc(100vh-500px)] min-h-[300px]">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm border-b border-border/60">
                    {table.getHeaderGroups().map((hg) => (
                      <tr key={hg.id}>
                        <th className="w-10 px-3 py-3 text-left text-xs font-medium text-muted-foreground border-r border-border/40">#</th>
                        {hg.headers.map((header) => (
                          <th key={header.id} className="px-3 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap cursor-pointer select-none hover:text-foreground group" onClick={header.column.getToggleSortingHandler()}>
                            <div className="flex items-center gap-1.5">
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              <span className="text-muted-foreground/40">
                                {header.column.getIsSorted() === "asc" ? <ChevronUp className="size-3.5" /> : header.column.getIsSorted() === "desc" ? <ChevronDown className="size-3.5" /> : <ChevronsUpDown className="size-3.5 opacity-0 group-hover:opacity-100" />}
                              </span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.map((row, idx) => (
                      <tr key={row.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                        <td className="px-3 py-2.5 text-xs text-muted-foreground border-r border-border/30 select-none">
                          {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + idx + 1}
                        </td>
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-3 py-2.5">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border/40 bg-muted/20">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Rows per page:</span>
                  <Select value={String(table.getState().pagination.pageSize)} onValueChange={(v) => table.setPageSize(Number(v))}>
                    <SelectTrigger className="h-8 w-16"><SelectValue /></SelectTrigger>
                    <SelectContent>{[25, 50, 100, 200].map((s) => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}</SelectContent>
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
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
