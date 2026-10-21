import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getAudioCacheKey } from '../server/audioCacheKey.ts';

describe('getAudioCacheKey', () => {
  const sampleText = 'Cloud Microservices & Scalable Systems';
  const sampleVoice = 'Kore';
  const sampleStyle = 'Clear, natural, well-paced and articulate';
  const sampleModel = 'gemini-3.8-flash-lite-tts';

  it('should generate a valid 64-character lowercase hexadecimal SHA-256 hash', () => {
    const key = getAudioCacheKey(sampleText, sampleVoice, sampleStyle, sampleModel);

    assert.equal(typeof key, 'string');
    assert.equal(key.length, 64, 'SHA-256 hash must be exactly 64 characters');
    assert.match(key, /^[a-f0-9]{64}$/, 'Hash must contain only lowercase hex characters');
  });

  it('should be deterministic across repeated calls with identical parameters', () => {
    const key1 = getAudioCacheKey(sampleText, sampleVoice, sampleStyle, sampleModel);
    const key2 = getAudioCacheKey(sampleText, sampleVoice, sampleStyle, sampleModel);
    const key3 = getAudioCacheKey(sampleText, sampleVoice, sampleStyle, sampleModel);

    assert.equal(key1, key2);
    assert.equal(key2, key3);
  });

  it('should normalize leading and trailing whitespace', () => {
    const keyTrimmed = getAudioCacheKey('Hello world', 'Kore', 'Natural', 'gemini-3.8-flash-lite-tts');
    const keyUntrimmed = getAudioCacheKey('   Hello world  \n', '  Kore  ', '  Natural   ', ' gemini-3.8-flash-lite-tts ');

    assert.equal(keyTrimmed, keyUntrimmed, 'Extra surrounding whitespace should not alter cache key');
  });

  it('should generate different keys when text content changes', () => {
    const keyA = getAudioCacheKey('Hello world', sampleVoice, sampleStyle, sampleModel);
    const keyB = getAudioCacheKey('Hello World', sampleVoice, sampleStyle, sampleModel); // Case difference
    const keyC = getAudioCacheKey('Goodbye world', sampleVoice, sampleStyle, sampleModel);

    assert.notEqual(keyA, keyB, 'Case differences in text must yield different keys');
    assert.notEqual(keyA, keyC, 'Different text content must yield different keys');
  });

  it('should generate different keys when voice changes', () => {
    const keyKore = getAudioCacheKey(sampleText, 'Kore', sampleStyle, sampleModel);
    const keyPuck = getAudioCacheKey(sampleText, 'Puck', sampleStyle, sampleModel);
    const keyCharon = getAudioCacheKey(sampleText, 'Charon', sampleStyle, sampleModel);

    assert.notEqual(keyKore, keyPuck);
    assert.notEqual(keyKore, keyCharon);
    assert.notEqual(keyPuck, keyCharon);
  });

  it('should generate different keys when narration style changes', () => {
    const keyNatural = getAudioCacheKey(sampleText, sampleVoice, 'Clear and natural', sampleModel);
    const keyStoryteller = getAudioCacheKey(sampleText, sampleVoice, 'Expressive audiobook storyteller', sampleModel);
    const keyEmptyStyle = getAudioCacheKey(sampleText, sampleVoice, '', sampleModel);

    assert.notEqual(keyNatural, keyStoryteller);
    assert.notEqual(keyNatural, keyEmptyStyle);
  });

  it('should generate different keys when TTS model changes', () => {
    const keyFlashLite = getAudioCacheKey(sampleText, sampleVoice, sampleStyle, 'gemini-3.8-flash-lite-tts');
    const keyFlashFlagship = getAudioCacheKey(sampleText, sampleVoice, sampleStyle, 'gemini-3.8-flash-tts');

    assert.notEqual(keyFlashLite, keyFlashFlagship, 'Different models must yield different cache keys');
  });

  it('should handle unicode characters, technical symbols, and foreign text deterministically', () => {
    const unicodeText = 'Kubernetes (k8s) & PostgreSQL 🚀: マイクロサービス';
    const key1 = getAudioCacheKey(unicodeText, 'Zephyr', 'Tech Educator', sampleModel);
    const key2 = getAudioCacheKey(unicodeText, 'Zephyr', 'Tech Educator', sampleModel);

    assert.equal(key1, key2);
    assert.match(key1, /^[a-f0-9]{64}$/);
  });

  it('should handle default optional arguments gracefully', () => {
    const keyWithDefaults = getAudioCacheKey('Default test', 'Kore');
    const keyExplicit = getAudioCacheKey('Default test', 'Kore', '', 'gemini-3.8-flash-lite-tts');

    assert.equal(keyWithDefaults, keyExplicit, 'Omitted style and model should match default parameters');
  });
});
