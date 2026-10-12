import { SortingHatComponent } from './sorting-hat';

/**
 * Audio Visualizer loop that hooks into the Web Audio AnalyserNode
 * and drives animations for the Hat and circular rune visualizers
 */
export class AudioVisualizerController {
  private analyser: AnalyserNode | null = null;
  private hat: SortingHatComponent;
  private animId: number | null = null;
  private dataArray: Uint8Array<ArrayBuffer> | null = null;
  private isRunning = false;

  constructor(hat: SortingHatComponent) {
    this.hat = hat;
  }

  public setAnalyser(analyser: AnalyserNode | null) {
    this.analyser = analyser;
    if (this.analyser) {
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
    }
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;

    const loop = () => {
      if (!this.isRunning) return;

      let energy = 0;
      if (this.analyser && this.dataArray) {
        this.analyser.getByteFrequencyData(this.dataArray);
        // Calculate average speech/voice frequency energy (voice is usually concentrated in lower-mid bins)
        let sum = 0;
        const count = Math.min(32, this.dataArray.length);
        for (let i = 0; i < count; i++) {
          sum += this.dataArray[i];
        }
        energy = sum / (count * 255);
      }

      this.hat.updateAudioEnergy(energy);
      this.animId = requestAnimationFrame(loop);
    };

    loop();
  }

  public stop() {
    this.isRunning = false;
    if (this.animId !== null) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    this.hat.resetAppearance();
  }
}
