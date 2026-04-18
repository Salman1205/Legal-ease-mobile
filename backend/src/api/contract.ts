import { Router, Request, Response } from 'express';
import multer from 'multer';
import { llmService } from '../services/llm.js';
import { documentService } from '../services/document.js';

export const contractRouter = Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (documentService.isSupportedFileType(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

contractRouter.post('/analyze', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    const file = req.file as Express.Multer.File | undefined;

    if (!file) {
      res.status(400).json({ success: false, message: 'No file provided' });
      return;
    }

    console.log(`Analyzing contract: ${file.originalname}`);

    const contractText = await documentService.extractText(file.buffer, file.mimetype, file.originalname);

    if (!contractText || contractText.startsWith('Error') || contractText.startsWith('No readable')) {
      res.status(400).json({
        success: false,
        message: contractText || 'Could not extract text from document',
      });
      return;
    }

    const analysis = await llmService.analyzeContract(contractText);
    res.json({ ...analysis, filename: file.originalname });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Contract analysis failed';
    const isValidationError = message.toLowerCase().includes('does not appear to be a contract');

    res.status(isValidationError ? 400 : 500).json({
      success: false,
      message,
    });
  }
});
