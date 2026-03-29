import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search as SearchIcon, Sparkles } from "lucide-react";
import { useSettings } from "@/store/use-settings";
import { useLukaSearch } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/Card";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Search() {
  const [word, setWord] = useState("");
  const { apiKey, model } = useSettings();
  const searchMutation = useLukaSearch();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim()) return;
    searchMutation.mutate({ data: { word, apiKey, model } });
  };

  const hasResult = !!searchMutation.data;

  return (
    <div className="relative h-full w-full overflow-y-auto p-4 md:p-8">
      {/* Background Image purely for vibes when empty */}
      {!hasResult && (
        <div
          className="absolute inset-0 z-0 opacity-30 pointer-events-none transition-opacity duration-1000"
          style={{
            backgroundImage: `url(${import.meta.env.BASE_URL}images/search-bg.png)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      )}

      <div className={cn("relative z-10 max-w-3xl mx-auto flex flex-col transition-all duration-700 ease-out", hasResult ? "mt-0" : "mt-[20vh]")}>
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 text-glow">Finnish Master</h1>
          <p className="text-slate-400 text-lg">Analyze Finnish words instantly in Myanmar</p>
        </div>

        <Card className="p-2 backdrop-blur-xl bg-card/80 border-primary/30 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <Input
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="Enter a Finnish word (e.g. koira, syödä)..."
              className="border-0 bg-transparent text-lg h-14 focus-visible:ring-0 px-4"
              icon={<SearchIcon className="w-5 h-5 text-cyan-500" />}
            />
            <Button
              type="submit"
              size="lg"
              isLoading={searchMutation.isPending}
              className="h-14 px-8 rounded-xl font-bold tracking-wide"
            >
              <Sparkles className="w-5 h-5 mr-2" /> Analyze
            </Button>
          </form>
        </Card>

        <AnimatePresence>
          {hasResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8"
            >
              <Card className="p-6 md:p-8 overflow-hidden bg-card/90 backdrop-blur-md">
                <div className="prose prose-invert prose-cyan max-w-none prose-headings:font-display prose-headings:text-white prose-p:text-slate-300 prose-a:text-cyan-400 prose-strong:text-cyan-400 prose-th:bg-slate-800/50">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {searchMutation.data.text}
                  </ReactMarkdown>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Ensure utility functions used in this file are in scope
function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}
