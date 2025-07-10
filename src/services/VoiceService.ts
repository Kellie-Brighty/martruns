// Web Speech API type declarations
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult:
    | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any)
    | null;
  onerror:
    | ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any)
    | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new (): SpeechRecognition;
};

interface VoiceServiceConfig {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

interface VoiceRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

interface VoiceSynthesisOptions {
  voice?: SpeechSynthesisVoice;
  rate?: number;
  pitch?: number;
  volume?: number;
}

// Enhanced error interface with detailed information
export interface VoiceError {
  type:
    | "permission"
    | "network"
    | "browser"
    | "audio"
    | "service"
    | "security"
    | "unknown";
  code: string;
  message: string;
  suggestion: string;
  recoverable: boolean;
}

export class VoiceService {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis;
  private isListening = false;
  private isSupported = false;
  private config: VoiceServiceConfig;
  private onResultCallback?: (result: VoiceRecognitionResult) => void;
  private onErrorCallback?: (error: VoiceError) => void;
  private onStartCallback?: () => void;
  private onEndCallback?: () => void;
  private finalResultTimeout?: NodeJS.Timeout;

  constructor(config: VoiceServiceConfig = {}) {
    this.config = {
      language: "en-US",
      continuous: true,
      interimResults: true,
      maxAlternatives: 1,
      ...config,
    };

    this.synthesis = window.speechSynthesis;
    this.initializeSpeechRecognition();
  }

  private createError(
    type: VoiceError["type"],
    code: string,
    message: string,
    suggestion: string,
    recoverable: boolean = true
  ): VoiceError {
    return { type, code, message, suggestion, recoverable };
  }

  private initializeSpeechRecognition(): void {
    // Check for HTTPS requirement
    if (
      location.protocol !== "https:" &&
      location.hostname !== "localhost" &&
      location.hostname !== "127.0.0.1"
    ) {
      this.onErrorCallback?.(
        this.createError(
          "security",
          "HTTPS_REQUIRED",
          "Voice commands require HTTPS or localhost",
          "Please access the app via HTTPS or run it on localhost",
          false
        )
      );
      return;
    }

    // Check for browser support
    const SpeechRecognition =
      window.SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      this.onErrorCallback?.(
        this.createError(
          "browser",
          "NOT_SUPPORTED",
          "Speech recognition is not supported in this browser",
          "Please use Chrome, Safari, or Edge for voice commands",
          false
        )
      );
      this.isSupported = false;
      return;
    }

    this.isSupported = true;
    this.recognition = new SpeechRecognition();

    // Configure recognition
    this.recognition.continuous = this.config.continuous!;
    this.recognition.interimResults = this.config.interimResults!;
    this.recognition.lang = this.config.language!;
    this.recognition.maxAlternatives = this.config.maxAlternatives!;

    // Set up event listeners
    this.recognition.onstart = () => {
      this.isListening = true;
      this.onStartCallback?.();
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.onEndCallback?.();
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.results.length - 1];
      if (!result || !result[0]) return;

      const transcript = result[0].transcript.trim();
      const confidence = result[0].confidence;
      const isFinal = result.isFinal;

      // Always show interim results immediately for visual feedback
      if (!isFinal) {
        this.onResultCallback?.({
          transcript,
          confidence,
          isFinal: false,
        });
        return;
      }

      // For final results, add a small delay to capture complete thoughts
      if (this.finalResultTimeout) {
        clearTimeout(this.finalResultTimeout);
      }

      this.finalResultTimeout = setTimeout(() => {
        // Only process if transcript is substantial (more than just a few characters)
        if (transcript.length > 2) {
          this.onResultCallback?.({
            transcript,
            confidence,
            isFinal: true,
          });
        }
      }, 800); // 800ms delay to ensure complete sentence
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      let error: VoiceError;

      switch (event.error) {
        case "network":
          error = this.createError(
            "network",
            "NETWORK_ERROR",
            "Network connection failed",
            "Check your internet connection and try again",
            true
          );
          break;
        case "not-allowed":
          error = this.createError(
            "permission",
            "PERMISSION_DENIED",
            "Microphone access was denied",
            "Click the microphone icon in your browser's address bar and allow microphone access",
            true
          );
          break;
        case "no-speech":
          error = this.createError(
            "audio",
            "NO_SPEECH",
            "No speech was detected",
            "Make sure your microphone is working and speak clearly",
            true
          );
          break;
        case "audio-capture":
          error = this.createError(
            "audio",
            "AUDIO_CAPTURE_FAILED",
            "Could not capture audio from microphone",
            "Check that your microphone is connected and not being used by another app",
            true
          );
          break;
        case "service-not-allowed":
          error = this.createError(
            "service",
            "SERVICE_BLOCKED",
            "Speech recognition service is blocked",
            "Check your browser settings and ensure speech services are enabled",
            false
          );
          break;
        case "language-not-supported":
          error = this.createError(
            "service",
            "LANGUAGE_NOT_SUPPORTED",
            `Language "${this.config.language}" is not supported`,
            "Try switching to English (en-US) in your browser settings",
            true
          );
          break;
        case "aborted":
          error = this.createError(
            "service",
            "RECOGNITION_ABORTED",
            "Speech recognition was stopped",
            "This is usually normal. Try starting voice recognition again",
            true
          );
          break;
        default:
          error = this.createError(
            "unknown",
            event.error.toUpperCase(),
            `Speech recognition error: ${event.error}`,
            "Try refreshing the page or restarting your browser",
            true
          );
      }

