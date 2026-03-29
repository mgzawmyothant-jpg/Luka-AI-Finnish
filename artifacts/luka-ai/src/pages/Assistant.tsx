import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, Square, Paperclip, Camera, Trash2, X, MessageSquare } from "lucide-react";
import { useSettings } from "@/store/use-settings";
import { useChatStore } from "@/store/use-chat";
import { useLukaChat } from "@workspace/api-client-react";
import { Button } from "@/components/ui/Button";
import { fileToBase64, cn } from "@/lib/utils";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/* ─── Wave animation component shown while recording ─── */
function ListeningOverlay({ onStop }: { onStop: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-20 px-4"
    >
      <motion.div
        initial={{ scale: 0.85, y: -10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.85, y: -10 }}
        className="flex flex-col items-center gap-5 bg-black/95 border-2 border-red-500 rounded-2xl p-8 shadow-[0_0_40px_rgba(239,68,68,0.4)] max-w-sm w-full"
      >
        {/* Red pulse indicator */}
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </span>
          <span className="text-red-400 text-sm font-bold tracking-widest uppercase">Recording</span>
        </div>

        {/* Microphone icon */}
        <div className="text-4xl">🎙️</div>

        {/* Wave bars */}
        <div className="flex items-end gap-1.5 h-8">
          {[0, 0.1, 0.2, 0.3, 0.4, 0.3, 0.2, 0.1, 0].map((delay, i) => (
            <motion.div
              key={i}
              className="w-1.5 rounded-full bg-red-500"
              animate={{ height: ["10px", "28px", "10px"] }}
              transition={{ duration: 0.6, repeat: Infinity, delay, ease: "easeInOut" }}
            />
          ))}
        </div>

        <p className="text-white font-bold tracking-[0.15em] text-lg">LUKA IS LISTENING...</p>

        <button
          onClick={onStop}
          className="mt-2 flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500/20 border border-red-500 text-red-400 hover:bg-red-500 hover:text-white transition-all font-semibold"
        >
          <Square className="w-4 h-4 fill-current" />
          Stop Recording
        </button>
      </motion.div>
    </motion.div>
  );
}

