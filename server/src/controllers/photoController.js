import * as stubs from '../db/stubs.js';
import { notFound } from '../utils/errors.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Photos are stored as data URLs; send them back as real image bytes so <img src> works.
export const getPhoto = asyncHandler(async (req, res) => {
  const dataUrl = await stubs.getPhoto(req.params.id);
  const match = /^data:(.+?);base64,(.*)$/.exec(dataUrl ?? '');
  if (!match) throw notFound('Photo not found');
  res.set('Content-Type', match[1]).send(Buffer.from(match[2], 'base64'));
});