      this.onErrorCallback?.(error);
    };
  }

  // Public API methods
  public isVoiceSupported(): boolean {
    return this.isSupported;
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  public async checkPermissions(): Promise<{
    granted: boolean;
    error?: VoiceError;
  }> {
    try {
      const result = await navigator.mediaDevices.getUserMedia({ audio: true });
      result.getTracks().forEach((track) => track.stop()); // Clean up
      return { granted: true };
    } catch (err: any) {
      let error: VoiceError;

      if (err.name === "NotAllowedError") {
        error = this.createError(
          "permission",
          "PERMISSION_DENIED",
          "Microphone permission was denied",
          "Allow microphone access in your browser settings and reload the page",
          true
        );
      } else if (err.name === "NotFoundError") {
        error = this.createError(
          "audio",
          "NO_MICROPHONE",
          "No microphone found",
          "Connect a microphone to your device and try again",
          true
        );
      } else if (err.name === "NotReadableError") {
        error = this.createError(
          "audio",
          "MICROPHONE_BUSY",
          "Microphone is being used by another application",
          "Close other apps that might be using your microphone",
          true
        );
      } else {
        error = this.createError(
          "unknown",
          "PERMISSION_CHECK_FAILED",
          "Failed to check microphone permissions",
          "Try refreshing the page or checking your browser settings",
          true
        );
      }

      return { granted: false, error };
    }
  }

  public startListening(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported || !this.recognition) {
        reject(
          this.createError(
            "browser",
            "NOT_SUPPORTED",
            "Speech recognition not supported",
            "Please use Chrome, Safari, or Edge for voice commands",
            false
          )
        );
        return;
      }

      if (this.isListening) {
        resolve();
        return;
      }

      try {
        this.recognition.start();
        resolve();
      } catch (error: any) {
        let voiceError: VoiceError;

        if (error.name === "InvalidStateError") {
          voiceError = this.createError(
            "service",
            "ALREADY_LISTENING",
            "Speech recognition is already active",
            "Stop current recognition before starting a new session",
            true
          );
        } else {
          voiceError = this.createError(
            "unknown",
            "START_FAILED",
            "Failed to start speech recognition",
            "Try refreshing the page or checking your microphone",
            true
          );
        }

        reject(voiceError);
      }
    });
  }

  public stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  public speak(
    text: string,
    options: VoiceSynthesisOptions = {}
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(
          this.createError(
            "browser",
            "SYNTHESIS_NOT_SUPPORTED",
            "Speech synthesis not supported",
            "Your browser doesn't support text-to-speech functionality",
            false
          )
        );
        return;
      }

      // Stop listening when we start speaking to avoid feedback
      if (this.isListening) {
        this.stopListening();
      }

      // Cancel any ongoing speech
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      // Configure utterance
      utterance.rate = options.rate || 1;
      utterance.pitch = options.pitch || 1;
      utterance.volume = options.volume || 1;

      if (options.voice) {
        utterance.voice = options.voice;
      }

      utterance.onend = () => {
        // Speech finished, can resume listening
        resolve();
      };

      utterance.onerror = (event) => {
        const error = this.createError(
          "service",
          "SYNTHESIS_ERROR",
          `Speech synthesis failed: ${event.error}`,
          "Try reducing the text length or check your audio settings",
          true
        );
        reject(error);
      };

      this.synthesis.speak(utterance);
    });
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.synthesis.getVoices();
  }

  public stopSpeaking(): void {
    this.synthesis.cancel();
  }

  // Event listeners (updated to use VoiceError)
  public onResult(callback: (result: VoiceRecognitionResult) => void): void {
    this.onResultCallback = callback;
  }

  public onError(callback: (error: VoiceError) => void): void {
    this.onErrorCallback = callback;
  }

  public onStart(callback: () => void): void {
    this.onStartCallback = callback;
  }

  public onEnd(callback: () => void): void {
    this.onEndCallback = callback;
  }

  public detectWakeWord(
    transcript: string,
    wakeWords: string[] = [
      "hey martRuns",
      "hey matrons",
      "hey mart runs",
      "hey mat runs",
      "hey martin's",
      "hey martins",
      "market assistant",
      "hey market",
      "martRuns",
      "matrons",
      "mart runs",
    ]
  ): boolean {
    const normalizedTranscript = transcript.toLowerCase().trim();
    return wakeWords.some((wakeWord) =>
      normalizedTranscript.includes(wakeWord.toLowerCase())
    );
  }

  public destroy(): void {
    this.stopListening();
    this.stopSpeaking();

    if (this.finalResultTimeout) {
      clearTimeout(this.finalResultTimeout);
      this.finalResultTimeout = undefined;
    }

    this.onResultCallback = undefined;
    this.onErrorCallback = undefined;
    this.onStartCallback = undefined;
    this.onEndCallback = undefined;

    if (this.recognition) {
      this.recognition = null;
    }
  }
}

// Singleton instance
let voiceServiceInstance: VoiceService | null = null;

export const getVoiceService = (config?: VoiceServiceConfig): VoiceService => {
  if (!voiceServiceInstance) {
    voiceServiceInstance = new VoiceService(config);
  }
  return voiceServiceInstance;
};

// Types for use in other components
export type {
  VoiceServiceConfig,
  VoiceRecognitionResult,
  VoiceSynthesisOptions,
};
