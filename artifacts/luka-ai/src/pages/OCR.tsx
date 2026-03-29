import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, Camera, Image as ImageIcon, Sparkles, X } from "lucide-react";
import { useSettings } from "@/store/use-settings";
import { useLukaOcr } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fileToBase64 } from "@/lib/utils";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function OCR() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const { apiKey, model } = useSettings();
  const ocrMutation = useLukaOcr();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const processFile = (f: File) => {
    if (!f.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    setFile(f);
    ocrMutation.reset();
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    try {
      const base64 = await fileToBase64(file);
      ocrMutation.mutate({
        data: { imageBase64: base64, mimeType: file.type, apiKey, model }
      });
    } catch {
      toast.error("Failed to process image");
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    ocrMutation.reset();
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  return (
    <div className="h-full w-full overflow-y-auto p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">OCR Vision</h1>
          <p className="text-slate-400">Upload or capture a Finnish text image — get a PART 1-4 analysis in Myanmar.</p>
        </div>

        {!file ? (
          <div className="space-y-4">
            <Card
              className={`p-12 border-2 border-dashed transition-all duration-300 ease-out flex flex-col items-center justify-center cursor-pointer min-h-[300px]
                ${dragActive ? "border-cyan-400 bg-cyan-500/10 scale-[1.02]" : "border-slate-700 bg-card hover:border-slate-500 hover:bg-slate-800/50"}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-xl">
                <UploadCloud className="w-10 h-10 text-cyan-400" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">Drag & Drop your image</h3>
              <p className="text-slate-400 text-sm">or click to browse from your device</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
              />
            </Card>

            {/* Camera capture button */}
            <div className="flex justify-center">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center gap-3 px-6 py-3 rounded-xl bg-slate-800/80 border border-slate-700 hover:border-cyan-500/50 hover:bg-slate-700/80 transition-all text-slate-300 hover:text-white"
              >
                <Camera className="w-5 h-5 text-cyan-400" />
                <span className="font-medium">Take a Photo with Camera</span>
              </button>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
              />
            </div>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="overflow-hidden bg-card border-slate-700">
              <div className="relative bg-black flex items-center justify-center min-h-[240px] max-h-[420px]">
                <img src={preview!} alt="Preview" className="max-w-full max-h-[420px] object-contain" />
                <button
                  onClick={clearFile}
                  className="absolute top-4 right-4 bg-red-500/80 hover:bg-red-500 text-white rounded-full p-2 shadow-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center text-slate-300">
                  <ImageIcon className="w-5 h-5 mr-3 text-cyan-500 shrink-0" />
                  <span className="font-medium text-sm truncate max-w-[200px] md:max-w-xs">{file.name}</span>
                </div>
                <Button onClick={handleAnalyze} isLoading={ocrMutation.isPending} size="lg">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Analyze Text
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        <AnimatePresence>
          {ocrMutation.data && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-6 md:p-8 bg-card/90">
                <div className="prose prose-invert prose-cyan max-w-none prose-p:text-slate-300 prose-strong:text-cyan-300 prose-headings:text-white">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {ocrMutation.data.text}
                  </ReactMarkdown>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {ocrMutation.isError && (
          <Card className="p-6 border-red-500/30 bg-red-500/10">
            <p className="text-red-400 text-sm">Error: {(ocrMutation.error as Error)?.message || "Analysis failed. Check your API key in Settings."}</p>
          </Card>
        )}
      </div>
    </div>
  );
}
