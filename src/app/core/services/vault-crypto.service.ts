import { Injectable } from '@angular/core';
import argon2 from 'argon2-browser';
import {
  b64ToBytes,
  bytesToB64,
  utf8ToBytes,
  bytesToUtf8,
  randomBytes,
} from '../../shared/utils/crypto';

export interface VaultEnvelope {
  v: 1;
  kdf: 'argon2id';
  salt: string; // b64
  params: { m: number; t: number; p: number };
  alg: 'aes-256-gcm';
  iv: string; // b64 (12 bytes recomendado)
  ct: string; // b64 (ciphertext + tag)
}

export interface VaultPlain {
  entries: {
    name: string;
    username: string;
    password: string;
    url?: string;
    notes?: string;
  }[];
}

@Injectable({ providedIn: 'root' })
export class VaultCryptoService {
  // Parámetros recomendables de arranque (ajústalos según rendimiento)
  readonly defaultParams = { m: 65536, t: 3, p: 1 }; // memoria KB-ish para argon2-browser (depende implementación)

  private toArrayBufferView(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
    // Crea una copia respaldada por ArrayBuffer "normal" para satisfacer BufferSource
    const out = new Uint8Array(bytes.byteLength);
    out.set(bytes);
    return out;
  }

  async deriveKey(
    masterPassword: string,
    salt: Uint8Array,
    params = this.defaultParams,
  ): Promise<CryptoKey> {
    // Argon2id -> 32 bytes para AES-256
    const res = await argon2.hash({
      pass: masterPassword,
      salt,
      type: argon2.ArgonType.Argon2id,
      hashLen: 32,
      time: params.t,
      mem: params.m,
      parallelism: params.p,
    });

    const keyBytes = new Uint8Array(res.hash); // ArrayBuffer -> Uint8Array
    // Importar como clave AES-GCM
    const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, [
      'encrypt',
      'decrypt',
    ]);

    // best-effort: limpiar material sensible
    keyBytes.fill(0);
    return key;
  }

  async decryptEnvelope(envelope: VaultEnvelope, masterPassword: string): Promise<VaultPlain> {
    if (envelope.v !== 1) throw new Error('Versión de archivo no soportada');
    if (envelope.kdf !== 'argon2id') throw new Error('KDF no soportado');
    if (envelope.alg !== 'aes-256-gcm') throw new Error('Algoritmo no soportado');

    const salt = b64ToBytes(envelope.salt);
    const iv = b64ToBytes(envelope.iv);
    const ct = b64ToBytes(envelope.ct);
    const ivView = this.toArrayBufferView(iv);
    const ctView = this.toArrayBufferView(ct);

    const key = await this.deriveKey(masterPassword, salt, envelope.params);

    let ptBytes: ArrayBuffer;
    try {
      ptBytes = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ivView }, key, ctView);
    } catch {
      // Con AES-GCM, contraseña incorrecta o archivo manipulado => falla aquí
      throw new Error('Contraseña incorrecta o archivo corrupto');
    }

    const json = bytesToUtf8(new Uint8Array(ptBytes));
    const plain = JSON.parse(json) as VaultPlain;

    return plain;
  }

  // Opcional: para guardar/exportar (puedes no usarlo)
  async encryptPlain(
    plain: VaultPlain,
    masterPassword: string,
    params = this.defaultParams,
  ): Promise<VaultEnvelope> {
    const salt = randomBytes(16);
    const iv = randomBytes(12); // recomendado para GCM
    const ivView = this.toArrayBufferView(iv);

    const key = await this.deriveKey(masterPassword, salt, params);
    const pt = utf8ToBytes(JSON.stringify(plain));
    const ptView = this.toArrayBufferView(pt);

    const ctBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: ivView }, key, ptView);
    const ct = new Uint8Array(ctBuf);

    // best-effort
    pt.fill(0);

    return {
      v: 1,
      kdf: 'argon2id',
      salt: bytesToB64(salt),
      params,
      alg: 'aes-256-gcm',
      iv: bytesToB64(iv),
      ct: bytesToB64(ct),
    };
  }
}
