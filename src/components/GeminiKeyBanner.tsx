import { useState } from "react";
import { AlertCircle, ExternalLink, ChevronDown, ChevronUp, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export function GeminiKeyBanner() {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 rounded-xl p-4 mb-6"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">
            Gemini API Key Required
          </p>
          <p className="text-amber-700/80 dark:text-amber-400/80 text-sm mt-0.5">
            Add your free Gemini API key to enable AI field mapping. Get one in 60 seconds.
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-1 h-7 text-amber-700 dark:text-amber-400 hover:text-amber-900 px-0 gap-1"
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            {expanded ? "Hide" : "Show"} setup instructions
          </Button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <ol className="mt-3 space-y-2 text-sm text-amber-800 dark:text-amber-300">
                  <li className="flex gap-2">
                    <span className="font-bold shrink-0">1.</span>
                    <span>
                      Go to{" "}
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-2 inline-flex items-center gap-1 font-medium"
                      >
                        aistudio.google.com/app/apikey
                        <ExternalLink className="size-3" />
                      </a>{" "}
                      and create a free API key
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold shrink-0">2.</span>
                    <span>
                      Go to your{" "}
                      <a
                        href="https://supabase.com/dashboard/project/dxtvmmbvmnuhnpwxukek/settings/vault"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-2 inline-flex items-center gap-1 font-medium"
                      >
                        Supabase Vault
                        <ExternalLink className="size-3" />
                      </a>
                      {" "}(Settings → Vault)
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold shrink-0">3.</span>
                    <span>
                      Add a new secret named <code className="bg-amber-200/50 dark:bg-amber-900/50 px-1 rounded font-mono text-xs">GEMINI_API_KEY</code> with your key value
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold shrink-0">4.</span>
                    <span>Reload this page — the AI importer will be ready!</span>
                  </li>
                </ol>

                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" className="gap-1.5 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/50" asChild>
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
                      <Key className="size-3.5" />
                      Get Gemini API Key (Free)
                      <ExternalLink className="size-3" />
                    </a>
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
