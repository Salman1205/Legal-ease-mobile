import { Router, Request, Response } from 'express';
import multer from 'multer';
import { llmService } from '../services/llm.js';

export const transcribeRouter = Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // Groq accepts up to ~25MB per request
  fileFilter: (_req, file, cb) => {
    const ok = /^audio\//.test(file.mimetype) || /^video\//.test(file.mimetype);
    if (ok) cb(null, true);
    else cb(new Error(`Unsupported audio type: ${file.mimetype}`));
  },
});

transcribeRouter.post('/', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    const file = req.file as Express.Multer.File | undefined;
    if (!file) {
      res.status(400).json({ success: false, message: 'No audio file provided' });
      return;
    }

    const language = typeof req.body?.language === 'string' ? req.body.language : undefined;
    console.log(`🎤 Transcribing: ${file.originalname} (${file.mimetype}, ${file.size} bytes, lang=${language || 'auto'})`);

    const text = await llmService.transcribeAudio(file.buffer, file.originalname, file.mimetype, language);

    res.json({
      success: true,
      transcript: text,
      filename: file.originalname,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Transcribe endpoint error:', errorMsg);
    res.status(500).json({ success: false, transcript: '', message: errorMsg });
  }
});