export default function Assistant() {
  const [message, setMessage] = useState("");
  const { history, addMessage, clearHistory } = useChatStore();
  const { apiKey, model } = useSettings();
  const chatMutation = useLukaChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [pendingImage, setPendingImage] = useState<{ base64: string; mimeType: string; url: string } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [pendingAudio, setPendingAudio] = useState<{ base64: string; mimeType: string } | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioMimeTypeRef = useRef<string>("audio/webm");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, chatMutation.isPending]);

  const handleSend = () => {
    if (!message.trim() && !pendingImage && !pendingAudio) return;

    const displayText = message || (pendingAudio ? "🎤 Voice message (transcribing...)" : "📎 Image attached");
    addMessage({ role: "user", text: displayText });

    if (pendingAudio) setIsTranscribing(true);

    chatMutation.mutate(
      {
        data: {
          message,
          history,
          apiKey,
          model,
          imageBase64: pendingImage?.base64,
          imageMimeType: pendingImage?.mimeType,
          audioBase64: pendingAudio?.base64,
          audioMimeType: pendingAudio?.mimeType,
        } as Parameters<typeof chatMutation.mutate>[0]["data"],
      },
      {
        onSuccess: (res) => {
          setIsTranscribing(false);
          addMessage({ role: "model", text: res.text });
        },
        onError: (err) => {
          setIsTranscribing(false);
          toast.error((err as Error)?.message || "Failed to get response. Check Settings.");
        },
      }
    );

    setMessage("");
    setPendingImage(null);
    setPendingAudio(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handleImageAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const base64 = await fileToBase64(f);
      const url = URL.createObjectURL(f);
      setPendingImage({ base64, mimeType: f.type, url });
    } catch {
      toast.error("Failed to read image");
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/ogg")
        ? "audio/ogg"
        : "audio/mp4";

      audioMimeTypeRef.current = mimeType;
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorderRef.current.onstop = () => {
        const finalMime = audioMimeTypeRef.current;
        const blob = new Blob(audioChunksRef.current, { type: finalMime });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const b64 = (reader.result as string).split(",")[1];
          setPendingAudio({ base64: b64, mimeType: finalMime });
          toast.success("Voice memo attached — will be transcribed on send.");
        };
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorderRef.current.start(250);
      setIsRecording(true);
    } catch {
      toast.error("Microphone access denied or not supported.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  return (
    <div className="flex flex-col h-full w-full bg-background relative">
      {/* Recording overlay */}
      <AnimatePresence>
        {isRecording && <ListeningOverlay onStop={stopRecording} />}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border glass-panel shrink-0 z-10">
        <div>
          <h2 className="text-xl font-display font-bold text-white">LUKA Assistant</h2>
          <p className="text-xs text-cyan-400 font-medium">Thinking Mode · Myanmar Language</p>
        </div>
        <Button variant="ghost" size="sm" onClick={clearHistory} className="text-slate-400 hover:text-red-400">
          <Trash2 className="w-4 h-4 mr-2" /> Reset Memory
        </Button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth">
        {history.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-50 py-20">
            <MessageSquare className="w-16 h-16 text-cyan-500 mb-4" />
            <p className="text-lg font-medium text-white">Say Hei to LUKA!</p>
            <p className="text-sm text-slate-400 max-w-sm mt-2">Type, speak, or upload/take a photo to begin.</p>
          </div>
        ) : (
          history.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex w-full", msg.role === "user" ? "justify-end" : "justify-start")}
            >
              {msg.role === "model" && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-600 to-cyan-400 flex items-center justify-center shrink-0 mr-3 mt-1 shadow-md">
                  <span className="text-xs font-bold text-white">L</span>
                </div>
              )}
              <div
                className={cn(
                  "max-w-[85%] md:max-w-[70%] rounded-2xl p-4 shadow-md",
                  msg.role === "user"
                    ? "bg-cyan-600 text-white rounded-br-sm"
                    : "bg-card border border-border text-slate-200 rounded-bl-sm"
                )}
              >
                <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-slate-900/50 prose-a:text-cyan-300 prose-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                </div>
              </div>
            </motion.div>
          ))
        )}

        {chatMutation.isPending && (
          <div className="flex justify-start items-end gap-3">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-600 to-cyan-400 flex items-center justify-center shrink-0 shadow-md">
              <span className="text-xs font-bold text-white">L</span>
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-bl-sm p-4 flex items-center gap-3">
              {isTranscribing ? (
                <>
                  <Mic className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span className="text-xs text-slate-400">Transcribing voice...</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce [animation-delay:0.15s]" />
                  <div className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce [animation-delay:0.3s]" />
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="p-4 bg-card/80 backdrop-blur-xl border-t border-border shrink-0">
        <div className="max-w-4xl mx-auto relative">
          {/* Attachment previews */}
          <AnimatePresence>
            {(pendingImage || pendingAudio) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-full left-0 mb-3 flex gap-3 p-3 bg-slate-900 border border-slate-700 rounded-xl shadow-xl"
              >
                {pendingImage && (
                  <div className="relative">
                    <img src={pendingImage.url} className="w-16 h-16 object-cover rounded-lg border border-slate-700" />
                    <button
                      onClick={() => setPendingImage(null)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                {pendingAudio && (
                  <div className="relative flex items-center bg-slate-800 rounded-lg p-3 pr-8 border border-cyan-500/30">
                    <Mic className="w-5 h-5 text-cyan-400 mr-2 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-200 leading-tight">Voice attached</p>
                      <p className="text-xs text-cyan-400 leading-tight">Gemini will transcribe on send</p>
                    </div>
                    <button
                      onClick={() => setPendingAudio(null)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-end gap-2">
            {/* Attach image button */}
            <label className="p-3 rounded-full cursor-pointer bg-slate-800 text-slate-400 hover:text-cyan-400 hover:bg-slate-700 transition-colors shadow-sm shrink-0" title="Attach image">
              <Paperclip className="w-5 h-5" />
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageAttach} />
            </label>

            {/* Camera capture button */}
            <label className="p-3 rounded-full cursor-pointer bg-slate-800 text-slate-400 hover:text-cyan-400 hover:bg-slate-700 transition-colors shadow-sm shrink-0" title="Take photo">
              <Camera className="w-5 h-5" />
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageAttach} />
            </label>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type your message... (Enter to send)"
              className="flex-1 max-h-32 min-h-[52px] rounded-2xl border border-border bg-black/20 px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
              rows={1}
            />

            <div className="flex gap-2 shrink-0">
              {/* Voice record button */}
              <button
                onClick={startRecording}
                disabled={isRecording}
                className="p-3 rounded-full bg-slate-800 text-slate-400 hover:text-cyan-400 hover:bg-slate-700 transition-all shadow-sm disabled:opacity-50"
                title="Record voice"
              >
                <Mic className="w-5 h-5" />
              </button>

              <Button
                onClick={handleSend}
                disabled={chatMutation.isPending || (!message.trim() && !pendingImage && !pendingAudio)}
                size="icon"
                className="rounded-full shadow-lg h-[52px] w-[52px]"
              >
                <Send className="w-5 h-5 ml-0.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
