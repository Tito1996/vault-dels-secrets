import {
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { VaultService } from '../../core/services/vault.service';
import { VaultCryptoService, VaultPlain } from '../../core/services/vault-crypto.service';
import { IdleLockService } from '../../core/services/idle-lock.service';

interface EntryDraft {
  name: string;
  username: string;
  password: string;
  category: string;
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

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  // Crear nuevo vault
  creating = false;
  newVaultPassword = '';
  newVaultPassword2 = '';
  newVaultName = 'vault-nuevo';
  seedDemo = true; // entradas de ejemplo
  passwordScore = 0; // 0..4
  passwordHint = '';

  // Signals de estado
  file = signal<File | null>(null);
  fileHandle: FileSystemFileHandle | null = null;

  openPassword = signal('');
  busy = signal(false);

  error = signal('');
  savedMsg = signal('');
  lockedMsg = signal('');

  vault = signal<VaultPlain | null>(null);

  query = signal('');
  categoryFilter = signal('');
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
    const category = this.categoryFilter().trim().toLowerCase();

    if (!q && !category) return v.entries;

    return v.entries.filter((e) => {
      const hay =
        `${e.name ?? ''} ${e.username ?? ''} ${e.category ?? ''} ${e.url ?? ''} ${e.notes ?? ''}`.toLowerCase();
      const matchesQuery = !q || hay.includes(q);
      const matchesCategory = !category || (e.category ?? '').trim().toLowerCase() === category;
      return matchesQuery && matchesCategory;
    });
  });

  categories = computed(() => {
    const v = this.vault();
    if (!v) return [];

    const values = new Set<string>();
    for (const e of v.entries) {
      const c = (e.category ?? '').trim();
      if (c) values.add(c);
    }

    return Array.from(values).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
  });

  emptyDraft(): EntryDraft {
    return { name: '', username: '', password: '', category: '', url: '', notes: '' };
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
    this.categoryFilter.set('');
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

  async openWithPicker() {
    if (!this.confirmDiscardIfDirty('abrir otro archivo')) return;

    try {
      const [handle] = await (window as any).showOpenFilePicker({
        types: [
          {
            description: 'Vault JSON',
            accept: { 'application/json': ['.json'] },
          },
        ],
        excludeAcceptAllOption: true,
        multiple: false,
      });

      this.fileHandle = handle;
      const file = await handle.getFile();
      this.file.set(file);

      this.idle.stop();
      this.dirty.set(false);
      this.lockedMsg.set('');

      this.error.set('');
      this.savedMsg.set('');
      this.vault.set(null);
      this.resetEditor();
      this.query.set('');
      this.categoryFilter.set('');
      this.showPasswords.set(false);
    } catch {
      this.fileInput.nativeElement.click();
      return; // cancelado
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
        if (e.category) e.category = '';
        if (e.url) e.url = '';
        if (e.notes) e.notes = '';
      }
    }

    this.vault.set(null);
    this.resetEditor();
    this.query.set('');
    this.categoryFilter.set('');
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
      category: e.category ?? '',
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
      category: d.category.trim() || undefined,
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

  async save() {
    this.error.set('');
    this.savedMsg.set('');

    const v = this.vault();
    if (!v) return this.error.set('No hay vault abierto.');
    if (!this.savePassword())
      return this.error.set('Introduce la contraseña maestra para guardar.');

    this.saving.set(true);
    try {
      const envelope = await this.crypto.encryptPlain(v, this.savePassword());
      const json = JSON.stringify(envelope, null, 2);
      this.savePassword.set('');

      if (this.fileHandle) {
        const writable = await this.fileHandle.createWritable();
        await writable.write(json);
        await writable.close();

        this.savedMsg.set('Vault sobrescrito correctamente.');
      } else {
        const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json' });
        const baseName = (this.file()?.name ?? 'vault').replace(/\.[^.]+$/, '');

        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${baseName}.json`;
        a.click();
        URL.revokeObjectURL(a.href);

        this.savedMsg.set('Vault exportado (Guardar como…).');
      }
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

  // Crear nuevo vault
  startCreate() {
    // si hay cambios, confirmamos descarte (porque vas a “cambiar de contexto”)
    if (!this.confirmDiscardIfDirty('crear un vault nuevo')) return;

    this.creating = true;
    this.error.set('');
    this.savedMsg.set('');
    this.lockedMsg.set('');

    this.newVaultPassword = '';
    this.newVaultPassword2 = '';
    this.newVaultName = 'vault-nuevo';
    this.seedDemo = true;

    this.passwordScore = 0;
    this.passwordHint = '';
  }

  cancelCreate() {
    this.creating = false;
    this.newVaultPassword = '';
    this.newVaultPassword2 = '';
    this.passwordScore = 0;
    this.passwordHint = '';
  }

  private buildDemoPlain(): VaultPlain {
    return {
      entries: [
        {
          name: 'GitHub',
          username: 'alice@example.com',
          password: 'P@ssw0rd-GH!',
          category: 'Trabajo',
          url: 'https://github.com',
          notes: 'Cuenta principal',
        },
        {
          name: 'Gmail',
          username: 'alice@gmail.com',
          password: 'S3gura#Mail2026',
          category: 'Personal',
          url: 'https://mail.google.com',
          notes: '2FA activado',
        },
        {
          name: 'WiFi Casa',
          username: '(SSID) MiCasa',
          password: 'MiWifiSuperSecreto!',
          category: 'Hogar',
          notes: 'Router salón',
        },
      ],
    };
  }

  async createVaultFile() {
    this.error.set('');
    this.savedMsg.set('');
    this.lockedMsg.set('');

    const p1 = this.newVaultPassword;
    const p2 = this.newVaultPassword2;

    if (!p1 || p1.length < 8) {
      this.error.set('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (p1 !== p2) {
      this.error.set('Las contraseñas no coinciden.');
      return;
    }

    // Recomendar más seguridad sin bloquear
    const { score } = this.evalPassword(p1);
    if (score <= 1) {
      const ok = confirm('La contraseña parece débil. ¿Quieres continuar igualmente?');
      if (!ok) return;
    }

    this.creating = false;
    this.saving.set(true);

    try {
      const plain: VaultPlain = this.seedDemo ? this.buildDemoPlain() : { entries: [] };

      const envelope = await this.crypto.encryptPlain(plain, p1);

      const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json' });
      const safeName = (this.newVaultName || 'vault-nuevo').replace(/[^\w-]+/g, '-');

      // 1) Descargar
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${safeName}.json`;
      a.click();
      URL.revokeObjectURL(a.href);

      // 2) Auto-abrir en la app (sin volver a seleccionar archivo)
      const file = new File([blob], `${safeName}.json`, { type: 'application/json' });
      this.file.set(file);
      this.vault.set(plain);

      // Estado UI
      this.creating = false;
      this.dirty.set(false);
      this.query.set('');
      this.categoryFilter.set('');
      this.showPasswords.set(false);
      this.resetEditor();

      this.savedMsg.set('Vault nuevo creado y descargado.');
      this.idle.start(this.idleMs, () => this.lockVault('Bloqueado por inactividad.'));
    } catch (e: any) {
      this.error.set(e?.message ?? 'Error creando el vault');
    } finally {
      this.saving.set(false);

      // best-effort: limpiar passwords
      this.newVaultPassword = '';
      this.newVaultPassword2 = '';
      this.passwordScore = 0;
      this.passwordHint = '';
    }
  }

  private evalPassword(p: string): { score: number; hint: string } {
    // Heurística simple: longitud + diversidad
    let score = 0;

    if (p.length >= 10) score++;
    if (p.length >= 14) score++;
    if (/[a-z]/.test(p) && /[A-Z]/.test(p)) score++;
    if (/\d/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;

    // Normaliza a 0..4 (cap)
    score = Math.min(4, Math.max(0, score - 1)); // (para que no suba “demasiado fácil”)

    const hints = [
      'Muy débil: usa más longitud y mezcla tipos de caracteres.',
      'Débil: añade mayúsculas, números y símbolos.',
      'Aceptable: mejor si supera 14 caracteres.',
      'Buena.',
      'Muy buena.',
    ];

    return { score, hint: hints[Math.min(hints.length - 1, score)] };
  }

  onNewPasswordInput() {
    const r = this.evalPassword(this.newVaultPassword);
    this.passwordScore = r.score;
    this.passwordHint = r.hint;
  }
}
