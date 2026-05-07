import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function hasMp3FrameSync(data) {
  for (let index = 0; index + 1 < data.length; index += 1) {
    if (data[index] === 0xff && (data[index + 1] & 0xe0) === 0xe0) {
      return true;
    }
  }

  return false;
}

describe('audio assets', () => {
  it('uses the provided measured breath mp3 as the running challenge loop', () => {
    const data = readFileSync('public/sounds/Measured_Breath.mp3');
    const hasId3Header = data.subarray(0, 3).toString('ascii') === 'ID3';

    expect(data.length).toBeGreaterThan(100_000);
    expect(hasId3Header || hasMp3FrameSync(data)).toBe(true);
  });
});
