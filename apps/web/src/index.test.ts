import { ENGINE_API_VERSION } from '@tetris/game-engine';
import { describe, expect, it } from 'vitest';
import { engineApiVersion } from './index.js';

describe('engine integration', () => {
  it('consumes @tetris/game-engine through its package exports', () => {
    expect(engineApiVersion).toBe(ENGINE_API_VERSION);
  });
});
