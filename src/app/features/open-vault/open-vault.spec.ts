import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OpenVault } from './open-vault';
import { VaultService } from '../../core/services/vault.service';
import { VaultCryptoService } from '../../core/services/vault-crypto.service';
import { IdleLockService } from '../../core/services/idle-lock.service';

describe('OpenVault', () => {
  const vaultServiceMock = {
    openVaultFile: vi.fn(),
  };

  const vaultCryptoMock = {
    encryptPlain: vi.fn(),
  };

  const idleMock = {
    start: vi.fn(),
    stop: vi.fn(),
  };

  let component: OpenVault;

  beforeEach(() => {
    vaultServiceMock.openVaultFile.mockReset();
    vaultCryptoMock.encryptPlain.mockReset();
    idleMock.start.mockReset();
    idleMock.stop.mockReset();

    TestBed.configureTestingModule({
      providers: [
        { provide: VaultService, useValue: vaultServiceMock },
        { provide: VaultCryptoService, useValue: vaultCryptoMock },
        { provide: IdleLockService, useValue: idleMock },
      ],
    });

    component = TestBed.runInInjectionContext(() => new OpenVault());
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('filtra entradas por texto y categoría', () => {
    component.vault.set({
      entries: [
        { name: 'GitHub', username: 'alice', password: 'a', category: 'Trabajo' },
        { name: 'Gmail', username: 'bob', password: 'b', category: 'Personal' },
      ],
    });

    component.query.set('git');
    component.categoryFilter.set('trabajo');

    expect(component.filteredEntries().length).toBe(1);
    expect(component.filteredEntries()[0].name).toBe('GitHub');
  });

  it('saveDraft valida campos obligatorios', () => {
    component.vault.set({ entries: [] });
    component.draft.set({
      name: '',
      username: '',
      password: '',
      category: '',
      url: '',
      notes: '',
    });

    component.saveDraft();

    expect(component.error()).toContain('obligatorios');
  });

  it('saveDraft añade una entrada y marca dirty', () => {
    component.vault.set({ entries: [] });
    component.draft.set({
      name: 'GitHub',
      username: 'alice',
      password: 'secret',
      category: '',
      url: '',
      notes: '',
    });

    component.saveDraft();

    expect(component.vault()?.entries.length).toBe(1);
    expect(component.dirty()).toBe(true);
  });

  it('lockVault limpia estado sensible y muestra motivo', () => {
    component.vault.set({
      entries: [{ name: 'X', username: 'Y', password: 'Z', category: 'c', url: 'u', notes: 'n' }],
    });
    component.dirty.set(true);

    component.lockVault('Bloqueado por test');

    expect(component.vault()).toBeNull();
    expect(component.dirty()).toBe(false);
    expect(component.lockedMsg()).toBe('Bloqueado por test');
    expect(idleMock.stop).toHaveBeenCalled();
  });
});
