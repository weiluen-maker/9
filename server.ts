import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Allow large image uploads
app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// Health & Status endpoint
app.get('/api/status', (_req, res) => {
  res.json({
    status: 'online',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    defaultModel: 'gemini-2.5-flash-image',
    supportedModels: [
      { id: 'gemini-2.5-flash-image', name: 'Gemini 2.5 Flash Image (推薦/默認)', isFreeTier: true },
      { id: 'gemini-3.1-flash-lite-image', name: 'Gemini 3.1 Flash Lite Image', isFreeTier: true },
    ],
  });
});

// Primary image modification endpoint
app.post('/api/edit-image', async (req, res) => {
  const startTime = Date.now();
  try {
    const {
      image, // base64 or data URL
      mimeType = 'image/png',
      prompt,
      aspectRatio,
      model = 'gemini-2.5-flash-image',
    } = req.body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: '請提供修改提示詞 (prompt)' });
    }

    if (!image || typeof image !== 'string') {
      return res.status(400).json({ error: '請提供待修改的圖片資料 (image)' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: '系統未檢測到 GEMINI_API_KEY 環境變數，請確認 AI Studio Secrets 設定。',
      });
    }

    // Extract raw base64 data and mime type
    let cleanBase64 = image;
    let actualMimeType = mimeType;
    if (image.startsWith('data:')) {
      const match = image.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        actualMimeType = match[1];
        cleanBase64 = match[2];
      } else {
        const commaIndex = image.indexOf(',');
        if (commaIndex !== -1) {
          cleanBase64 = image.slice(commaIndex + 1);
        }
      }
    }

    // Standardize ratio instruction
    let ratioInstruction = '';
    const validAspectRatios = ['1:1', '3:4', '4:3', '9:16', '16:9'];
    let supportedRatioConfig: string | undefined = undefined;

    if (aspectRatio && aspectRatio !== 'original' && aspectRatio !== '原始比例') {
      ratioInstruction = ` Keep the final image composition and aspect ratio strictly as ${aspectRatio}.`;
      if (validAspectRatios.includes(aspectRatio)) {
        supportedRatioConfig = aspectRatio;
      }
    }

    const enhancedPrompt = `${prompt.trim()}.${ratioInstruction} Modify and transform the input image according to the request while keeping visual coherence and high fidelity. Output the edited image.`;

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const primaryModel = model || 'gemini-2.5-flash-image';
    const fallbackModel = primaryModel === 'gemini-2.5-flash-image' ? 'gemini-3.1-flash-lite-image' : 'gemini-2.5-flash-image';

    const executeCall = async (modelToUse: string, withImageConfig: boolean) => {
      const parts: any[] = [
        {
          inlineData: {
            data: cleanBase64,
            mimeType: actualMimeType,
          },
        },
        {
          text: enhancedPrompt,
        },
      ];

      const config: any = {};
      if (withImageConfig && supportedRatioConfig) {
        config.imageConfig = {
          aspectRatio: supportedRatioConfig,
        };
      }

      return await ai.models.generateContent({
        model: modelToUse,
        contents: { parts },
        ...(Object.keys(config).length > 0 ? { config } : {}),
      });
    };

    let response: any = null;
    let usedModel = primaryModel;

    try {
      // First attempt with primary model and imageConfig if applicable
      response = await executeCall(primaryModel, Boolean(supportedRatioConfig));
    } catch (err: any) {
      console.warn(`Primary model call (${primaryModel}) with config failed:`, err?.message || err);
      // Attempt 2: primary model without imageConfig in case API rejected the extra config
      try {
        response = await executeCall(primaryModel, false);
      } catch (err2: any) {
        console.warn(`Primary model call without config failed:`, err2?.message || err2);
        // Attempt 3: fallback model
        try {
          usedModel = fallbackModel;
          response = await executeCall(fallbackModel, false);
        } catch (err3: any) {
          throw new Error(err3?.message || err2?.message || err?.message || '模型呼叫失敗');
        }
      }
    }

    // Inspect candidates and parts
    let outputImageBase64: string | null = null;
    let outputMimeType: string = 'image/png';
    let outputText = '';

    const candidate = response?.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData?.data) {
          outputImageBase64 = part.inlineData.data;
          outputMimeType = part.inlineData.mimeType || 'image/png';
        } else if (part.text) {
          outputText += (outputText ? '\n' : '') + part.text;
        }
      }
    }

    if (!outputImageBase64) {
      // If the model only replied with text (e.g. refusal or descriptive note)
      return res.status(422).json({
        error: outputText || '模型未返回生成的圖片，請嘗試調整提示詞或更換圖片後重試。',
        rawText: outputText,
        modelUsed: usedModel,
      });
    }

    const finalDataUrl = `data:${outputMimeType};base64,${outputImageBase64}`;
    const durationMs = Date.now() - startTime;

    return res.json({
      success: true,
      image: finalDataUrl,
      mimeType: outputMimeType,
      modelUsed: usedModel,
      promptUsed: prompt,
      aspectRatioUsed: aspectRatio || 'original',
      description: outputText,
      durationMs,
    });
  } catch (error: any) {
    console.error('Error generating image:', error);
    const durationMs = Date.now() - startTime;
    return res.status(500).json({
      error: error?.message || '處理圖片時發生未知錯誤，請稍後重試。',
      durationMs,
    });
  }
});

// Setup Vite middlewares or static files
async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[NEBULA] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
