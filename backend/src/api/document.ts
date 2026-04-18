import { Router, Request, Response } from 'express';
import multer from 'multer';
import { documentService } from '../services/document.js';

export const documentRouter = Router();

// Configure multer
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (documentService.isSupportedFileType(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

// Extract document
documentRouter.post('/extract', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    const file = req.file as Express.Multer.File | undefined;

    if (!file) {
      res.status(400).json({
        success: false,
        message: 'No file provided',
      });
      return;
    }

    console.log(`📄 Extracting from: ${file.originalname} (${file.mimetype})`);

    const extracted_text = await documentService.extractText(
      file.buffer,
      file.mimetype,
      file.originalname
    );

    if (extracted_text.startsWith('Error')) {
      res.status(400).json({
        success: false,
        extracted_text: '',
        message: extracted_text,
        filename: file.originalname,
      });
      return;
    }

    res.json({
      success: true,
      extracted_text,
      message: 'Text extracted successfully',
      filename: file.originalname,
      char_count: extracted_text.length,
    });
  } catch (error: any) {
    console.error('Document extraction error:', error);
    res.status(500).json({
      success: false,
      extracted_text: '',
      message: error.message || 'Document extraction failed',
      filename: (req.file as any)?.originalname || 'unknown',
    });
  }
});

