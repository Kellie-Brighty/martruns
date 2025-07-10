import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Zap,
  AlertCircle,
  CheckCircle,
  Loader,
  X,
  MessageCircle,
  Sparkles,
  RefreshCw,
  Settings,
  Wifi,
  Shield,
  Globe,
} from "lucide-react";
import {
  getVoiceService,
  type VoiceRecognitionResult,
  type VoiceError,
} from "../services/VoiceService";
import {
  getCommandProcessor,
  type VoiceCommand,
  type CommandContext,
} from "../services/CommandProcessor";

interface VoiceInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  onCommand: (
    command: VoiceCommand
  ) => Promise<{ success: boolean; message: string }>;
  context: CommandContext;
  className?: string;
}

type VoiceState = "idle" | "listening" | "processing" | "speaking" | "error";

interface VoiceSession {
  transcript: string;
  interimTranscript: string;
  isListening: boolean;
  lastCommand?: VoiceCommand;
  suggestions: string[];
}

// Helper function to get error icon based on error type
const getErrorIcon = (errorType: VoiceError["type"]) => {
  switch (errorType) {
    case "permission":
      return Shield;
    case "network":
      return Wifi;
    case "browser":
      return Globe;
    case "audio":
      return Mic;
    case "security":
      return Shield;
    case "service":
      return Settings;
    default:
      return AlertCircle;
  }
};

// Helper function to get error color based on error type
// const getErrorColor = (errorType: VoiceError['type']) => {
//   switch (errorType) {
//     case 'permission':
//       return 'orange';
//     case 'network':
//       return 'blue';
//     case 'browser':
//       return 'purple';
//     case 'audio':
//       return 'red';
//     case 'security':
//       return 'yellow';
//     case 'service':
//       return 'indigo';
//     default:
//       return 'red';
//   }
// };

