import unzipper from 'unzipper';
import { parseStringPromise } from 'xml2js';
import { llmService } from './llm.js';

export const documentService = {
  async extractTextFromPDF(fileBuffer: Buffer): Promise<string> {
    try {
      // unpdf is a serverless-friendly wrapper around pdf.js — avoids the
      // worker/ESM bundling issues that `pdfjs-dist/legacy` hits on Vercel.
      const { extractText, getDocumentProxy } = await import('unpdf');
      const pdf = await getDocumentProxy(new Uint8Array(fileBuffer));
      const { text } = await extractText(pdf, { mergePages: true });
      const normalized = (text || '').replace(/\s+/g, ' ').trim();

      if (!normalized) {
        return 'No readable text found in PDF. The document may be scanned or image-based.';
      }
      return normalized;
    } catch (error) {
      console.error('PDF extraction error:', error);
      const detail = error instanceof Error ? error.message : String(error);
      return `Error extracting PDF text: ${detail}`;
    }
  },

  async extractTextFromDOCX(fileBuffer: Buffer): Promise<string> {
    try {
      const zip = await unzipper.Open.buffer(fileBuffer);
      const documentEntry = zip.files.find((entry: unzipper.File) => entry.path === 'word/document.xml');

      if (!documentEntry) {
        return 'Error extracting DOCX text';
      }

      const xmlBuffer = await documentEntry.buffer();
      const xml = xmlBuffer.toString('utf-8');
      const parsed = await parseStringPromise(xml, { explicitArray: false, preserveChildrenOrder: true });

      const collectText = (node: any): string[] => {
        if (!node) return [];
        if (typeof node === 'string') return [node];
        if (Array.isArray(node)) return node.flatMap(collectText);

        const chunks: string[] = [];
        Object.entries(node).forEach(([key, value]) => {
          if (key === 'w:t') {
            chunks.push(...collectText(value));
          } else if (typeof value === 'object') {
            chunks.push(...collectText(value));
          }
        });
        return chunks;
      };

      const text = collectText(parsed)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      return text || 'No readable text found in DOCX';
    } catch (error) {
      console.error('DOCX extraction error:', error);
      return 'Error extracting DOCX text';
    }
  },

  async extractTextFromImage(fileBuffer: Buffer, mimeType = 'image/jpeg'): Promise<string> {
    // Primary: Groq multimodal vision — works reliably on Vercel serverless,
    // handles English + Urdu natively, no CDN traineddata download required.
    try {
      const text = await llmService.ocrImageWithVision(fileBuffer, mimeType);
      if (text && text !== 'No text detected in image') {
        return text;
      }
    } catch (visionError) {
      console.warn('Groq vision OCR failed, falling back to tesseract:', visionError instanceof Error ? visionError.message : visionError);
    }

    // Fallback: tesseract.js (flaky on serverless cold starts, but useful for local dev
    // and as a last-ditch option if the vision model is rate-limited).
    try {
      const tesseract = await import('tesseract.js');
      let text = '';
      try {
        const result = await tesseract.recognize(fileBuffer, 'eng+urd');
        text = result?.data?.text?.replace(/\s+/g, ' ').trim() || '';
      } catch (bilingualError) {
        console.warn('Bilingual OCR failed, falling back to English:', bilingualError);
        const fallback = await tesseract.recognize(fileBuffer, 'eng');
        text = fallback?.data?.text?.replace(/\s+/g, ' ').trim() || '';
      }
      return text || 'No text detected in image';
    } catch (error) {
      console.error('OCR error:', error);
      const detail = error instanceof Error ? error.message : String(error);
      return `Error extracting text from image: ${detail}`;
    }
  },

  // Extract text based on file type
  async extractText(fileBuffer: Buffer, mimeType: string, filename: string): Promise<string> {
    if (mimeType === 'application/pdf') {
      return this.extractTextFromPDF(fileBuffer);
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword'
    ) {
      return this.extractTextFromDOCX(fileBuffer);
    } else if (mimeType === 'text/plain') {
      try {
        const text = fileBuffer.toString('utf-8');
        return text || 'No text found in file';
      } catch {
        return 'Error reading text file';
      }
    } else if (mimeType.startsWith('image/')) {
      return this.extractTextFromImage(fileBuffer, mimeType);
    }

    return 'Unsupported file type';
  },

  // Validate file size
  isFileSizeValid(size: number, maxSize: number = 10 * 1024 * 1024): boolean {
    return size <= maxSize;
  },

  // Validate file type
  isSupportedFileType(mimeType: string): boolean {
    const supported = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ];
    return supported.includes(mimeType);
  },
};
