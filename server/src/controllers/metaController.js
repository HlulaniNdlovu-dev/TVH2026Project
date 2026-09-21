import { getMeta } from '../services/metaService.js';

export const meta = (req, res) => res.json(getMeta());
export const health = (req, res) => res.json({ status: 'ok', time: new Date().toISOString() });
