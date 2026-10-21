import crypto from 'crypto';

/**
 * Computes a deterministic SHA-256 hash for speech synthesis units.
 * Combines trimmed text, voice name, style instructions, and TTS model version.
 *
 * @param text The cleaned spoken text block
 * @param voice Prebuilt voice persona (e.g. 'Kore', 'Puck', 'Charon')
 * @param style Tone/cadence instructions (defaults to '')
 * @param model Model identifier (e.g. 'gemini-3.8-flash-lite-tts')
 * @returns 64-character hexadecimal SHA-256 string
 */
export function getAudioCacheKey(
  text: string,
  voice: string,
  style: string = '',
  model: string = 'gemini-3.8-flash-lite-tts'
): string {
  const normalized = {
    text: (text || '').trim(),
    voice: (voice || '').trim(),
    style: (style || '').trim(),
    model: (model || '').trim(),
  };

  return crypto
    .createHash('sha256')
    .update(JSON.stringify(normalized))
    .digest('hex');
}
