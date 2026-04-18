import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  SessionResponse,
  User,
} from '../types/index.js';
import { authService } from '../services/auth.js';
import { dataService } from '../services/data.js';

export const authRouter = Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

authRouter.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = (req.body || {}) as RegisterRequest;

    if (!email || !password || !name) {
      res.status(400).json({
        success: false,
        message: 'Email, password, and name are required',
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
      return;
    }

    const emailLower = email.toLowerCase().trim();
    if (!EMAIL_REGEX.test(emailLower)) {
      res.status(400).json({
        success: false,
        message: 'Invalid email format',
      });
      return;
    }

    const users = dataService.getUsers();
    if (users[emailLower]) {
      res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
      return;
    }

    const user: User = {
      id: crypto.randomUUID(),
      email: emailLower,
      name: name.trim(),
      password_hash: await authService.hashPassword(password),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    users[emailLower] = user;
    dataService.saveUsers();

    const { token } = authService.createSession(user);

    const response: AuthResponse = {
      success: true,
      message: 'Registration successful',
      session_token: token,
      user: { id: user.id, email: user.email, name: user.name },
    };
    res.status(201).json(response);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

authRouter.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = (req.body || {}) as LoginRequest;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
      return;
    }

    const emailLower = email.toLowerCase().trim();
    const user = dataService.getUsers()[emailLower] as User | undefined;

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    const valid = await authService.verifyPassword(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    const { token } = authService.createSession(user);

    const response: AuthResponse = {
      success: true,
      message: 'Login successful',
      session_token: token,
      user: { id: user.id, email: user.email, name: user.name },
    };
    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

authRouter.get('/session', (req: Request, res: Response): void => {
  try {
    const token = authService.extractToken(
      req.headers.authorization,
      typeof req.query.session_token === 'string' ? req.query.session_token : undefined
    );

    if (!token) {
      res.json({ authenticated: false, user: null } as SessionResponse);
      return;
    }

    const user = authService.getUserFromSession(token);
    if (!user) {
      res.json({ authenticated: false, user: null } as SessionResponse);
      return;
    }

    res.json({ authenticated: true, user } as SessionResponse);
  } catch (error) {
    console.error('Session check error:', error);
    res.json({ authenticated: false, user: null } as SessionResponse);
  }
});

authRouter.post('/logout', (req: Request, res: Response): void => {
  try {
    const bodyToken = (req.body && req.body.session_token) as string | undefined;
    const headerToken = authService.extractToken(req.headers.authorization);
    const token = bodyToken || headerToken || '';
    if (token) authService.invalidateSession(token);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.json({ success: true, message: 'Logged out successfully' });
  }
});
