/**
 * Utilities for base64 audio conversion and stitching multiple WAV audio clips.
 */

export function base64ToBlobUrl(base64Data: string, mimeType = 'audio/wav'): string {
  const binary = atob(base64Data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: mimeType });
  return URL.createObjectURL(blob);
}

export function base64ToUint8Array(base64Data: string): Uint8Array {
  const binary = atob(base64Data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Parses WAV header to find the start and size of the 'data' chunk
 */
function findDataChunk(bytes: Uint8Array): { offset: number; size: number } {
  // Seek through RIFF chunks
  let pos = 12; // Skip 'RIFF', fileSize, 'WAVE'
  while (pos < bytes.length - 8) {
    const chunkId = String.fromCharCode(bytes[pos], bytes[pos + 1], bytes[pos + 2], bytes[pos + 3]);
    const chunkSize =
      bytes[pos + 4] | (bytes[pos + 5] << 8) | (bytes[pos + 6] << 16) | (bytes[pos + 7] << 24);

    if (chunkId === 'data') {
      return { offset: pos + 8, size: Math.min(chunkSize, bytes.length - (pos + 8)) };
    }
    pos += 8 + chunkSize;
  }
  // Fallback: standard 44 bytes header
  return { offset: 44, size: Math.max(0, bytes.length - 44) };
}

/**
 * Creates a standard 44-byte WAV header for 24000Hz, 16-bit, mono PCM
 */
function createWavHeader(dataLength: number, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Uint8Array {
  const header = new Uint8Array(44);
  const view = new DataView(header.buffer);

  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;

  // RIFF chunk descriptor
  header.set([0x52, 0x49, 0x46, 0x46], 0); // "RIFF"
  view.setUint32(4, 36 + dataLength, true); // chunkSize
  header.set([0x57, 0x41, 0x56, 0x45], 8); // "WAVE"

  // fmt sub-chunk
  header.set([0x66, 0x6d, 0x74, 0x20], 12); // "fmt "
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true); // NumChannels (1 = mono)
  view.setUint32(24, sampleRate, true); // SampleRate (24000)
  view.setUint32(28, byteRate, true); // ByteRate
  view.setUint16(32, blockAlign, true); // BlockAlign
  view.setUint16(34, bitsPerSample, true); // BitsPerSample (16)

  // data sub-chunk
  header.set([0x64, 0x61, 0x74, 0x61], 36); // "data"
  view.setUint32(40, dataLength, true); // Subchunk2Size

  return header;
}

/**
 * Concatenates multiple base64-encoded WAV clips into one unified WAV blob
 */
export function stitchWavClips(base64Clips: string[]): { blob: Blob; blobUrl: string } {
  if (base64Clips.length === 0) {
    const emptyHeader = createWavHeader(0);
    const blob = new Blob([emptyHeader.buffer as ArrayBuffer], { type: 'audio/wav' });
    return { blob, blobUrl: URL.createObjectURL(blob) };
  }

  if (base64Clips.length === 1) {
    const bytes = base64ToUint8Array(base64Clips[0]);
    const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'audio/wav' });
    return { blob, blobUrl: URL.createObjectURL(blob) };
  }

  // Extract raw PCM chunks from all clips
  const pcmParts: Uint8Array[] = [];
  let totalPcmLength = 0;

  for (const b64 of base64Clips) {
    const bytes = base64ToUint8Array(b64);
    const { offset, size } = findDataChunk(bytes);
    const pcm = bytes.subarray(offset, offset + size);
    pcmParts.push(pcm);
    totalPcmLength += pcm.length;
  }

  // Build new combined buffer
  const header = createWavHeader(totalPcmLength, 24000, 1, 16);
  const fullBuffer = new Uint8Array(header.length + totalPcmLength);
  fullBuffer.set(header, 0);

  let currentOffset = header.length;
  for (const part of pcmParts) {
    fullBuffer.set(part, currentOffset);
    currentOffset += part.length;
  }

  const blob = new Blob([fullBuffer.buffer as ArrayBuffer], { type: 'audio/wav' });
  return { blob, blobUrl: URL.createObjectURL(blob) };
}
