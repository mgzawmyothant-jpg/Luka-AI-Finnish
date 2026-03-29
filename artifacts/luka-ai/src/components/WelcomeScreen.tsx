import { useState } from "react";
import { motion } from "framer-motion";
import { KeyRound, Cpu, ExternalLink, ArrowRight } from "lucide-react";
import { useSettings, MODELS } from "@/store/use-settings";
import { Button } from "@/components/ui/button";

export function WelcomeScreen() {
  const { setApiKey, setModel, model } = useSettings();
  const [key, setKey] = useState("");
  const [selectedModel, setSelectedModel] = useState(model || "gemini-2.0-flash");
  const [error, setError] = useState("");

  const handleStart = () => {
    if (!key.trim() || key.trim().length < 10) {
      setError("Please enter a valid Gemini API key.");
      return;
    }
    setApiKey(key.trim());
    setModel(selectedModel);
  };

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-cyan-500/5 blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-blue-700/5 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-600 to-cyan-400 shadow-[0_0_40px_rgba(6,182,212,0.5)] mb-6"
          >
            <span className="text-4xl font-bold text-white">L</span>
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">Luka AI Master FI</h1>
          <p className="text-slate-400 text-sm">
            Finnish Language AI · ဖင်လန်ဘာသာစကား AI Assistant
          </p>
        </div>

        {/* Setup Card */}
        <div className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-2xl space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">Welcome! Let's get started.</h2>
            <p className="text-sm text-slate-400">Enter your Google Gemini API key to begin.</p>
          </div>

          {/* API Key input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-cyan-400" />
              Gemini API Key
            </label>
            <input
              type="password"
              value={key}
              onChange={(e) => { setKey(e.target.value); setError(""); }}
              placeholder="AIzaSy..."
              className="w-full h-12 rounded-xl border border-border bg-background/50 px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/50 placeholder:text-slate-600"
              onKeyDown={(e) => e.key === "Enter" && handleStart()}
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <p className="text-xs text-slate-500">
              Your key stays in your browser only.{" "}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:underline inline-flex items-center gap-1"
              >
                Get a free key <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>

          {/* Model select */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              Model Version
            </label>
            <div className="relative">
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full h-12 rounded-xl border border-border bg-background/50 px-4 text-sm text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                {MODELS.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          <Button onClick={handleStart} className="w-full" size="lg">
            Start Luka AI <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>

        {/* Features list */}
        <div className="mt-6 grid grid-cols-2 gap-3 text-center">
          {[
            { emoji: "🎓", label: "Professor Search" },
            { emoji: "📄", label: "OCR Vision" },
            { emoji: "🧠", label: "LUKA Assistant" },
            { emoji: "📁", label: "History/Export" },
          ].map((f) => (
            <div key={f.label} className="bg-white/5 rounded-xl p-3 border border-white/5">
              <div className="text-xl mb-1">{f.emoji}</div>
              <div className="text-xs text-slate-400 font-medium">{f.label}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
