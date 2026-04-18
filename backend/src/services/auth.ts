import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { User, PublicUser, SessionRecord } from '../types/index.js';
import { dataService } from './data.js';

const SESSION_EXPIRY_DAYS = 30;
const BCRYPT_ROUNDS = 10;

const isoPlusDays = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

export const authService = {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  },

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    if (!hash) return false;
    // bcrypt hashes start with $2a$ / $2b$ / $2y$
    if (hash.startsWith('$2')) {
      return bcrypt.compare(password, hash);
    }
    // Legacy SHA-256 hex (matches Python's hashlib.sha256 hexdigest)
    const sha = crypto.createHash('sha256').update(password).digest('hex');
    return sha === hash;
  },

  generateToken(): string {
    // Matches Python's secrets.token_urlsafe(32) — 32 random bytes base64url-encoded
    return crypto.randomBytes(32).toString('base64url');
  },

  createSession(user: User): { token: string; session: SessionRecord } {
    const token = authService.generateToken();
    const session: SessionRecord = {
      user_id: user.id,
      email: user.email,
      created_at: new Date().toISOString(),
      expires_at: isoPlusDays(SESSION_EXPIRY_DAYS),
    };
    const sessions = dataService.getSessions();
    sessions[token] = session;
    dataService.saveSessions();
    return { token, session };
  },

  invalidateSession(token: string): void {
    if (!token) return;
    const sessions = dataService.getSessions();
    if (sessions[token]) {
      delete sessions[token];
      dataService.saveSessions();
    }
  },

  getUserFromSession(token: string): PublicUser | null {
    if (!token) return null;
    const sessions = dataService.getSessions();
    const session = sessions[token] as SessionRecord | undefined;
    if (!session) return null;

    const expiresAt = new Date(session.expires_at);
    if (Number.isNaN(expiresAt.getTime()) || new Date() > expiresAt) {
      delete sessions[token];
      dataService.saveSessions();
      return null;
    }

    const user = dataService.getUsers()[session.email] as User | undefined;
    if (!user) return null;

    return { id: user.id, email: user.email, name: user.name };
  },

  extractToken(authHeader?: string, queryToken?: string): string | null {
    if (queryToken) return queryToken;
    if (!authHeader) return null;
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') return parts[1];
    return null;
  },
};
