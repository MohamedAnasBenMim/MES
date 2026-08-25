import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Subject,
} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class IdleTimeoutService {

private readonly idleTimeoutMilliseconds =
  3 * 60 * 1000;

private readonly warningDurationSeconds =
  30 * 60;

  private idleTimer: ReturnType<typeof setTimeout> | null =
    null;

  private warningTimer:
    ReturnType<typeof setInterval> | null = null;

  private isStarted = false;

  private readonly warningVisibleSubject =
    new BehaviorSubject<boolean>(false);

  private readonly remainingSecondsSubject =
    new BehaviorSubject<number>(
      this.warningDurationSeconds
    );

  private readonly activitySubject =
    new Subject<void>();

  private readonly timeoutSubject =
    new Subject<void>();

  readonly warningVisible$ =
    this.warningVisibleSubject.asObservable();

  readonly remainingSeconds$ =
    this.remainingSecondsSubject.asObservable();

  readonly activity$ =
    this.activitySubject.asObservable();

  readonly timedOut$ =
    this.timeoutSubject.asObservable();

  private readonly clickListener = (): void => {
    this.registerActivity();
  };

  private readonly keyboardListener = (): void => {
    this.registerActivity();
  };

  start(): void {
    if (this.isStarted) {
      this.resetIdleTimer(false);
      return;
    }

    this.isStarted = true;

    document.addEventListener(
      'click',
      this.clickListener,
      true
    );

    document.addEventListener(
      'keydown',
      this.keyboardListener,
      true
    );

    this.warningVisibleSubject.next(false);

    this.remainingSecondsSubject.next(
      this.warningDurationSeconds
    );

    this.resetIdleTimer(false);
  }

  stop(): void {
    this.isStarted = false;

    document.removeEventListener(
      'click',
      this.clickListener,
      true
    );

    document.removeEventListener(
      'keydown',
      this.keyboardListener,
      true
    );

    this.clearIdleTimer();
    this.clearWarningTimer();

    this.warningVisibleSubject.next(false);

    this.remainingSecondsSubject.next(
      this.warningDurationSeconds
    );
  }

  continueSession(): void {
    if (!this.isStarted) {
      return;
    }

    this.clearWarningTimer();

    this.warningVisibleSubject.next(false);

    this.remainingSecondsSubject.next(
      this.warningDurationSeconds
    );

    this.activitySubject.next();

    this.resetIdleTimer(false);
  }

  private registerActivity(): void {
    if (!this.isStarted) {
      return;
    }

    /*
     * When the warning modal is displayed, only the
     * Continue Session button can continue the session.
     */
    if (this.warningVisibleSubject.value) {
      return;
    }

    this.activitySubject.next();

    this.resetIdleTimer(false);
  }

  private resetIdleTimer(
    emitActivity: boolean
  ): void {
    this.clearIdleTimer();

    if (emitActivity) {
      this.activitySubject.next();
    }

    this.idleTimer = setTimeout(() => {
      this.showWarning();
    }, this.idleTimeoutMilliseconds);
  }

  private showWarning(): void {
    if (!this.isStarted) {
      return;
    }

    this.clearIdleTimer();
    this.clearWarningTimer();

    this.warningVisibleSubject.next(true);

    this.remainingSecondsSubject.next(
      this.warningDurationSeconds
    );

    this.warningTimer = setInterval(() => {
      const nextValue =
        this.remainingSecondsSubject.value - 1;

      this.remainingSecondsSubject.next(
        Math.max(nextValue, 0)
      );

      if (nextValue <= 0) {
        this.clearWarningTimer();

        this.warningVisibleSubject.next(false);

        this.timeoutSubject.next();
      }
    }, 1000);
  }

  private clearIdleTimer(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  private clearWarningTimer(): void {
    if (this.warningTimer) {
      clearInterval(this.warningTimer);
      this.warningTimer = null;
    }
  }
}