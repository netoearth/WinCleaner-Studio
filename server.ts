import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Server-side Gemini client with aistudio-build User-Agent
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// AI Cleanup Analysis Endpoint
app.post('/api/ai/analyze-cleanup', async (req, res) => {
  try {
    const { diskStats, rules, duplicates, largeFiles, apps } = req.body;

    if (!aiClient) {
      return res.status(200).json({
        success: false,
        fallback: true,
        message: 'No GEMINI_API_KEY configured, falling back to heuristic smart rule engine.',
      });
    }

    const prompt = `你是一位 Windows 高性能系统架构师与存储优化专家。
请根据以下收集到的 Windows 磁盘与冗余文件统计数据，分析并给出最优释放空间建议：

[磁盘信息]: ${JSON.stringify(diskStats)}
[系统垃圾与缓存项]: ${JSON.stringify(rules?.map((r: any) => ({ name: r.name, sizeMB: Math.round(r.sizeBytes / (1024*1024)), risk: r.risk })))}
[重复文件组]: ${JSON.stringify(duplicates?.map((d: any) => ({ name: d.name, wastedMB: Math.round(d.totalWastedBytes / (1024*1024)) })))}
[主要大文件]: ${JSON.stringify(largeFiles?.slice(0, 5).map((f: any) => ({ name: f.name, sizeMB: Math.round(f.sizeBytes / (1024*1024)), category: f.category })))}
[已安装程序]: ${JSON.stringify(apps?.map((a: any) => ({ name: a.name, sizeMB: Math.round(a.sizeBytes / (1024*1024)), isBloatware: a.isBloatware })))}

请输出一个严格的 JSON 对象（不要使用 markdown 代码块包裹，直接输出 JSON 文本），结构如下：
{
  "summary": "一句简短的专业总体评估",
  "maxPotentialGB": 35.8,
  "topCategory": "重复安装镜像与系统更新缓存",
  "recommendations": [
    {
      "id": "rec-1",
      "category": "junk",
      "title": "建议标题",
      "potentialBytes": 9283748281,
      "priority": "high",
      "reason": "专业深度理由分析",
      "actionLabel": "执行清理动作名称",
      "targetTab": "cleaner"
    }
  ]
}`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text?.trim() || '{}';
    let parsedData;
    try {
      parsedData = JSON.parse(text);
    } catch {
      // Strip markdown code fences if present
      const cleaned = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      parsedData = JSON.parse(cleaned);
    }

    return res.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error('Gemini AI Analysis Error:', error);
    return res.status(200).json({
      success: false,
      fallback: true,
      error: error?.message || 'AI analysis request failed',
    });
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { 
        middlewareMode: true, 
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[WinCleaner Studio] Server started at http://localhost:${PORT}`);
  });
}

startServer();
