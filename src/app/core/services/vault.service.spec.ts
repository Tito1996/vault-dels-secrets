import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { VaultCryptoService } from './vault-crypto.service';
import { VaultService } from './vault.service';

describe('VaultService', () => {
  let service: VaultService;
  const cryptoMock = {
    decryptEnvelope: vi.fn(),
  };

  beforeEach(() => {
    cryptoMock.decryptEnvelope.mockReset();
    TestBed.configureTestingModule({
      providers: [VaultService, { provide: VaultCryptoService, useValue: cryptoMock }],
    });
    service = TestBed.inject(VaultService);
  });

  it('abre un archivo JSON válido y delega el descifrado', async () => {
    const file = new File(
      [JSON.stringify({ v: 1, kdf: 'argon2id', alg: 'aes-256-gcm' })],
      'v.json',
      {
        type: 'application/json',
      },
    );
    const plain = { entries: [] };
    cryptoMock.decryptEnvelope.mockResolvedValue(plain);

    const result = await service.openVaultFile(file, 'master');

    expect(cryptoMock.decryptEnvelope).toHaveBeenCalledTimes(1);
    expect(result).toEqual(plain);
  });

  it('lanza error cuando el archivo no es JSON válido', async () => {
    const file = new File(['{ invalid json'], 'v.json', { type: 'application/json' });

    await expect(service.openVaultFile(file, 'master')).rejects.toThrow(
      'Archivo inválido: no es JSON válido',
    );
    expect(cryptoMock.decryptEnvelope).not.toHaveBeenCalled();
  });
});
