import { Injectable } from '@angular/core';
import argon2 from 'argon2-browser/dist/argon2-bundled.min.js';
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
  private static calls = 0;

  // Parámetros recomendables de arranque (ajústalos según rendimiento)
  readonly defaultParams = { m: 16384, t: 2, p: 1 }; // memoria KB-ish para argon2-browser (depende implementación)

  private toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
    // Crea un ArrayBuffer exacto (sin offset) siempre respaldado por ArrayBuffer
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  }

  async deriveKey(
    masterPassword: string,
    salt: Uint8Array,
    params = this.defaultParams,
  ): Promise<CryptoKey> {
    // Argon2id -> 32 bytes para AES-256
    const n = ++VaultCryptoService.calls;
    console.log('deriveKey call #', n);
    const res = await argon2.hash({
      pass: masterPassword,
      salt,
      type: 2,
      hashLen: 32,
      time: params.t,
      mem: params.m,
      parallelism: params.p,
      distPath: '',
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
    const t = (label: string, t0: number) =>
      console.log(label, Math.round(performance.now() - t0), 'ms');

    if (envelope.v !== 1) throw new Error('Versión de archivo no soportada');
    if (envelope.kdf !== 'argon2id') throw new Error('KDF no soportado');
    if (envelope.alg !== 'aes-256-gcm') throw new Error('Algoritmo no soportado');

    let t0 = performance.now();
    const salt = b64ToBytes(envelope.salt);
    t('b64 salt', t0);

    t0 = performance.now();
    const iv = this.toArrayBuffer(b64ToBytes(envelope.iv));
    t('b64 iv', t0);

    t0 = performance.now();
    const ct = this.toArrayBuffer(b64ToBytes(envelope.ct));
    t('b64 ct', t0);
    console.log('ct bytes', ct.byteLength);

    t0 = performance.now();
    const key = await this.deriveKey(masterPassword, salt, envelope.params);
    t('deriveKey', t0);

    let ptBytes: ArrayBuffer;
    try {
      console.log('ct (base64 chars):', envelope.ct.length);
      console.log('ct (bytes):', ct.byteLength);
      console.log('iv (bytes):', iv.byteLength);
      t0 = performance.now();
      ptBytes = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
      t('aes decrypt', t0);
      console.log('pt bytes', ptBytes.byteLength);
    } catch {
      // Con AES-GCM, contraseña incorrecta o archivo manipulado => falla aquí
      throw new Error('Contraseña incorrecta o archivo corrupto');
    }

    t0 = performance.now();
    const json = new TextDecoder().decode(new Uint8Array(ptBytes));
    t('utf8 decode', t0);
    console.log('json chars', json.length);

    t0 = performance.now();
    const plain = JSON.parse(json);
    t('json parse', t0);
    return plain as VaultPlain;
  }

  // Opcional: para guardar/exportar (puedes no usarlo)
  async encryptPlain(
    plain: VaultPlain,
    masterPassword: string,
    params = this.defaultParams,
  ): Promise<VaultEnvelope> {
    const salt = randomBytes(16);
    const iv = randomBytes(12); // recomendado para GCM
    const ivView = this.toArrayBuffer(iv);

    const key = await this.deriveKey(masterPassword, salt, params);
    const pt = utf8ToBytes(JSON.stringify(plain));
    const ptView = this.toArrayBuffer(pt);

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
