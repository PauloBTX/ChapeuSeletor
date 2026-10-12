/**
 * Screen Wake Lock API wrapper to prevent screen dimming/sleep during playback
 */
export class ScreenWakeLockManager {
  private wakeLock: any | null = null;
  private isRequested = false;

  constructor() {
    // Re-acquire lock if visibility changes back to visible
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.isRequested) {
        this.request();
      }
    });
  }

  public async request(): Promise<boolean> {
    this.isRequested = true;
    try {
      if ('wakeLock' in navigator && (navigator as any).wakeLock) {
        this.wakeLock = await (navigator as any).wakeLock.request('screen');
        this.wakeLock.addEventListener('release', () => {
          this.wakeLock = null;
        });
        return true;
      }
    } catch (err) {
      console.warn('Wakelock not supported or request denied:', err);
    }
    return false;
  }

  public release(): void {
    this.isRequested = false;
    if (this.wakeLock) {
      this.wakeLock.release().catch(() => {});
      this.wakeLock = null;
    }
  }

  public isActive(): boolean {
    return this.wakeLock !== null;
  }
}

export const screenWakeLock = new ScreenWakeLockManager();
