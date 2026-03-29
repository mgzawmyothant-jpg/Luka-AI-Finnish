import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetHistory, useClearHistory, getGetHistoryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Download, Trash2, Search, ScanText, MessageSquare, ChevronDown, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

export default function History() {
  const { data, isLoading } = useGetHistory();
  const clearMutation = useClearHistory();
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleClear = () => {
    if (confirm("Are you sure you want to clear all history? This cannot be undone.")) {
      clearMutation.mutate(undefined, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetHistoryQueryKey() });
          toast.success("History cleared");
        }
      });
    }
  };

  const handleExport = async () => {
    const lastResponse = data?.items?.find((i) => i.response);
    if (!lastResponse) {
      toast.error("No valid response found to export");
      return;
    }
    setIsExporting(true);
    try {
      const res = await fetch("/api/luka/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: lastResponse.response, filename: "Luka-Analysis" }),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Luka-Analysis.docx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Document downloaded!");
    } catch {
      toast.error("Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "search": return <Search className="w-4 h-4" />;
      case "ocr": return <ScanText className="w-4 h-4" />;
      case "chat": return <MessageSquare className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-white mb-2">History</h1>
            <p className="text-slate-400">Review your past learning sessions.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} isLoading={isExporting}>
              <Download className="w-4 h-4 mr-2" /> Export Last
            </Button>
            <Button variant="destructive" onClick={handleClear} isLoading={clearMutation.isPending}>
              <Trash2 className="w-4 h-4 mr-2" /> Clear
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin" />
          </div>
        ) : !data?.items?.length ? (
          <Card className="p-12 text-center border-dashed border-2">
            <Clock className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-300">No history yet</h3>
            <p className="text-slate-500">Your past analyses and chats will appear here.</p>
          </Card>
        ) : (
          <div className="space-y-4 pb-20">
            {data.items.map((item) => (
              <Card key={item.id} className="overflow-hidden transition-all duration-300 hover:border-slate-700">
                <div
                  className="p-4 cursor-pointer flex items-center justify-between bg-card hover:bg-slate-800/50"
                  onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <Badge variant="secondary" className="uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                      {getIcon(item.type)} {item.type}
                    </Badge>
                    <span className="font-medium text-slate-200 truncate">
                      {item.query || "Uploaded Image / Audio"}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 pl-4">
                    <span className="text-xs text-slate-500 hidden sm:inline-block">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 transition-transform ${expandedId === item.id ? "rotate-180" : ""}`}
                    />
                  </div>
                </div>

                <AnimatePresence>
                  {expandedId === item.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-800 bg-slate-900/50"
                    >
                      <div className="p-4 sm:p-6 prose prose-invert prose-sm sm:prose-base prose-cyan max-w-none">
                        <ReactMarkdown>{item.response}</ReactMarkdown>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
