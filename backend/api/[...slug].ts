import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../src/index.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Pass all requests through Express app
  return new Promise((resolve) => {
    app(req, res);
    res.on('finish', resolve);
  });
}
