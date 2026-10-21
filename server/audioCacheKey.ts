import crypto from 'crypto';

/**
 * Computes a deterministic SHA-256 hash for speech synthesis units.
 * Combines trimmed text, voice name, and style instructions (model name excluded).
 *
 * @param text The cleaned spoken text block
 * @param voice Prebuilt voice persona (e.g. 'Kore', 'Puck', 'Charon')
 * @param style Tone/cadence instructions (defaults to '')
 * @returns 64-character hexadecimal SHA-256 string
 */
export function getAudioCacheKey(
  text: string,
  voice: string,
  style: string = ''
): string {
  const normalized = {
    text: (text || '').trim(),
    voice: (voice || '').trim(),
    style: (style || '').trim(),
  };

  return crypto
    .createHash('sha256')
    .update(JSON.stringify(normalized))
    .digest('hex');
}
