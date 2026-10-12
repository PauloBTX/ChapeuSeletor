import confetti from 'canvas-confetti';
import { GaplessAudioEngine } from './audio/gapless-engine';
import type { SortingTrack } from './audio/types';
import audioManifest from './audio/manifest.json';
import { MagicParticleSystem } from './components/particles';
import { SortingHatComponent } from './components/sorting-hat';
import { AudioVisualizerController } from './components/visualizer';
import './style.css';

class SortingHatApp {
  private engine: GaplessAudioEngine;
  private particles: MagicParticleSystem | null = null;
  private hat: SortingHatComponent | null = null;
  private visualizer: AudioVisualizerController | null = null;

  private sortedCount = 0;
  private isRitualActive = false;

  constructor() {
    this.engine = new GaplessAudioEngine('webaudio');
    this.setupUI();
    this.setupAudioCallbacks();
    this.initComponents();
  }

  private setupUI() {
    const app = document.getElementById('app')!;
    app.innerHTML = `
      <canvas id="magic-particles-canvas"></canvas>
      <div class="vignette-overlay"></div>

      <main class="ceremony-container">
        <!-- Top Bar -->
        <header class="top-bar">
          <div class="ceremony-badge">
            <span class="badge-icon">⚡</span>
            <span>Crianças Selecionadas: <span class="counter-value" id="sorted-counter">0</span></span>
          </div>

          <div class="header-actions">
            <button id="btn-settings" class="icon-btn" title="Configurações e Diagnóstico" aria-label="Configurações">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </button>
          </div>
        </header>

        <!-- Stage Area -->
        <section class="stage-area">
          <div class="title-group">
            <h1 class="app-main-title">O Chapéu Seletor</h1>
            <p class="app-sub-title">Cerimônia de Seleção de Hogwarts</p>
          </div>

          <!-- Animated Sorting Hat Artwork -->
          <div class="hat-container" id="hat-stage"></div>

          <!-- Status Card / Step Indicator -->
          <div class="ritual-status-card" id="status-card">
            <div class="ritual-step-tag" id="status-tag">Aguardando Início</div>
            <div class="ritual-message" id="status-message">Aproxime-se e coloque o Chapéu Seletor na cabeça...</div>
            <div class="progress-dots" id="progress-dots">
              <div class="step-dot" data-index="0" title="1. Abertura"></div>
              <div class="step-dot" data-index="1" title="2. Adjetivo 1"></div>
              <div class="step-dot" data-index="2" title="3. Adjetivo 2"></div>
              <div class="step-dot" data-index="3" title="4. Transição"></div>
              <div class="step-dot" data-index="4" title="5. Escolha da Casa"></div>
            </div>
          </div>
        </section>

        <!-- Central Action Zone: 1 Single Big Prominent Button -->
        <section class="action-zone">
          <button id="main-sorting-btn" class="main-sorting-button state-available" aria-label="Colocar o Chapéu e sortear">
            <div class="btn-aura-glow"></div>
            <div class="btn-gold-border"></div>
            <div class="btn-content-box" id="btn-content">
              <span class="btn-primary-label">
                <span>⚡</span>
                <span id="btn-label-text">Colocar o Chapéu</span>
                <span>⚡</span>
              </span>
              <span class="btn-secondary-label" id="btn-subtext">Toque para iniciar o sorteio</span>
            </div>
          </button>
        </section>
      </main>

      <!-- Settings / Diagnostics Modal Drawer -->
      <div class="modal-overlay" id="settings-modal">
        <div class="modal-card">
          <div class="modal-header">
            <h2 class="modal-title">Configurações & Diagnóstico</h2>
            <button class="close-btn" id="btn-close-settings">&times;</button>
          </div>

          <div class="setting-row">
            <label class="setting-label">Motor de Áudio (Gapless Playback):</label>
            <div class="setting-control">
              <button class="engine-option-btn active" id="mode-webaudio" data-mode="webaudio">
                Web Audio API<br><small>(Latência Zero Recomendado)</small>
              </button>
              <button class="engine-option-btn" id="mode-dualplayer" data-mode="dualplayer">
                Dual HTML5 Player<br><small>(Pipeline Alternado)</small>
              </button>
            </div>
          </div>

          <div class="setting-row">
            <div class="setting-label">
              <span>Volume Principal</span>
              <span id="volume-val">100%</span>
            </div>
            <input type="range" id="volume-slider" class="volume-slider" min="0" max="100" value="100" />
          </div>

          <div class="setting-row">
            <label class="setting-label">Áudios Definitivos Carregados:</label>
            <div class="asset-diagnostics-box">
              <div class="diag-item">
                <span>1. Aberturas:</span>
                <span class="diag-status">${audioManifest.aberturas.length} arquivos reais ✓</span>
              </div>
              <div class="diag-item">
                <span>2. Adjetivos:</span>
                <span class="diag-status">${audioManifest.adjetivos.length} arquivos reais ✓</span>
              </div>
              <div class="diag-item">
                <span>3. Transição:</span>
                <span class="diag-status">${audioManifest.transicoes.length} arquivos reais ✓</span>
              </div>
              <div class="diag-item">
                <span>4. Escolha da Casa:</span>
                <span class="diag-status">${audioManifest.escolhas.length} arquivos reais ✓</span>
              </div>
              <div class="diag-item">
                <span>5. Efeitos Sonoros:</span>
                <span class="diag-status">${audioManifest.efeitos.length} arquivos WAV ✓</span>
              </div>
            </div>
          </div>

          <button id="btn-cancel-ceremony" class="btn-secondary" style="margin-top: 6px;">
            Interromper Cerimônia Atual
          </button>
        </div>
      </div>
    `;

    // Bind event listeners
    const mainBtn = document.getElementById('main-sorting-btn')!;
    mainBtn.addEventListener('click', () => this.handleButtonClick());

    // Settings Modal
    const settingsBtn = document.getElementById('btn-settings')!;
    const closeSettingsBtn = document.getElementById('btn-close-settings')!;
    const modal = document.getElementById('settings-modal')!;

    settingsBtn.addEventListener('click', () => modal.classList.add('open'));
    closeSettingsBtn.addEventListener('click', () => modal.classList.remove('open'));
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('open');
    });

    // Engine switch
    const btnWebAudio = document.getElementById('mode-webaudio')!;
    const btnDualPlayer = document.getElementById('mode-dualplayer')!;

    btnWebAudio.addEventListener('click', () => {
      this.engine.setMode('webaudio');
      btnWebAudio.classList.add('active');
      btnDualPlayer.classList.remove('active');
      this.updateVisualizerAnalyser();
    });

    btnDualPlayer.addEventListener('click', () => {
      this.engine.setMode('dualplayer');
      btnDualPlayer.classList.add('active');
      btnWebAudio.classList.remove('active');
      this.updateVisualizerAnalyser();
    });

    // Volume slider
    const volSlider = document.getElementById('volume-slider') as HTMLInputElement;
    const volVal = document.getElementById('volume-val')!;
    volSlider.addEventListener('input', () => {
      const val = parseInt(volSlider.value, 10);
      volVal.textContent = `${val}%`;
      this.engine.setVolume(val / 100);
    });

    // Stop button
    document.getElementById('btn-cancel-ceremony')?.addEventListener('click', () => {
      this.engine.stop();
      modal.classList.remove('open');
      this.resetButtonToAvailable();
    });
  }

  private initComponents() {
    // 1. Magic particles
    const canvas = document.getElementById('magic-particles-canvas') as HTMLCanvasElement;
    if (canvas) {
      this.particles = new MagicParticleSystem(canvas);
      this.particles.start();
    }

    // 2. Sorting Hat visual
    const hatContainer = document.getElementById('hat-stage')!;
    this.hat = new SortingHatComponent(hatContainer);

    // 3. Audio visualizer loop
    this.visualizer = new AudioVisualizerController(this.hat);
  }

  private updateVisualizerAnalyser() {
    if (this.visualizer) {
      this.visualizer.setAnalyser(this.engine.getAnalyser());
    }
  }

  private setupAudioCallbacks() {
    this.engine.setCallbacks({
      onSequenceStart: (_tracks) => {
        this.isRitualActive = true;
        this.setButtonToPlaying();
        this.updateVisualizerAnalyser();
        this.visualizer?.start();
        this.particles?.setIntensity(2.4);
        document.body.classList.add('is-playing');
      },

      onTrackStart: (track: SortingTrack, index: number, total: number) => {
        this.updateStepUI(track, index, total);
      },

      onTrackEnd: (_track: SortingTrack, index: number) => {
        this.markDotCompleted(index);
      },

      onSequenceEnd: () => {
        this.onRitualComplete();
      },

      onError: (err, track) => {
        console.error('Erro na cerimônia:', err);
        const statusMsg = document.getElementById('status-message')!;
        statusMsg.textContent = `Aviso: Falha ao reproduzir ${track?.filename || 'áudio'}. Verifique os arquivos na pasta public/assets.`;
        this.resetButtonToAvailable();
      }
    });
  }

  private handleButtonClick() {
    if (this.isRitualActive || this.engine.getIsPlaying()) {
      return;
    }

    this.engine.startSortingRitual('assets');
  }

  /**
   * ESTADO 2: Botão Reproduzindo (Desativado visualmente com animação)
   */
  private setButtonToPlaying() {
    const btn = document.getElementById('main-sorting-button') || document.getElementById('main-sorting-btn')!;
    btn.className = 'main-sorting-button state-playing';
    btn.setAttribute('disabled', 'true');
    btn.setAttribute('aria-disabled', 'true');

    const btnContent = document.getElementById('btn-content')!;
    btnContent.innerHTML = `
      <span class="btn-primary-label">
        <span class="playing-spinner"></span>
        <span id="btn-label-text">Seleção em Curso...</span>
      </span>
      <div class="equalizer-bar-container">
        <div class="eq-bar"></div>
        <div class="eq-bar"></div>
        <div class="eq-bar"></div>
        <div class="eq-bar"></div>
        <div class="eq-bar"></div>
      </div>
    `;
  }

  /**
   * ESTADO 1: Botão Disponível (Pulsante e Interativo)
   */
  private resetButtonToAvailable() {
    this.isRitualActive = false;
    this.visualizer?.stop();
    this.particles?.setIntensity(1.0);
    document.body.classList.remove('is-playing');

    const btn = document.getElementById('main-sorting-button') || document.getElementById('main-sorting-btn')!;
    btn.className = 'main-sorting-button state-available';
    btn.removeAttribute('disabled');
    btn.removeAttribute('aria-disabled');

    const btnContent = document.getElementById('btn-content')!;
    btnContent.innerHTML = `
      <span class="btn-primary-label">
        <span>⚡</span>
        <span id="btn-label-text">Colocar o Chapéu</span>
        <span>⚡</span>
      </span>
      <span class="btn-secondary-label" id="btn-subtext">Toque para a próxima criança</span>
    `;

    // Clear dots
    const dots = document.querySelectorAll('.step-dot');
    dots.forEach(d => d.className = 'step-dot');

    const tag = document.getElementById('status-tag')!;
    const message = document.getElementById('status-message')!;
    tag.textContent = 'Pronto para a Próxima Criança';
    message.textContent = 'Aproxime-se e coloque o Chapéu Seletor na cabeça...';
  }

  private updateStepUI(track: SortingTrack, index: number, total: number) {
    const tag = document.getElementById('status-tag')!;
    const message = document.getElementById('status-message')!;

    // Highlight current dot
    const dots = document.querySelectorAll('.step-dot');
    dots.forEach((dot, i) => {
      if (i === index) {
        dot.className = 'step-dot active';
      } else if (i < index) {
        dot.className = 'step-dot completed';
      } else {
        dot.className = 'step-dot';
      }
    });

    tag.textContent = `Etapa ${index + 1} de ${total}: ${track.categoryLabel}`;

    switch (track.category) {
      case 'abertura':
        message.textContent = 'O Chapéu Seletor desperta e examina sua mente...';
        break;
      case 'adjetivo1':
        message.textContent = 'Observando os traços de sua bravura e engenho...';
        break;
      case 'adjetivo2':
        message.textContent = 'Pesando sua determinação e lealdade oculta...';
        break;
      case 'transicao':
        message.textContent = 'A deliberação se aprofunda! O destino está selado...';
        break;
      case 'escolha':
        if (track.house && track.house !== 'hogwarts') {
          message.textContent = `✨ ${track.houseName?.toUpperCase()}! ✨`;
          if (track.houseColor) {
            this.hat?.setHouseTheme(track.houseColor);
          }
        } else {
          message.textContent = '✨ A CASA FOI PROCLAMADA! ✨';
        }
        this.triggerCelebration(track.houseColor);
        break;
    }
  }

  private markDotCompleted(index: number) {
    const dots = document.querySelectorAll('.step-dot');
    if (dots[index]) {
      dots[index].className = 'step-dot completed';
    }
  }

  private triggerCelebration(specialColor?: string) {
    // Hogwarts colors: Gold, Crimson, Green, Blue
    const colors = specialColor 
      ? [specialColor, '#d4af37', '#ffffff'] 
      : ['#d4af37', '#ae0001', '#2a623d', '#222f5b', '#e0bb43'];

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.65 },
      colors
    });

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors
      });
    }, 350);
  }

  private onRitualComplete() {
    this.sortedCount++;
    const counterEl = document.getElementById('sorted-counter');
    if (counterEl) {
      counterEl.textContent = this.sortedCount.toString();
    }

    const tag = document.getElementById('status-tag')!;
    const message = document.getElementById('status-message')!;
    tag.textContent = 'Seleção Concluída!';
    message.textContent = 'Uma nova jornada mágica se inicia em Hogwarts!';

    // Automatic reset back to available state after a short celebration pause
    setTimeout(() => {
      this.resetButtonToAvailable();
    }, 1800);
  }
}

// Initialize on DOM load
window.addEventListener('DOMContentLoaded', () => {
  new SortingHatApp();
});
