import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSettings, MODELS } from "@/store/use-settings";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { KeyRound, Cpu, X, ExternalLink } from "lucide-react";

export function SettingsDrawer() {
  const { isSettingsDrawerOpen, closeSettings, apiKey, model, setApiKey, setModel } = useSettings();
  const [localKey, setLocalKey] = useState(apiKey);
  const [localModel, setLocalModel] = useState(model);

  useEffect(() => {
    if (isSettingsDrawerOpen) {
      setLocalKey(apiKey);
      setLocalModel(model);
    }
  }, [isSettingsDrawerOpen, apiKey, model]);

  const handleSave = () => {
    setApiKey(localKey.trim());
    setModel(localModel);
    closeSettings();
  };

  return (
    <AnimatePresence>
      {isSettingsDrawerOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSettings}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-sm glass-panel border-l-border flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h2 className="text-xl font-display font-semibold text-white">Settings</h2>
              <button onClick={closeSettings} className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-300">Google Gemini API Key</label>
                <Input
                  type="password"
                  value={localKey}
                  onChange={(e) => setLocalKey(e.target.value)}
                  placeholder="AIza..."
                  icon={<KeyRound className="w-4 h-4" />}
                />
                <p className="text-xs text-slate-500">
                  Stored only in your browser's local storage. Never sent to our servers.{" "}
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:underline inline-flex items-center gap-1"
                  >
                    Get a key <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-300">Model Version</label>
                <div className="relative">
                  <Cpu className="absolute left-4 top-3.5 w-4 h-4 text-muted-foreground" />
                  <select
                    value={localModel}
                    onChange={(e) => setLocalModel(e.target.value)}
                    className="w-full h-12 rounded-xl border border-border bg-card pl-11 pr-4 py-2 text-sm text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    {MODELS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-slate-500">
                  Gemini 3.1 Pro Preview gives the most accurate Finnish analysis.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-white/5 bg-black/20">
              <Button onClick={handleSave} className="w-full" size="lg">
                Save Changes
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
