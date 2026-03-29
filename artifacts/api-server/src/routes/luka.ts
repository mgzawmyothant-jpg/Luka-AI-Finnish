import { Router, type IRouter, type Request, type Response } from "express";
import { GoogleGenAI } from "@google/genai";
import { Document, Paragraph, TextRun, HeadingLevel } from "docx";
import { randomUUID } from "crypto";

const router: IRouter = Router();

const PROFESSOR_SYSTEM = `မင်းရဲ့အမည်က LUKA AI ဖြစ်ပါတယ်။ မင်းဟာ ဖင်လန်ဘာသာစကား ပါမောက္ခတစ်ဦး ဖြစ်ပါတယ်။
- Section 1: Meaning, Word Class, Verb Type (1-6), Stem Changes, Conjugation Tables နဲ့ EXACTLY 5 Formal Examples, 5 Casual Examples ကို မြန်မာလိုပဲ ထုတ်ပေးပါ။
- Section 2: PART 1-4 format အတိုင်း အတိအကျ ပြန်ပေးပါ။ မြန်မာစာကိုပဲ သုံးပါ။
မြန်မာဘာသာစကားဖြင့်သာ ဖြေပါ။`;

const ASSISTANT_SYSTEM = `မင်းရဲ့အမည်က LUKA AI ဖြစ်ပါတယ်။ မင်းဟာ အသိဉာဏ်အမြင့်ဆုံး AI Assistant ဖြစ်ပါတယ်။
User ပေးတဲ့ အသံမှတ်စု၊ ပုံ၊ ဗီဒီယိုတွေကို ကြည့်ပြီး မင်းရဲ့ Thinking Mode သုံးပြီး လူတစ်ယောက်လို မြန်မာလိုပဲ ကျွမ်းကျင်စွာ ဖြေပေးပါ။
မြန်မာဘာသာစကားဖြင့်သာ ဖြေပါ။`;

interface HistoryItem {
  id: string;
  type: "search" | "ocr" | "chat";
  query: string;
  response: string;
  timestamp: string;
}

const historyStore: HistoryItem[] = [];

function getClient(apiKey?: string) {
  const key = apiKey || process.env.GEMINI_API_KEY || "";
  if (!key) throw new Error("Gemini API key is required. Please set it in Settings.");
  return new GoogleGenAI({ apiKey: key });
}

function getModelName(model?: string) {
  return model || "gemini-2.0-flash";
}

router.post("/search", async (req: Request, res: Response) => {
  try {
    const { word, apiKey, model } = req.body as { word?: string; apiKey?: string; model?: string };
    if (!word?.trim()) {
      res.status(400).json({ error: "word is required" });
      return;
    }

    const ai = getClient(apiKey);
    const modelName = getModelName(model);

    const response = await ai.models.generateContent({
      model: modelName,
      config: { systemInstruction: PROFESSOR_SYSTEM },
      contents: [{ role: "user", parts: [{ text: `Analyze the Finnish word: "${word.trim()}"` }] }],
    });

    const text = response.text ?? "";

    historyStore.unshift({
      id: randomUUID(),
      type: "search",
      query: word.trim(),
      response: text,
      timestamp: new Date().toISOString(),
    });
    if (historyStore.length > 100) historyStore.splice(100);

    res.json({ text, success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: msg });
  }
});

router.post("/ocr", async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType, apiKey, model } = req.body as {
      imageBase64?: string;
      mimeType?: string;
      apiKey?: string;
      model?: string;
    };

    if (!imageBase64) {
      res.status(400).json({ error: "imageBase64 is required" });
      return;
    }

    const ai = getClient(apiKey);
    const modelName = getModelName(model);

    const response = await ai.models.generateContent({
      model: modelName,
      config: { systemInstruction: PROFESSOR_SYSTEM },
      contents: [
        {
          role: "user",
          parts: [
            { text: "ဤပုံထဲမှ ဖင်လန်စာသားများကို ဖတ်၍ PART 1-4 format ဖြင့် မြန်မာဘာသာသို့ ပြန်ဆိုပေးပါ။ PART 1: မူရင်းစာသား, PART 2: ဘာသာပြန်, PART 3: ဝေါဟာရများ, PART 4: သဒ္ဒါမှတ်ချက်" },
            {
              inlineData: {
                mimeType: mimeType || "image/jpeg",
                data: imageBase64,
              },
            },
          ],
        },
      ],
    });

    const text = response.text ?? "";

    historyStore.unshift({
      id: randomUUID(),
      type: "ocr",
      query: "[Image OCR Analysis]",
      response: text,
      timestamp: new Date().toISOString(),
    });
    if (historyStore.length > 100) historyStore.splice(100);

    res.json({ text, success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: msg });
  }
});

