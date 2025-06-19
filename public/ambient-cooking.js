// Ambient Cooking Sounds Generator
class CookingAmbience {
  constructor() {
    this.audioContext = null;
    this.oscillators = [];
    this.isPlaying = false;
  }

  async init() {
    try {
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      return true;
    } catch (error) {
      console.log("Web Audio API not supported");
      return false;
    }
  }

  createGentleOscillator(frequency, volume, filterFreq = 800) {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    // Create warm, muted tones
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(
      frequency,
      this.audioContext.currentTime
    );

    // Low-pass filter for warm, muffled sound (like kitchen ambience)
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(filterFreq, this.audioContext.currentTime);
    filter.Q.setValueAtTime(0.5, this.audioContext.currentTime);

    // Very quiet volume
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(
      volume,
      this.audioContext.currentTime + 3
    );

    // Connect nodes
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    return { oscillator, gainNode, filter };
  }

  start() {
    if (!this.audioContext || this.isPlaying) return;

    // Create layered ambient kitchen sounds
    const sounds = [
      this.createGentleOscillator(110, 0.02, 400), // Deep oven hum
      this.createGentleOscillator(220, 0.015, 600), // Warm background
      this.createGentleOscillator(330, 0.01, 800), // Gentle sizzle undertone
    ];

    // Start all oscillators
    sounds.forEach(({ oscillator }) => {
      oscillator.start();
      this.oscillators.push(oscillator);
    });

    this.isPlaying = true;
  }

  stop() {
    this.oscillators.forEach((oscillator) => {
      try {
        oscillator.stop();
      } catch (e) {
        // Oscillator might already be stopped
      }
    });
    this.oscillators = [];
    this.isPlaying = false;
  }

  toggle() {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.start();
    }
    return this.isPlaying;
  }
}

// Make it available globally
window.CookingAmbience = CookingAmbience;
