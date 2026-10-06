import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { 
  getRealDrives, 
  scanRealJunk, 
  executeRealClean, 
  getRealInstalledApps,
  getRealSmartHealth,
  scanRealDuplicates,
  scanRealLargeFiles,
  deleteRealFile,
  getRealStartupItems,
  toggleRealStartupItem,
  executeRealUninstall
} from './src/server/systemService';

dotenv.config();

const appDir = typeof __dirname !== 'undefined'
  ? (__dirname.endsWith('dist') ? path.resolve(__dirname, '..') : __dirname)
  : process.cwd();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// 1. Real Logical Drives Endpoint
app.get('/api/system/drives', async (req, res) => {
  try {
    const drives = await getRealDrives();
    res.json({ success: true, drives, isWindows: process.platform === 'win32' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message });
  }
});

// 2. Real Junk & Cache Scanner Endpoint
app.post('/api/system/scan-junk', async (req, res) => {
  try {
    const items = await scanRealJunk();
    res.json({ success: true, items });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message });
  }
});

// 3. Real Cleanup Executor Endpoint
app.post('/api/system/clean', async (req, res) => {
  try {
    const { categoryIds } = req.body;
    const result = await executeRealClean(categoryIds || []);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message });
  }
});

// 4. Real Installed Software from Registry Endpoint
app.get('/api/system/installed-apps', async (req, res) => {
  try {
    const apps = await getRealInstalledApps();
    res.json({ success: true, apps });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message });
  }
});

// 5. Real Duplicate Files Scanner Endpoint
app.post('/api/system/scan-duplicates', async (req, res) => {
  try {
    const { targetFolder } = req.body || {};
    const groups = await scanRealDuplicates(targetFolder);
    res.json({ success: true, groups });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message });
  }
});

// 6. Real Large Files Scanner Endpoint (> 50MB)
app.post('/api/system/scan-large-files', async (req, res) => {
  try {
    const { targetFolder, minSizeBytes } = req.body || {};
    const files = await scanRealLargeFiles(targetFolder, minSizeBytes);
    res.json({ success: true, files });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message });
  }
});

// 7. Real S.M.A.R.T. Hardware Health & Telemetry Endpoint
app.get('/api/system/smart-health', async (req, res) => {
  try {
    const smart = await getRealSmartHealth();
    res.json({ success: true, smart });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message });
  }
});

// 8. Real Single File Delete (Recycle Bin)
app.post('/api/system/delete-file', async (req, res) => {
  try {
    const { filePath } = req.body;
    if (!filePath) return res.status(400).json({ success: false, error: 'Path required' });
    const success = await deleteRealFile(filePath);
    res.json({ success });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message });
  }
});

// 9. Real Windows Startup Items Endpoint
app.get('/api/system/startup-items', async (req, res) => {
  try {
    const items = await getRealStartupItems();
    res.json({ success: true, items });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message });
  }
});

// 10. Toggle Real Windows Startup Item
app.post('/api/system/toggle-startup', async (req, res) => {
  try {
    const { name, location, enabled } = req.body;
    const result = await toggleRealStartupItem(name, location, enabled);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message });
  }
});

// 11. Execute Real Uninstall Program
app.post('/api/system/uninstall-app', async (req, res) => {
  try {
    const { command, appName, cleanResiduals } = req.body;
    const result = await executeRealUninstall(command, appName, cleanResiduals);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message });
  }
});

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
    app.use(express.static(path.resolve(appDir, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(appDir, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[WinCleaner Studio] Server started at http://localhost:${PORT}`);
  });
}

startServer();
