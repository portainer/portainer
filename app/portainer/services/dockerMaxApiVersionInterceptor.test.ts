import { describe, expect, it } from 'vitest';

import { getDockerApiVersionOverride } from './dockerMaxApiVersionInterceptor';

describe('getDockerApiVersionOverride', () => {
  it('returns null when the api version is within supported range', () => {
    expect(getDockerApiVersionOverride(1.3, 0, 1.41)).toBeNull();
  });

  it('limits the version to the configured maximum', () => {
    expect(getDockerApiVersionOverride(1.5, 0, 1.41)).toBe(1.41);
  });

  it('never downgrades below Docker minimum API version', () => {
    expect(getDockerApiVersionOverride(1.5, 1.44, 1.41)).toBe(1.44);
  });

  it('returns null when docker minimum equals the negotiated version', () => {
    expect(getDockerApiVersionOverride(1.44, 1.44, 1.41)).toBeNull();
  });

  it('returns null when the api version is missing', () => {
    expect(getDockerApiVersionOverride(0, 1.44, 1.41)).toBeNull();
  });
});
