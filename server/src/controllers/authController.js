import * as auth from '../services/authService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const login = asyncHandler(async (req, res) => res.json({ user: await auth.login(req.body) }));
export const register = asyncHandler(async (req, res) => res.status(201).json({ user: await auth.register(req.body) }));
export const me = asyncHandler(async (req, res) => res.json({ user: auth.sanitize(req.user) }));
