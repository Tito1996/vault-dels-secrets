import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { IdleLockService } from './idle-lock.service';

describe('IdleLockService', () => {
  let service: IdleLockService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [IdleLockService],
    });
    service = TestBed.inject(IdleLockService);
  });

  afterEach(() => {
    service?.stop();
    vi.useRealTimers();
  });

  it('registra eventos al iniciar y los elimina al parar', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    service.start(1000, vi.fn());
    service.stop();

    expect(addSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();
  });

  it('ejecuta onLock cuando vence el temporizador', () => {
    vi.useFakeTimers();
    const onLock = vi.fn();

    service.start(100, onLock);
    vi.advanceTimersByTime(101);

    expect(onLock).toHaveBeenCalledTimes(1);
  });

  it('resetea el temporizador en actividad', () => {
    vi.useFakeTimers();
    const onLock = vi.fn();

    service.start(100, onLock);
    service.bump();
    vi.advanceTimersByTime(99);

    expect(onLock).not.toHaveBeenCalled();

    vi.advanceTimersByTime(2);
    expect(onLock).toHaveBeenCalledTimes(1);
  });
});
