import { useAppStore } from "./store/appStore";
import { LandingPage } from "./pages/LandingPage";
import { PreviewPage } from "./pages/PreviewPage";
import { ProcessingPage } from "./pages/ProcessingPage";
import { ResultsPage } from "./pages/ResultsPage";
import { Toaster } from "./components/ui/sonner";
import { AnimatePresence, motion } from "framer-motion";

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
};

export default function App() {
  const step = useAppStore((s) => s.step);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.25, ease: "easeInOut" }}
        >
          {step === "landing" && <LandingPage />}
          {step === "preview" && <PreviewPage />}
          {step === "processing" && <ProcessingPage />}
          {step === "results" && <ResultsPage />}
        </motion.div>
      </AnimatePresence>
      <Toaster richColors position="top-right" />
    </div>
  );
}
