/**
 * Interactive Sorting Hat Graphic Component with Audio-driven Facial Animation
 */
export class SortingHatComponent {
  private container: HTMLElement;
  private eyeLeft: SVGPathElement | null = null;
  private eyeRight: SVGPathElement | null = null;
  private hatGlow: SVGCircleElement | null = null;
  private hatWrapper: HTMLElement | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
  }

  private render() {
    this.container.innerHTML = `
      <div class="sorting-hat-wrapper" id="hat-wrapper">
        <div class="hat-magic-halo"></div>
        <svg class="sorting-hat-svg" viewBox="0 0 400 380" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="leather-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <radialGradient id="magicEyeGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#ffd56b" />
              <stop offset="50%" stop-color="#e8982c" />
              <stop offset="100%" stop-color="#693005" />
            </radialGradient>
            <linearGradient id="leatherShade" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#3d271d" />
              <stop offset="40%" stop-color="#2c1a13" />
              <stop offset="80%" stop-color="#1c100b" />
              <stop offset="100%" stop-color="#120906" />
            </linearGradient>
            <linearGradient id="foldHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#5a3b2c" />
              <stop offset="100%" stop-color="#1e110a" />
            </linearGradient>
          </defs>

          <!-- Ambient Aura behind hat -->
          <circle id="hat-aura" cx="200" cy="200" r="140" fill="url(#magicEyeGlow)" opacity="0.12" filter="url(#leather-glow)"/>

          <!-- Hat Brim (Wide undulating wizard base) -->
          <path class="hat-brim" d="M 30 320 C 70 290, 140 310, 200 315 C 260 320, 330 295, 370 325 C 330 355, 250 365, 200 365 C 140 365, 60 350, 30 320 Z" 
                fill="url(#leatherShade)" stroke="#4a3022" stroke-width="3" />

          <!-- Hat Brim Under-shadow -->
          <path d="M 60 325 C 130 338, 270 342, 340 328 C 300 350, 240 358, 200 358 C 150 358, 90 346, 60 325 Z" 
                fill="#0e0704" opacity="0.8" />

          <!-- Hat Main Cone & Folds -->
          <path class="hat-body" d="M 110 310 
                   C 105 260, 120 220, 135 180 
                   C 145 150, 155 120, 185 80 
                   C 200 60, 220 35, 235 30 
                   C 230 45, 215 70, 225 95 
                   C 235 120, 255 160, 260 200 
                   C 265 240, 285 275, 290 310 
                   Z" 
                fill="url(#leatherShade)" stroke="#42291d" stroke-width="3" />

          <!-- Cone Wrinkles & Character Folds -->
          <path d="M 155 130 C 180 145, 225 140, 240 125" stroke="#1a0f09" stroke-width="4" stroke-linecap="round" fill="none" />
          <path d="M 140 170 C 175 190, 230 185, 255 165" stroke="#1a0f09" stroke-width="5" stroke-linecap="round" fill="none" />
          <path d="M 145 174 C 180 193, 228 188, 250 170" stroke="#543728" stroke-width="1.5" stroke-linecap="round" fill="none" />

          <!-- Hat Patches & Stitches -->
          <path d="M 230 85 L 245 92 L 240 108 L 222 100 Z" fill="#25160e" stroke="#503322" stroke-width="1" />
          <line x1="225" y1="88" x2="231" y2="94" stroke="#855938" stroke-width="1.5" />
          <line x1="235" y1="94" x2="242" y2="100" stroke="#855938" stroke-width="1.5" />

          <!-- Eyebrow Folds (The leathery scowl) -->
          <path d="M 140 215 C 160 210, 185 220, 192 228" stroke="#120a06" stroke-width="6" stroke-linecap="round" fill="none" />
          <path d="M 260 215 C 240 210, 215 220, 208 228" stroke="#120a06" stroke-width="6" stroke-linecap="round" fill="none" />

          <!-- Magical Eyes (Crevices that glow with wizardry) -->
          <g id="hat-eyes">
            <path id="eye-left" class="hat-eye" d="M 150 226 C 162 222, 175 228, 180 234 C 170 234, 158 230, 150 226 Z" 
                  fill="url(#magicEyeGlow)" filter="url(#leather-glow)" opacity="0.6"/>
            <path id="eye-right" class="hat-eye" d="M 250 226 C 238 222, 225 228, 220 234 C 230 234, 242 230, 250 226 Z" 
                  fill="url(#magicEyeGlow)" filter="url(#leather-glow)" opacity="0.6"/>
          </g>

          <!-- Nose Fold -->
          <path d="M 195 235 C 190 250, 210 252, 205 260" stroke="#150a06" stroke-width="4" stroke-linecap="round" fill="none"/>

          <!-- Animated Mouth (Deep wide tear fold that opens when speaking!) -->
          <g id="hat-mouth-group">
            <!-- Mouth Inner Cavity -->
            <path id="hat-mouth-cavity" d="M 140 278 C 175 292, 225 292, 260 278 C 240 290, 160 290, 140 278 Z" 
                  fill="#080402" />
            <!-- Animated Lip / Tear Fold -->
            <path id="hat-mouth" class="hat-mouth-fold" 
                  d="M 135 276 C 170 295, 230 295, 265 276 C 240 286, 160 286, 135 276 Z" 
                  fill="#1a0f0a" stroke="#0d0603" stroke-width="3" stroke-linecap="round" />
            <path id="hat-mouth-highlight" d="M 140 277 C 175 294, 225 294, 260 277" 
                  stroke="#4f3323" stroke-width="1.5" fill="none" />
          </g>

          <!-- Tip of the Hat (bent thoughtfully to the right) -->
          <path d="M 235 30 C 255 20, 275 35, 280 45 C 275 50, 250 45, 225 40 Z" fill="#2d1c14" />
        </svg>

        <!-- Dynamic Audio Wave Rings (around hat when speaking) -->
        <div class="audio-pulse-ring ring-1"></div>
        <div class="audio-pulse-ring ring-2"></div>
      </div>
    `;

    this.hatWrapper = document.getElementById('hat-wrapper');
    this.eyeLeft = document.getElementById('eye-left') as unknown as SVGPathElement;
    this.eyeRight = document.getElementById('eye-right') as unknown as SVGPathElement;
    this.hatGlow = document.getElementById('hat-aura') as unknown as SVGCircleElement;
  }

  /**
   * Update hat expression based on real-time audio amplitude (0 to 1)
   */
  public updateAudioEnergy(energy: number) {
    if (!this.hatWrapper) return;

    // Scale mouth opening
    const mouthGroup = document.getElementById('hat-mouth-group');
    if (mouthGroup) {
      const openScale = 1 + energy * 1.8;
      const translateY = energy * 10;
      mouthGroup.style.transformOrigin = '200px 275px';
      mouthGroup.style.transform = `scaleY(${openScale}) translateY(${translateY}px)`;
    }

    // Glow eyes and halo with speaking volume
    if (this.eyeLeft && this.eyeRight) {
      const eyeOpacity = 0.4 + energy * 0.6;
      this.eyeLeft.setAttribute('opacity', eyeOpacity.toFixed(2));
      this.eyeRight.setAttribute('opacity', eyeOpacity.toFixed(2));
    }

    if (this.hatGlow) {
      const auraOpacity = 0.1 + energy * 0.4;
      this.hatGlow.setAttribute('opacity', auraOpacity.toFixed(2));
    }

    // Gentle wobble when shouting
    if (energy > 0.4) {
      const rot = (Math.random() - 0.5) * energy * 4;
      this.hatWrapper.style.transform = `rotate(${rot}deg) scale(${1 + energy * 0.05})`;
    } else {
      this.hatWrapper.style.transform = `rotate(0deg) scale(1)`;
    }
  }

  public setHouseTheme(houseColor: string) {
    if (this.hatGlow) {
      this.hatGlow.setAttribute('fill', houseColor);
      this.hatGlow.setAttribute('opacity', '0.45');
    }
  }

  public resetAppearance() {
    if (this.hatGlow) {
      this.hatGlow.setAttribute('fill', 'url(#magicEyeGlow)');
      this.hatGlow.setAttribute('opacity', '0.12');
    }
    if (this.eyeLeft && this.eyeRight) {
      this.eyeLeft.setAttribute('opacity', '0.5');
      this.eyeRight.setAttribute('opacity', '0.5');
    }
    const mouthGroup = document.getElementById('hat-mouth-group');
    if (mouthGroup) {
      mouthGroup.style.transform = 'scaleY(1) translateY(0px)';
    }
  }
}
