import { inject, Injectable } from '@angular/core';
import { VaultCryptoService, VaultEnvelope, VaultPlain } from './vault-crypto.service';

@Injectable({ providedIn: 'root' })
export class VaultService {
  private readonly crypto = inject(VaultCryptoService);

  async openVaultFile(file: File, masterPassword: string): Promise<VaultPlain> {
    const text = await file.text();
    let envelope: VaultEnvelope;
    try {
      envelope = JSON.parse(text) as VaultEnvelope;
    } catch {
      throw new Error('Archivo inválido: no es JSON válido');
    }
    return await this.crypto.decryptEnvelope(envelope, masterPassword);
  }
}