export const VoiceInterface: React.FC<VoiceInterfaceProps> = ({
  isOpen,
  onClose,
  onCommand,
  context,
  className = "",
}) => {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [session, setSession] = useState<VoiceSession>({
    transcript: "",
    interimTranscript: "",
    isListening: false,
    suggestions: [],
  });
  const [error, setError] = useState<VoiceError | null>(null);
  const [feedback, setFeedback] = useState<string>("");
  const [isMuted, setIsMuted] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const voiceService = useRef(getVoiceService());
  const commandProcessor = useRef(getCommandProcessor());
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize voice service with permission checking
  useEffect(() => {
    const initializeService = async () => {
      setIsInitializing(true);

      // Check browser support first
      if (!voiceService.current.isVoiceSupported()) {
        setError({
          type: "browser",
          code: "NOT_SUPPORTED",
          message: "Voice commands are not supported in this browser",
          suggestion: "Please use Chrome, Safari, or Edge for voice commands",
          recoverable: false,
        });
        setIsInitializing(false);
        return;
      }

      // Check microphone permissions
      const permissionCheck = await voiceService.current.checkPermissions();
      if (!permissionCheck.granted && permissionCheck.error) {
        setError(permissionCheck.error);
        setIsInitializing(false);
        return;
      }

      const service = voiceService.current;

      // Set up voice recognition callbacks
      service.onResult((result: VoiceRecognitionResult) => {
        setSession((prev) => ({
          ...prev,
          interimTranscript: result.isFinal ? "" : result.transcript,
          transcript: result.isFinal ? result.transcript : prev.transcript,
        }));

        if (result.isFinal && result.transcript.trim()) {
          processVoiceCommand(result.transcript);
        }
      });

      service.onStart(() => {
        setVoiceState("listening");
        setSession((prev) => ({ ...prev, isListening: true }));
        setError(null);
      });

      service.onEnd(() => {
        setVoiceState("idle");
        setSession((prev) => ({ ...prev, isListening: false }));
      });

      service.onError((voiceError: VoiceError) => {
        setError(voiceError);
        setVoiceState("error");
        setSession((prev) => ({ ...prev, isListening: false }));
      });

      setIsInitializing(false);
    };

    if (isOpen) {
      initializeService();
    }

    return () => {
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
      if (sessionTimeoutRef.current) clearTimeout(sessionTimeoutRef.current);
    };
  }, [isOpen]);

  // Process voice command
  const processVoiceCommand = useCallback(
    async (transcript: string) => {
      setVoiceState("processing");

      try {
        const command = commandProcessor.current.parseCommand(
          transcript,
          context
        );
        setSession((prev) => ({ ...prev, lastCommand: command }));

        if (command.intent === "unknown") {
          const errorMsg =
            "I didn't understand that command. Try again or ask for help.";
          setError({
            type: "service",
            code: "COMMAND_NOT_UNDERSTOOD",
            message: errorMsg,
            suggestion:
              "Try speaking more clearly or use one of the quick commands below",
            recoverable: true,
          });
          speak(errorMsg);
          setVoiceState("error");
          return;
        }

        const result = await onCommand(command);
        const responseMessage = commandProcessor.current.generateResponse(
          command,
          result,
          context
        );

        setFeedback(responseMessage);

        if (result.success) {
          speak(responseMessage);
          setVoiceState("speaking");
        } else {
          setError({
            type: "service",
            code: "COMMAND_FAILED",
            message: result.message,
            suggestion:
              "Try rephrasing your command or check if you have an active shopping list",
            recoverable: true,
          });
          setVoiceState("error");
        }

        // Auto-clear feedback after 5 seconds
        if (feedbackTimeoutRef.current)
          clearTimeout(feedbackTimeoutRef.current);
        feedbackTimeoutRef.current = setTimeout(() => {
          setFeedback("");
          setError(null);
        }, 5000);
      } catch (err) {
        setError({
          type: "service",
          code: "PROCESSING_FAILED",
          message: "Failed to process command",
          suggestion: "Try again or restart the voice assistant",
          recoverable: true,
        });
        setVoiceState("error");
      }
    },
    [context, onCommand]
  );

  // Toggle listening
  const toggleListening = useCallback(async () => {
    if (session.isListening) {
      voiceService.current.stopListening();
    } else {
      try {
        await voiceService.current.startListening();
        setError(null);
      } catch (voiceError) {
        if (
          voiceError &&
          typeof voiceError === "object" &&
          "type" in voiceError
        ) {
          setError(voiceError as VoiceError);
        } else {
          setError({
            type: "unknown",
            code: "START_FAILED",
            message: "Failed to start listening",
            suggestion: "Check your microphone permissions and try again",
            recoverable: true,
          });
        }
      }
    }
  }, [session.isListening]);

  // Speak response
  const speak = useCallback(
    async (text: string) => {
      if (isMuted) return;

      try {
        setVoiceState("speaking");
        await voiceService.current.speak(text, { rate: 0.9, pitch: 1 });

        // After speaking is complete, resume listening if interface is still open
        if (isOpen && !error) {
          setVoiceState("idle");
          // Small delay before resuming listening to avoid immediately picking up any audio artifacts
          setTimeout(() => {
            if (!session.isListening && isOpen && !error) {
              toggleListening();
            }
          }, 500);
        } else {
          setVoiceState("idle");
        }
      } catch (err) {
        console.warn("Speech synthesis failed:", err);
        setVoiceState("idle");
        // Still try to resume listening even if speech failed
        if (isOpen && !error && !session.isListening) {
          setTimeout(() => toggleListening(), 500);
        }
      }
    },
    [isMuted, isOpen, error, session.isListening, toggleListening]
  );

  // Retry function for recoverable errors
  const retryAction = useCallback(async () => {
    setError(null);
    setVoiceState("idle");

    // If it was a permission error, check permissions again
    if (error?.type === "permission") {
      const permissionCheck = await voiceService.current.checkPermissions();
      if (!permissionCheck.granted && permissionCheck.error) {
        setError(permissionCheck.error);
        return;
      }
    }

    // Try to start listening again
    await toggleListening();
  }, [error, toggleListening]);

  // Quick command handlers
  const handleQuickCommand = useCallback(
    async (commandText: string) => {
      setError(null);
      await processVoiceCommand(commandText);
    },
    [processVoiceCommand]
  );

  // Wake word detection
  useEffect(() => {
    if (session.transcript.trim()) {
      const hasWakeWord = voiceService.current.detectWakeWord(
        session.transcript
      );
      if (hasWakeWord && !session.isListening) {
        toggleListening();
      }
    }
  }, [session.transcript]);

  // Auto-restart listening after idle
  useEffect(() => {
    if (voiceState === "idle" && isOpen && !error) {
      if (sessionTimeoutRef.current) clearTimeout(sessionTimeoutRef.current);
      sessionTimeoutRef.current = setTimeout(() => {
        if (!session.isListening) {
          toggleListening();
        }
      }, 5000); // Increased from 3000 to 5000ms for longer pause
    }
  }, [voiceState, isOpen, error]);

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 ${className}`}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Voice Interface Panel */}
      <div className="absolute bottom-0 left-0 right-0 max-w-lg mx-auto">
        <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-600/50 rounded-t-2xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
            <div className="flex items-center space-x-3">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  voiceState === "listening"
                    ? "bg-emerald-500/20 animate-pulse"
                    : voiceState === "processing"
                    ? "bg-orange-500/20"
                    : voiceState === "speaking"
                    ? "bg-blue-500/20"
                    : voiceState === "error"
                    ? "bg-red-500/20"
                    : "bg-slate-700/50"
                }`}
              >
                <Sparkles
                  className={`w-4 h-4 ${
                    voiceState === "listening"
                      ? "text-emerald-400"
                      : voiceState === "processing"
                      ? "text-orange-400"
                      : voiceState === "speaking"
                      ? "text-blue-400"
                      : voiceState === "error"
                      ? "text-red-400"
                      : "text-slate-400"
                  }`}
                />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">
                  Voice Assistant
                </h3>
                <p className="text-xs text-slate-400">
                  {isInitializing
                    ? "Initializing..."
                    : voiceState === "listening"
                    ? "Listening for commands"
                    : voiceState === "processing"
                    ? "Processing your request"
                    : voiceState === "speaking"
                    ? "Speaking response"
                    : voiceState === "error"
                    ? "Error occurred"
                    : "Ready for commands"}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-2 rounded-lg transition-colors ${
                  isMuted
                    ? "bg-red-500/20 text-red-400"
                    : "bg-slate-700/50 text-slate-300 hover:text-white"
                }`}
                title={isMuted ? "Unmute responses" : "Mute responses"}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-slate-700/50 text-slate-300 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-6 space-y-6">
            {/* Microphone Button */}
            {!isInitializing && !error && (
              <div className="text-center">
                <button
                  onClick={toggleListening}
                  disabled={
                    voiceState === "processing" || voiceState === "speaking"
                  }
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-50 ${
                    session.isListening
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/25 animate-pulse"
                      : "bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 shadow-lg"
                  }`}
                >
                  {voiceState === "processing" ? (
                    <Loader className="w-8 h-8 text-white animate-spin" />
                  ) : voiceState === "speaking" ? (
                    <Volume2 className="w-8 h-8 text-white animate-pulse" />
                  ) : session.isListening ? (
                    <Mic className="w-8 h-8 text-white" />
                  ) : (
                    <MicOff className="w-8 h-8 text-white" />
                  )}
                </button>
                <p className="mt-4 text-sm text-slate-400">
                  {session.isListening
                    ? "Listening..."
                    : "Tap to start voice commands"}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Try saying: "Hey MartRuns, add milk to my list"
                </p>
              </div>
            )}

            {/* Detailed Error Display */}
            {error && (
              <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10">
                <div className="flex items-start space-x-3">
                  {React.createElement(getErrorIcon(error.type), {
                    className: "w-5 h-5 text-red-400 flex-shrink-0 mt-0.5",
                  })}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-red-400 text-sm">
                        {error.message}
                      </h4>
                      <span className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded-full">
                        {error.type.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed mb-3">
                      {error.suggestion}
                    </p>
                    <div className="flex items-center space-x-3">
                      {error.recoverable && (
                        <button
                          onClick={retryAction}
                          className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Try Again</span>
                        </button>
                      )}
                      <span className="text-xs text-slate-500">
                        Code: {error.code}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Initialization Loading */}
            {isInitializing && (
              <div className="text-center py-6">
                <Loader className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-3" />
                <p className="text-slate-400 text-sm">
                  Setting up voice recognition...
                </p>
                <p className="text-slate-500 text-xs mt-1">
                  Checking microphone permissions
                </p>
              </div>
            )}

            {/* Live Transcript */}
            {(session.transcript || session.interimTranscript) && (
              <div className="bg-slate-800/30 rounded-xl p-4">
                <h4 className="text-sm font-medium text-slate-400 mb-2">
                  What you said:
                </h4>
                <p className="text-white text-sm">
                  {session.transcript}
                  {session.interimTranscript && (
                    <span className="text-slate-400 italic">
                      {" "}
                      {session.interimTranscript}
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Feedback */}
            {feedback && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-emerald-400 text-sm mb-1">
                      Success!
                    </h4>
                    <p className="text-slate-300 text-sm">{feedback}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Commands */}
            {!error && !isInitializing && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-slate-400">
                  Quick C ommands:
                </h4>
                <div className="space-y-2">
                  <button
                    onClick={() =>
                      handleQuickCommand("Create new shopping list")
                    }
                    className="w-full flex items-center space-x-3 p-3 rounded-xl bg-slate-800/30 border border-slate-700/50 text-left hover:bg-slate-700/30 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-400" />
                    <span className="text-white text-sm">
                      Create new shopping list
                    </span>
                  </button>
                  <button
                    onClick={() => handleQuickCommand("Add milk to my list")}
                    className="w-full flex items-center space-x-3 p-3 rounded-xl bg-slate-800/30 border border-slate-700/50 text-left hover:bg-slate-700/30 transition-colors"
                  >
                    <Zap className="w-4 h-4 text-orange-400" />
                    <span className="text-white text-sm">
                      Add [item] to my list
                    </span>
                  </button>
                  <button
                    onClick={() =>
                      handleQuickCommand("Mark bananas as complete")
                    }
                    className="w-full flex items-center space-x-3 p-3 rounded-xl bg-slate-800/30 border border-slate-700/50 text-left hover:bg-slate-700/30 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="text-white text-sm">
                      Mark [item] as complete
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
