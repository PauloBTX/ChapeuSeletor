import type {
  AudioEngineCallbacks,
  PlaybackEngineMode,
  SortingTrack
} from './types';
import { generateSortingSequence } from './types';
import { screenWakeLock } from './wakelock';

/**
 * High-performance Gapless Audio Engine for the Sorting Hat Ceremony
 * Supports both:
 * 1. Web Audio API Engine (Sample-accurate, zero-latency PCM buffer scheduling)
 * 2. Dual HTML5 Audio Player Engine (Ping-pong alternating preloaded buffers)
 */
export class GaplessAudioEngine {
  private mode: PlaybackEngineMode = 'webaudio';
  private callbacks: AudioEngineCallbacks = {};
  private isPlaying = false;
  private currentTrackIndex = -1;
  private currentSequence: SortingTrack[] = [];

  // Web Audio API components
  private audioCtx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private currentSourceNode: AudioBufferSourceNode | null = null;
  private nextSourceNode: AudioBufferSourceNode | null = null;
  private bufferCache = new Map<string, AudioBuffer>();
  private scheduledTimeoutId: number | null = null;

  // Dual Player Pipeline components
  private playerA: HTMLAudioElement | null = null;
  private playerB: HTMLAudioElement | null = null;
  private activePlayer: 'A' | 'B' = 'A';

  // Volume (0 to 1)
  private volume = 1.0;

  constructor(mode: PlaybackEngineMode = 'webaudio', callbacks: AudioEngineCallbacks = {}) {
    this.mode = mode;
    this.callbacks = callbacks;
  }

  public setCallbacks(callbacks: AudioEngineCallbacks): void {
    this.callbacks = callbacks;
  }

  public setMode(mode: PlaybackEngineMode): void {
    if (this.isPlaying) {
      this.stop();
    }
    this.mode = mode;
  }

