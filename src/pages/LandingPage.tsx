import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Upload, Sparkles, Zap, Shield, BarChart3,
  FileText, CheckCircle2, ArrowRight, Moon, Sun, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/theme-provider";
import { useAppStore } from "../store/appStore";
import { validateCSVFile, parseCSVLocally } from "../utils/csv";
import { SUPPORTED_FORMATS } from "../constants";
import type { ParsedCSV } from "../types";

const features = [
  { icon: Sparkles, title: "AI-Powered Mapping", description: "Gemini AI intelligently detects and maps fields regardless of column names or CSV format." },
  { icon: Zap, title: "Batch Processing", description: "Processes records in configurable batches with real-time progress tracking." },
  { icon: Shield, title: "Smart Validation", description: "Automatically skips invalid records and handles duplicates, ensuring clean data." },
  { icon: BarChart3, title: "Detailed Analytics", description: "Get a full import summary with success rates, skipped records, and exportable results." },
];

export function LandingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { theme, setTheme } = useTheme();
  const { setParsedCSV, setStep } = useAppStore();

  const processFile = useCallback(async (file: File) => {
    const err = validateCSVFile(file);
    if (err) { toast.error(err); return; }
    setIsLoading(true);
    try {
      const parsed = await parseCSVLocally(file);
      const csvData: ParsedCSV = { ...parsed, fileName: file.name, fileSize: file.size };
      setParsedCSV(csvData);
      setStep("preview");
      toast.success(`Loaded ${parsed.totalRows.toLocaleString()} rows from ${file.name}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to parse CSV");
    } finally {
      setIsLoading(false);
    }
  }, [setParsedCSV, setStep]);

  const onDrop = useCallback((files: File[]) => {
    if (files[0]) processFile(files[0]);
  }, [processFile]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"], "application/csv": [".csv"], "text/plain": [".csv"] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    onDropRejected: (r) => toast.error(r[0]?.errors[0]?.message ?? "Invalid file"),
  });

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="size-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg tracking-tight">GrowEasy CRM</span>
            <Badge variant="secondary" className="text-xs font-medium">AI Importer</Badge>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Toggle theme">
            <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />
          </div>

          <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Badge variant="outline" className="mb-6 gap-1.5 px-3 py-1.5 text-sm font-medium">
                <Sparkles className="size-3.5 text-primary" />
                Powered by Gemini AI
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-balance mb-6">
                Import any CSV into{" "}
                <span className="text-primary">GrowEasy CRM</span>
                <br />intelligently
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground text-balance max-w-2xl mx-auto mb-10 leading-relaxed">
                Upload CSVs from Facebook Ads, Google Ads, Excel, or any unknown format. Our AI maps fields automatically and converts them to your CRM standard — no manual mapping required.
              </p>
            </motion.div>

            {/* Drop zone */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
              <div
                {...getRootProps()}
                className={`relative group cursor-pointer rounded-2xl border-2 border-dashed p-10 sm:p-16 transition-all duration-300 ${
                  isDragActive && !isDragReject
                    ? "border-primary bg-primary/5 scale-[1.02]"
                    : isDragReject
                      ? "border-destructive bg-destructive/5"
                      : "border-border hover:border-primary/50 hover:bg-muted/30"
                }`}
              >
                <input {...getInputProps()} />
                <AnimatePresence mode="wait">
                  {isLoading ? (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4">
                      <RefreshCw className="size-12 text-primary animate-spin" />
                      <p className="text-base font-medium text-muted-foreground">Parsing your CSV...</p>
                    </motion.div>
                  ) : isDragActive && !isDragReject ? (
                    <motion.div key="drag" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4">
                      <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Upload className="size-8 text-primary" />
                      </div>
                      <p className="text-lg font-semibold text-primary">Drop your CSV file here</p>
                    </motion.div>
                  ) : isDragReject ? (
                    <motion.div key="reject" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4">
                      <div className="size-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
                        <FileText className="size-8 text-destructive" />
                      </div>
                      <p className="text-lg font-semibold text-destructive">Only CSV files are supported</p>
                    </motion.div>
                  ) : (
                    <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4">
                      <div className="size-16 rounded-2xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors duration-300">
                        <Upload className="size-8 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold mb-1">Drag & drop your CSV file here</p>
                        <p className="text-sm text-muted-foreground">or click to browse — max 10MB</p>
                      </div>
                      <Button type="button" size="lg" className="gap-2 px-8 mt-2 pointer-events-none">
                        <Upload className="size-4" />
                        Choose CSV File
                        <ArrowRight className="size-4" />
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-6">
                <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">Supports exports from</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {SUPPORTED_FORMATS.map((f) => (
                    <Badge key={f} variant="secondary" className="text-xs">
                      <CheckCircle2 className="size-3 mr-1 text-emerald-500" />{f}
                    </Badge>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="text-3xl font-bold tracking-tight mb-3">How it works</h2>
            <p className="text-muted-foreground text-lg">Four simple steps to clean CRM data</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: "01", title: "Upload CSV", desc: "Drag & drop any CSV file from any source", icon: Upload },
              { step: "02", title: "Preview Data", desc: "Review parsed rows and columns before processing", icon: FileText },
              { step: "03", title: "AI Processing", desc: "Gemini AI maps fields and standardizes data", icon: Sparkles },
              { step: "04", title: "Export Results", desc: "Download clean CRM records as JSON or CSV", icon: BarChart3 },
            ].map((item, i) => (
              <motion.div key={item.step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="relative group">
                <div className="rounded-xl border border-border/60 bg-card p-6 h-full hover:shadow-md transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors shrink-0">
                      <item.icon className="size-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-widest">Step {item.step}</div>
                      <h3 className="font-semibold mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </div>
                {i < 3 && <div className="hidden lg:block absolute top-1/2 -right-3 -translate-y-1/2 z-10"><ArrowRight className="size-5 text-muted-foreground/40" /></div>}
              </motion.div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-border/50 bg-muted/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
              <h2 className="text-3xl font-bold tracking-tight mb-3">Built for real-world data</h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">Handles messy, inconsistent CSVs without requiring manual configuration</p>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {features.map((feature, i) => (
                <motion.div key={feature.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="rounded-xl border border-border/60 bg-card p-6 flex gap-4 hover:shadow-md hover:border-border transition-all duration-300">
                  <div className="shrink-0 size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <feature.icon className="size-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/50 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">GrowEasy CRM AI Importer — Powered by Gemini AI</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Supports files up to 10MB · CSV format only · Data processed securely via Supabase Edge Functions</p>
        </div>
      </footer>
    </div>
  );
}
