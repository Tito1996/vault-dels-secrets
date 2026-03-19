import { describe, expect, it } from 'vitest';

import { App } from './app';

describe('App', () => {
  it('should create the app', () => {
    const app = new App();
    expect(app).toBeTruthy();
  });

  it('should expose title', () => {
    const app = new App();
    expect((app as any).title).toBe('vault-dels-secrets');
  });
});
