import { Component, inject, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { VaultService } from '../../core/services/vault.service';
import { VaultCryptoService, VaultPlain } from '../../core/services/vault-crypto.service';
import { IdleLockService } from '../../core/services/idle-lock.service';

interface EntryDraft {
  name: string;
  username: string;
  password: string;
  url: string;
  notes: string;
}

@Component({
  standalone: true,
  selector: 'app-open-vault',
  imports: [FormsModule],
  templateUrl: './open-vault.html',
  styleUrl: './open-vault.scss',
})
export class OpenVault {
  private readonly crypto = inject(VaultCryptoService);
  private readonly vaultService = inject(VaultService);
  private readonly idle = inject(IdleLockService);

  // Archivo
  file: File | null = null;

  // Abrir
  openPassword = '';
  busy = false;

  // Estado
  error = '';
  savedMsg = '';
  lockedMsg = '';
  vault: VaultPlain | null = null;

  // Lista
  query = '';
  showPasswords = false;

  // Edición
  editIndex: number | null = null;
  draft: EntryDraft = this.emptyDraft();

  // Guardado
  savePassword = '';
  saving = false;

  // Dirty + idle
  dirty = false;
  readonly idleMs = 3 * 60_000;

  constructor() {
    // Vacio
  }

  // ---------- Util ----------
  emptyDraft(): EntryDraft {
    return { name: '', username: '', password: '', url: '', notes: '' };
  }

  resetEditor() {
    this.editIndex = null;
    this.draft = this.emptyDraft();
  }

  confirmDiscardIfDirty(actionLabel: string): boolean {
    if (!this.vault || !this.dirty) return true;
    return confirm(
      `Tienes cambios sin guardar.\n\n` +
        `Si continúas, se perderán.\n\n` +
        `¿Quieres continuar para ${actionLabel}?`,
    );
  }

  // ---------- File ----------
  onFileChange(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const nextFile = input.files?.[0] ?? null;
    if (!nextFile) return;

    if (!this.confirmDiscardIfDirty('abrir otro archivo')) {
      input.value = '';
      return;
    }

    this.file = nextFile;

    this.idle.stop();
    this.dirty = false;
    this.lockedMsg = '';

    this.error = '';
    this.savedMsg = '';
    this.vault = null;
    this.resetEditor();
    this.query = '';
    this.showPasswords = false;
  }

  // ---------- Abrir ----------
  async open() {
    this.error = '';
    this.savedMsg = '';
    this.lockedMsg = '';

    if (!this.file) {
      this.error = 'Selecciona un archivo.';
      return;
    }
    if (!this.openPassword) {
      this.error = 'Introduce la contraseña maestra.';
      return;
    }

    this.busy = true;
    try {
      this.vault = await this.vaultService.openVaultFile(this.file, this.openPassword);
      this.openPassword = '';
      this.dirty = false;

      this.idle.start(this.idleMs, () => this.lockVault('Bloqueado por inactividad.'));
    } catch (e: any) {
      this.error = e?.message ?? 'Error abriendo el vault';
    } finally {
      this.busy = false;
    }
  }

  lockVault(reason: string) {
    // best-effort limpiar datos sensibles
    if (this.vault) {
      for (const e of this.vault.entries) {
        e.password = '';
        e.username = '';
        e.name = '';
        if (e.url) e.url = '';
        if (e.notes) e.notes = '';
      }
    }

    this.vault = null;
    this.resetEditor();
    this.query = '';
    this.showPasswords = false;

    this.idle.stop();
    this.dirty = false;

    this.lockedMsg = reason;
    this.savedMsg = '';
    this.error = '';
  }

  // ---------- CRUD ----------
  startAdd() {
    this.error = '';
    this.savedMsg = '';
    this.resetEditor();
  }

  startEdit(i: number) {
    if (!this.vault) return;

    this.error = '';
    this.savedMsg = '';
    this.editIndex = i;

    const e = this.vault.entries[i];
    this.draft = {
      name: e.name ?? '',
      username: e.username ?? '',
      password: e.password ?? '',
      url: e.url ?? '',
      notes: e.notes ?? '',
    };
  }

  saveDraft() {
    if (!this.vault) return;

    this.error = '';
    this.savedMsg = '';

    const entry = {
      name: this.draft.name.trim(),
      username: this.draft.username,
      password: this.draft.password,
      url: this.draft.url.trim() || undefined,
      notes: this.draft.notes.trim() || undefined,
    };

    if (!entry.name || !entry.username || !entry.password) {
      this.error = 'Nombre, usuario y contraseña son obligatorios.';
      return;
    }

    const key = (x: any) =>
      `${(x.name ?? '').trim().toLowerCase()}::${(x.username ?? '').trim().toLowerCase()}`;
    const newKey = key(entry);

    const dupIdx = this.vault.entries.findIndex(
      (x, idx) => idx !== this.editIndex && key(x) === newKey,
    );
    if (dupIdx !== -1) {
      this.error = 'Ya existe una entrada con el mismo Nombre + Usuario.';
      return;
    }

    if (this.editIndex === null) this.vault.entries.push(entry);
    else this.vault.entries[this.editIndex] = entry;

    this.dirty = true;
    this.resetEditor();
  }

  deleteEntry(i: number) {
    if (!this.vault) return;
    this.error = '';
    this.savedMsg = '';

    this.vault.entries.splice(i, 1);
    if (this.editIndex === i) this.resetEditor();

    this.dirty = true;
  }

  // ---------- Filtrado ----------
  get filteredEntries() {
    if (!this.vault) return [];
    const q = this.query.trim().toLowerCase();
    if (!q) return this.vault.entries;

    return this.vault.entries.filter((e) => {
      const hay =
        `${e.name ?? ''} ${e.username ?? ''} ${e.url ?? ''} ${e.notes ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }

  trackByIdx(i: number) {
    return i;
  }

  // ---------- Clipboard ----------
  async copy(text: string) {
    await navigator.clipboard.writeText(text);
    this.savedMsg = 'Copiado al portapapeles.';
    setTimeout(() => (this.savedMsg = ''), 1500);
  }

  // ---------- Guardar como... ----------
  async saveAs() {
    this.error = '';
    this.savedMsg = '';

    if (!this.vault) {
      this.error = 'No hay vault abierto.';
      return;
    }
    if (!this.savePassword) {
      this.error = 'Introduce la contraseña maestra para guardar.';
      return;
    }

    this.saving = true;
    try {
      const envelope = await this.crypto.encryptPlain(this.vault, this.savePassword);
      this.savePassword = '';

      const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json' });

      const baseName = (this.file?.name ?? 'vault').replace(/\.[^.]+$/, '');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${baseName}.json`;
      a.click();
      URL.revokeObjectURL(a.href);

      this.savedMsg = 'Vault exportado (Guardar como…).';
      this.dirty = false;
    } catch (e: any) {
      this.error = e?.message ?? 'Error guardando el vault';
    } finally {
      this.saving = false;
    }
  }

  // ---------- Protección cierre/recarga ----------
  @HostListener('window:beforeunload', ['$event'])
  beforeUnload(event: BeforeUnloadEvent) {
    if (this.vault && this.dirty) {
      event.preventDefault();
      event.returnValue = '';
    }
  }
}
