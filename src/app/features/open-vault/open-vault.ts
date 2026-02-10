import { Component, HostListener, computed, inject, signal } from '@angular/core';
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

  // Signals de estado
  file = signal<File | null>(null);

  openPassword = signal('');
  busy = signal(false);

  error = signal('');
  savedMsg = signal('');
  lockedMsg = signal('');

  vault = signal<VaultPlain | null>(null);

  query = signal('');
  showPasswords = signal(false);

  editIndex = signal<number | null>(null);
  draft = signal<EntryDraft>(this.emptyDraft());

  savePassword = signal('');
  saving = signal(false);

  dirty = signal(false);
  readonly idleMs = 3 * 60_000;

  // Computed
  filteredEntries = computed(() => {
    const v = this.vault();
    if (!v) return [];
    const q = this.query().trim().toLowerCase();
    if (!q) return v.entries;

    return v.entries.filter((e) => {
      const hay =
        `${e.name ?? ''} ${e.username ?? ''} ${e.url ?? ''} ${e.notes ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  });

  emptyDraft(): EntryDraft {
    return { name: '', username: '', password: '', url: '', notes: '' };
  }

  resetEditor() {
    this.editIndex.set(null);
    this.draft.set(this.emptyDraft());
  }

  confirmDiscardIfDirty(actionLabel: string): boolean {
    if (!this.vault() || !this.dirty()) return true;
    return confirm(
      `Tienes cambios sin guardar.\n\nSi continúas, se perderán.\n\n¿Quieres continuar para ${actionLabel}?`,
    );
  }

  onFileChange(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const nextFile = input.files?.[0] ?? null;
    if (!nextFile) return;

    if (!this.confirmDiscardIfDirty('abrir otro archivo')) {
      input.value = '';
      return;
    }

    this.file.set(nextFile);

    this.idle.stop();
    this.dirty.set(false);
    this.lockedMsg.set('');

    this.error.set('');
    this.savedMsg.set('');
    this.vault.set(null);
    this.resetEditor();
    this.query.set('');
    this.showPasswords.set(false);
  }

  async open() {
    this.error.set('');
    this.savedMsg.set('');
    this.lockedMsg.set('');

    const f = this.file();
    if (!f) return this.error.set('Selecciona un archivo.');
    if (!this.openPassword()) return this.error.set('Introduce la contraseña maestra.');

    this.busy.set(true);

    try {
      const vault = await this.vaultService.openVaultFile(f, this.openPassword());

      this.vault.set(vault);
      this.openPassword.set('');
      this.dirty.set(false);
      this.busy.set(false);

      this.idle.start(this.idleMs, () => this.lockVault('Bloqueado por inactividad.'));
    } catch (e: any) {
      this.error.set(e?.message ?? 'Error abriendo el vault');
      this.busy.set(false);
    }
  }

  lockVault(reason: string) {
    const v = this.vault();
    if (v) {
      // best-effort limpiar strings
      for (const e of v.entries) {
        e.password = '';
        e.username = '';
        e.name = '';
        if (e.url) e.url = '';
        if (e.notes) e.notes = '';
      }
    }

    this.vault.set(null);
    this.resetEditor();
    this.query.set('');
    this.showPasswords.set(false);

    this.idle.stop();
    this.dirty.set(false);

    this.lockedMsg.set(reason);
    this.savedMsg.set('');
    this.error.set('');
  }

  startAdd() {
    this.error.set('');
    this.savedMsg.set('');
    this.resetEditor();
  }

  startEdit(i: number) {
    const v = this.vault();
    if (!v) return;

    this.error.set('');
    this.savedMsg.set('');
    this.editIndex.set(i);

    const e = v.entries[i];
    this.draft.set({
      name: e.name ?? '',
      username: e.username ?? '',
      password: e.password ?? '',
      url: e.url ?? '',
      notes: e.notes ?? '',
    });
  }

  saveDraft() {
    const v = this.vault();
    if (!v) return;

    this.error.set('');
    this.savedMsg.set('');

    const d = this.draft();
    const entry = {
      name: d.name.trim(),
      username: d.username,
      password: d.password,
      url: d.url.trim() || undefined,
      notes: d.notes.trim() || undefined,
    };

    if (!entry.name || !entry.username || !entry.password) {
      this.error.set('Nombre, usuario y contraseña son obligatorios.');
      return;
    }

    const key = (x: any) =>
      `${(x.name ?? '').trim().toLowerCase()}::${(x.username ?? '').trim().toLowerCase()}`;
    const newKey = key(entry);

    const idxEdit = this.editIndex();
    const dupIdx = v.entries.findIndex((x, idx) => idx !== idxEdit && key(x) === newKey);
    if (dupIdx !== -1) {
      this.error.set('Ya existe una entrada con el mismo Nombre + Usuario.');
      return;
    }

    if (idxEdit === null) v.entries.push(entry);
    else v.entries[idxEdit] = entry;

    // Muy importante en signals: si mutas arrays/objetos, "toca" la señal para notificar
    this.vault.set({ ...v, entries: [...v.entries] });

    this.dirty.set(true);
    this.resetEditor();
  }

  deleteEntry(i: number) {
    const v = this.vault();
    if (!v) return;

    this.error.set('');
    this.savedMsg.set('');

    v.entries.splice(i, 1);

    const idxEdit = this.editIndex();
    if (idxEdit === i) this.resetEditor();

    this.vault.set({ ...v, entries: [...v.entries] });

    this.dirty.set(true);
  }

  async copy(text: string) {
    await navigator.clipboard.writeText(text);
    this.savedMsg.set('Copiado al portapapeles.');
    setTimeout(() => this.savedMsg.set(''), 1500);
  }

  async saveAs() {
    this.error.set('');
    this.savedMsg.set('');

    const v = this.vault();
    if (!v) return this.error.set('No hay vault abierto.');
    if (!this.savePassword())
      return this.error.set('Introduce la contraseña maestra para guardar.');

    this.saving.set(true);
    try {
      const envelope = await this.crypto.encryptPlain(v, this.savePassword());
      this.savePassword.set('');

      const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json' });
      const baseName = (this.file()?.name ?? 'vault').replace(/\.[^.]+$/, '');

      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${baseName}.json`;
      a.click();
      URL.revokeObjectURL(a.href);

      this.savedMsg.set('Vault exportado (Guardar como…).');
      this.dirty.set(false);
    } catch (e: any) {
      this.error.set(e?.message ?? 'Error guardando el vault');
    } finally {
      this.saving.set(false);
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  beforeUnload(event: BeforeUnloadEvent) {
    if (this.vault() && this.dirty()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }
}
