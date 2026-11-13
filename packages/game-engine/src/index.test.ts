import { describe, expect, it } from 'vitest';
import { ENGINE_API_VERSION } from './index.js';

describe('game-engine public API', () => {
  it('exposes the API version', () => {
    expect(ENGINE_API_VERSION).toBe(0);
  });
});
