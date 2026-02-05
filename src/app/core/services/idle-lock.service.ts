import { inject, Injectable, NgZone } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class IdleLockService {
  private readonly zone = inject(NgZone);

  private timeoutMs = 3 * 60_000; // 3 min (ajusta)
  private timer: any = null;
  private active = false;
  private onLock: (() => void) | null = null;

  // Eventos típicos de actividad
  private readonly events = [
    'mousemove',
    'mousedown',
    'keydown',
    'scroll',
    'touchstart',
    'pointerdown',
  ];

  constructor() {
    // Vacio
  }

  start(timeoutMs: number, onLock: () => void) {
    this.stop();
    this.timeoutMs = timeoutMs;
    this.onLock = onLock;
    this.active = true;

    // fuera de Angular para no disparar change detection en cada evento
    this.zone.runOutsideAngular(() => {
      for (const ev of this.events) window.addEventListener(ev, this.bump, { passive: true });
      this.resetTimer();
    });
  }

  stop() {
    if (!this.active) return;
    this.active = false;

    for (const ev of this.events) window.removeEventListener(ev, this.bump as any);
    this.clearTimer();
    this.onLock = null;
  }

  bump = () => {
    if (!this.active) return;
    this.resetTimer();
  };

  private resetTimer() {
    this.clearTimer();
    this.timer = setTimeout(() => {
      // vuelve a Angular para actualizar UI
      this.zone.run(() => {
        if (this.onLock) this.onLock();
      });
    }, this.timeoutMs);
  }

  private clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
