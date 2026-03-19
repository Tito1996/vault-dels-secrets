import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

vi.mock('argon2-browser/dist/argon2-bundled.min.js', () => ({
  default: {
    hash: vi.fn(),
  },
}));

import argon2 from 'argon2-browser/dist/argon2-bundled.min.js';
import { VaultCryptoService, VaultEnvelope } from './vault-crypto.service';

describe('VaultCryptoService', () => {
  let service: VaultCryptoService;

  beforeEach(() => {
    service = new VaultCryptoService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deriveKey usa argon2 y crea una clave AES-GCM', async () => {
    const hashMock = vi.mocked(argon2.hash);
    hashMock.mockResolvedValue({ hash: new Uint8Array(32).buffer } as never);

    const importKeySpy = vi.spyOn(crypto.subtle, 'importKey').mockResolvedValue({} as CryptoKey);

    const key = await service.deriveKey('master', new Uint8Array([1, 2, 3]));

    expect(key).toBeTruthy();
    expect(hashMock).toHaveBeenCalledTimes(1);
    expect(importKeySpy).toHaveBeenCalledTimes(1);
  });

  it('decryptEnvelope valida versión y metadatos de cifrado', async () => {
    const badVersion = {
      v: 2,
      kdf: 'argon2id',
      params: { m: 1, t: 1, p: 1 },
      alg: 'aes-256-gcm',
      salt: 'AA==',
      iv: 'AA==',
      ct: 'AA==',
    } as unknown as VaultEnvelope;

    await expect(service.decryptEnvelope(badVersion, 'master')).rejects.toThrow(
      'Versión de archivo no soportada',
    );
  });

  it('encryptPlain devuelve un sobre con formato esperado', async () => {
    vi.spyOn(service, 'deriveKey').mockResolvedValue({} as CryptoKey);
    vi.spyOn(crypto.subtle, 'encrypt').mockResolvedValue(new Uint8Array([1, 2, 3]).buffer);

    const envelope = await service.encryptPlain(
      {
        entries: [
          {
            name: 'GitHub',
            username: 'u',
            password: 'p',
          },
        ],
      },
      'master',
    );

    expect(envelope.v).toBe(1);
    expect(envelope.kdf).toBe('argon2id');
    expect(envelope.alg).toBe('aes-256-gcm');
    expect(envelope.salt.length).toBeGreaterThan(0);
    expect(envelope.iv.length).toBeGreaterThan(0);
    expect(envelope.ct.length).toBeGreaterThan(0);
  });
});