async function transcribeAudio(
  ai: GoogleGenAI,
  modelName: string,
  audioBase64: string,
  audioMimeType: string
): Promise<string> {
  const transcriptionResponse = await ai.models.generateContent({
    model: modelName,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: "Please transcribe this audio recording exactly as spoken. Return only the transcribed text, nothing else.",
          },
          {
            inlineData: {
              mimeType: audioMimeType,
              data: audioBase64,
            },
          },
        ],
      },
    ],
  });
  return (transcriptionResponse.text ?? "").trim();
}

router.post("/chat", async (req: Request, res: Response) => {
  try {
    const { message, imageBase64, imageMimeType, audioBase64, audioMimeType, history, apiKey, model } = req.body as {
      message?: string;
      imageBase64?: string;
      imageMimeType?: string;
      audioBase64?: string;
      audioMimeType?: string;
      history?: Array<{ role: string; text: string }>;
      apiKey?: string;
      model?: string;
    };

    const ai = getClient(apiKey);
    const modelName = getModelName(model);

    const userParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

    let voiceTranscript = "";

    if (audioBase64 && audioMimeType) {
      try {
        voiceTranscript = await transcribeAudio(ai, modelName, audioBase64, audioMimeType);
      } catch (transcribeErr) {
        console.error("Audio transcription failed:", transcribeErr);
        voiceTranscript = "[Voice message — transcription failed]";
      }
    }

    let userText = message || "";
    if (voiceTranscript) {
      userText = userText
        ? `${userText}\n\n[Voice Message]: ${voiceTranscript}`
        : `[Voice Message]: ${voiceTranscript}`;
    }

    if (userText.trim()) {
      userParts.push({ text: userText.trim() });
    }

    if (imageBase64) {
      userParts.push({
        inlineData: {
          mimeType: imageMimeType || "image/jpeg",
          data: imageBase64,
        },
      });
    }

    if (userParts.length === 0) {
      res.status(400).json({ error: "message, image, or audio is required" });
      return;
    }

    const contents = [];
    if (history && history.length > 0) {
      for (const h of history) {
        contents.push({
          role: h.role as "user" | "model",
          parts: [{ text: h.text }],
        });
      }
    }
    contents.push({ role: "user" as const, parts: userParts });

    const response = await ai.models.generateContent({
      model: modelName,
      config: { systemInstruction: ASSISTANT_SYSTEM },
      contents,
    });

    const text = response.text ?? "";
    const queryLabel = voiceTranscript
      ? `🎤 ${voiceTranscript.slice(0, 80)}${voiceTranscript.length > 80 ? "…" : ""}`
      : userText.trim() || "[Media message]";

    historyStore.unshift({
      id: randomUUID(),
      type: "chat",
      query: queryLabel,
      response: text,
      timestamp: new Date().toISOString(),
    });
    if (historyStore.length > 100) historyStore.splice(100);

    res.json({ text, success: true, transcript: voiceTranscript || undefined });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: msg });
  }
});

router.get("/history", (_req: Request, res: Response) => {
  res.json({ items: historyStore });
});

router.delete("/history", (_req: Request, res: Response) => {
  historyStore.splice(0, historyStore.length);
  res.json({ text: "History cleared", success: true });
});

router.post("/export", async (req: Request, res: Response) => {
  try {
    const { text, filename } = req.body as { text?: string; filename?: string };
    if (!text?.trim()) {
      res.status(400).json({ error: "text is required" });
      return;
    }

    const lines = text.split("\n");
    const paragraphs: Paragraph[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        paragraphs.push(new Paragraph({ text: "" }));
        continue;
      }

      if (trimmed.startsWith("### ") || trimmed.startsWith("PART ")) {
        paragraphs.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: trimmed.replace(/^###\s*/, ""), bold: true, size: 28 })],
          })
        );
      } else if (trimmed.startsWith("## ")) {
        paragraphs.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: trimmed.replace(/^##\s*/, ""), bold: true, size: 32 })],
          })
        );
      } else if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: trimmed.replace(/\*\*/g, ""), bold: true, size: 22 })],
          })
        );
      } else {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: trimmed, size: 22 })],
          })
        );
      }
    }

    const doc = new Document({
      sections: [{ properties: {}, children: paragraphs }],
    });

    const { Packer } = await import("docx");
    const buffer = await Packer.toBuffer(doc);

    const safeName = (filename || "LukaAI_Note").replace(/[^a-zA-Z0-9_\-]/g, "_");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename="${safeName}.docx"`);
    res.send(buffer);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: msg });
  }
});

export default router;