  public getMode(): PlaybackEngineMode {
    return this.mode;
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyserNode;
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.gainNode && this.audioCtx) {
      this.gainNode.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
    }
    if (this.playerA) this.playerA.volume = this.volume;
    if (this.playerB) this.playerB.volume = this.volume;
  }

  public getVolume(): number {
    return this.volume;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentTrack(): SortingTrack | null {
    if (this.currentTrackIndex >= 0 && this.currentTrackIndex < this.currentSequence.length) {
      return this.currentSequence[this.currentTrackIndex];
    }
    return null;
  }

  public getCurrentSequence(): SortingTrack[] {
    return this.currentSequence;
  }

  /**
   * Initialize or resume the Web Audio Context (must be triggered by user gesture)
   */
  private ensureAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();

      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);

      this.analyserNode = this.audioCtx.createAnalyser();
      this.analyserNode.fftSize = 128;
      this.analyserNode.smoothingTimeConstant = 0.8;

      this.gainNode.connect(this.analyserNode);
      this.analyserNode.connect(this.audioCtx.destination);
    }

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    return this.audioCtx;
  }

  /**
   * Pre-fetches and decodes an audio file into an AudioBuffer with in-memory caching
   */
  public async loadAudioBuffer(url: string): Promise<AudioBuffer> {
    const cached = this.bufferCache.get(url);
    if (cached) {
      return cached;
    }

    const ctx = this.ensureAudioContext();
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Falha ao carregar áudio (${response.status} ${response.statusText}): ${url}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    this.bufferCache.set(url, audioBuffer);
    return audioBuffer;
  }

  /**
   * Preloads all buffers for an entire sequence concurrently
   */
  public async preloadSequence(tracks: SortingTrack[]): Promise<AudioBuffer[]> {
    return Promise.all(tracks.map(t => this.loadAudioBuffer(t.url)));
  }

  /**
   * Initiates the full 5-track ritual
   */
  public async startSortingRitual(basePath: string = 'assets'): Promise<void> {
    if (this.isPlaying) {
      console.warn('Ritual já em andamento.');
      return;
    }

    this.isPlaying = true;
    this.currentTrackIndex = -1;
    this.currentSequence = generateSortingSequence(basePath);

    // Request wake lock so the mobile display stays lit
    await screenWakeLock.request();

    // Haptic feedback start
    if ('vibrate' in navigator) {
      try { navigator.vibrate([40, 60, 40]); } catch (_) {}
    }

    if (this.callbacks.onSequenceStart) {
      this.callbacks.onSequenceStart(this.currentSequence);
    }

    try {
      if (this.mode === 'webaudio') {
        await this.playWithWebAudio(this.currentSequence);
      } else {
        await this.playWithDualPlayer(this.currentSequence);
      }
    } catch (err: any) {
      console.error('Erro na reprodução do Chapéu Seletor:', err);
      if (this.callbacks.onError) {
        this.callbacks.onError(err, this.getCurrentTrack() || undefined);
      }
      this.stop();
    }
  }

  /**
   * Implementation 1: Web Audio API (Zero Latency Gapless Queue)
   * Decodes buffers ahead of time and connects PCM buffers immediately
   */
  private async playWithWebAudio(tracks: SortingTrack[]): Promise<void> {
    const ctx = this.ensureAudioContext();

    // Begin loading all 5 buffers in parallel
    const bufferPromises = tracks.map(t => this.loadAudioBuffer(t.url));

    // Wait for the first track to be ready to start immediately
    const firstBuffer = await bufferPromises[0];
    if (!this.isPlaying) return;

    let currentIndex = 0;
    let nextBufferToPlay: AudioBuffer = firstBuffer;

    const playNext = async () => {
      if (!this.isPlaying || currentIndex >= tracks.length) {
        this.finishSequence();
        return;
      }

      const track = tracks[currentIndex];
      this.currentTrackIndex = currentIndex;

      if (this.callbacks.onTrackStart) {
        this.callbacks.onTrackStart(track, currentIndex, tracks.length);
      }

      // Haptic pulse on step transition
      if ('vibrate' in navigator) {
        try {
          if (track.category === 'escolha') {
            navigator.vibrate([100, 50, 150, 50, 200]);
          } else {
            navigator.vibrate(35);
          }
        } catch (_) {}
      }

      const sourceNode = ctx.createBufferSource();
      sourceNode.buffer = nextBufferToPlay;
      sourceNode.connect(this.gainNode!);
      this.currentSourceNode = sourceNode;

      // Start playing immediately
      sourceNode.start(0);

      // Pre-resolve the NEXT buffer while the current is playing
      const nextIndex = currentIndex + 1;
      let preparedNextPromise: Promise<AudioBuffer> | null = null;
      if (nextIndex < tracks.length) {
        preparedNextPromise = bufferPromises[nextIndex];
      }

      sourceNode.onended = async () => {
        if (!this.isPlaying) return;
        
        if (this.callbacks.onTrackEnd) {
          this.callbacks.onTrackEnd(track, currentIndex);
        }

        if (nextIndex < tracks.length) {
          try {
            nextBufferToPlay = await preparedNextPromise!;
            currentIndex = nextIndex;
            playNext();
          } catch (err: any) {
            this.callbacks.onError?.(err, tracks[nextIndex]);
            this.stop();
          }
        } else {
          this.finishSequence();
        }
      };
    };

    await playNext();
  }

  /**
   * Implementation 2: Dual Player Pipeline (Player A & Player B ping-pong)
   * As specified in section 4:
   * - Player A plays Track 1
   * - Track 2 is preloaded in Player B
   * - onended of Player A immediately triggers Player B, while Track 3 loads in Player A
   */
  private async playWithDualPlayer(tracks: SortingTrack[]): Promise<void> {
    if (!this.playerA) {
      this.playerA = new Audio();
      this.playerA.preload = 'auto';
    }
    if (!this.playerB) {
      this.playerB = new Audio();
      this.playerB.preload = 'auto';
    }

    this.playerA.volume = this.volume;
    this.playerB.volume = this.volume;

    this.activePlayer = 'A';

    const playStep = async (stepIndex: number) => {
      if (!this.isPlaying || stepIndex >= tracks.length) {
        this.finishSequence();
        return;
      }

      this.currentTrackIndex = stepIndex;
      const track = tracks[stepIndex];
      const currentPlayer = this.activePlayer === 'A' ? this.playerA! : this.playerB!;
      const idlePlayer = this.activePlayer === 'A' ? this.playerB! : this.playerA!;

      if (this.callbacks.onTrackStart) {
        this.callbacks.onTrackStart(track, stepIndex, tracks.length);
      }

      // Haptic
      if ('vibrate' in navigator) {
        try {
          if (track.category === 'escolha') {
            navigator.vibrate([100, 50, 150, 50, 200]);
          } else {
            navigator.vibrate(35);
          }
        } catch (_) {}
      }

      // If current player doesn't already have this track loaded, set src
      if (currentPlayer.src !== new URL(track.url, window.location.href).href) {
        currentPlayer.src = track.url;
        currentPlayer.load();
      }

      // Preload next track in idle player
      const nextIndex = stepIndex + 1;
      if (nextIndex < tracks.length) {
        idlePlayer.src = tracks[nextIndex].url;
        idlePlayer.load();
      }

      // Setup completion handler for zero gap switch
      const onEnded = () => {
        currentPlayer.removeEventListener('ended', onEnded);
        if (!this.isPlaying) return;

        if (this.callbacks.onTrackEnd) {
          this.callbacks.onTrackEnd(track, stepIndex);
        }

        // Toggle player and continue
        this.activePlayer = this.activePlayer === 'A' ? 'B' : 'A';
        playStep(stepIndex + 1);
      };

      currentPlayer.addEventListener('ended', onEnded, { once: true });
      await currentPlayer.play();
    };

    await playStep(0);
  }

  /**
   * Finalizes the sequence and returns UI to ready state
   */
  private finishSequence(): void {
    if (!this.isPlaying) return;

    this.isPlaying = false;
    this.currentTrackIndex = -1;
    this.cleanupSources();
    screenWakeLock.release();

    if (this.callbacks.onSequenceEnd) {
      this.callbacks.onSequenceEnd();
    }
  }

  /**
   * Force stop and reset
   */
  public stop(): void {
    this.isPlaying = false;
    this.currentTrackIndex = -1;
    this.cleanupSources();
    screenWakeLock.release();

    if (this.scheduledTimeoutId) {
      window.clearTimeout(this.scheduledTimeoutId);
      this.scheduledTimeoutId = null;
    }

    if (this.callbacks.onSequenceEnd) {
      this.callbacks.onSequenceEnd();
    }
  }

  private cleanupSources(): void {
    if (this.currentSourceNode) {
      try {
        this.currentSourceNode.stop();
        this.currentSourceNode.disconnect();
      } catch (_) {}
      this.currentSourceNode = null;
    }
    if (this.nextSourceNode) {
      try {
        this.nextSourceNode.stop();
        this.nextSourceNode.disconnect();
      } catch (_) {}
      this.nextSourceNode = null;
    }

    if (this.playerA) {
      this.playerA.pause();
      this.playerA.currentTime = 0;
    }
    if (this.playerB) {
      this.playerB.pause();
      this.playerB.currentTime = 0;
    }
  }
}
