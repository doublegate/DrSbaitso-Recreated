/**
 * useVoiceControl Hook
 *
 * Advanced voice control system with wake word detection and command recognition.
 * Enables hands-free operation with natural language commands.
 *
 * @version 1.6.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useVoiceRecognition } from './useVoiceRecognition';
import {
  VoiceCommand,
  createVoiceCommands,
  detectWakeWord,
  extractCommandFromTranscript,
  matchCommand,
  CommandMatch,
  getCommandSuggestions,
  formatCommandHelp,
} from '../utils/voiceCommands';

export interface VoiceControlOptions {
  enabled?: boolean;
  wakeWordEnabled?: boolean;
  handsFreeModeEnabled?: boolean;
  confirmDestructiveCommands?: boolean;
  commandThreshold?: number; // Confidence threshold for command matching (0-1)
  onCommandExecuted?: (command: VoiceCommand, match: CommandMatch) => void;
  onWakeWordDetected?: () => void;
  onError?: (error: string) => void;
  // Command handlers
  onClear?: () => void;
  onExport?: () => void;
  onSwitchCharacter?: (characterId: string) => void;
  onToggleMute?: () => void;
  onToggleSettings?: () => void;
  onToggleStats?: () => void;
  onStopAudio?: () => void;
  onCycleTheme?: () => void;
  onCycleAudioQuality?: () => void;
  onOpenAccessibility?: () => void;
  onOpenSearch?: () => void;
  onOpenVisualizer?: () => void;
  onHelp?: () => void;
}

export interface VoiceControlState {
  isEnabled: boolean;
  isListeningForWakeWord: boolean;
  isListeningForCommand: boolean;
  isHandsFreeMode: boolean;
  lastCommand: VoiceCommand | null;
  lastMatch: CommandMatch | null;
  pendingConfirmation: VoiceCommand | null;
  suggestions: VoiceCommand[];
  commands: VoiceCommand[];
  error: string | null;
}

/**
 * Voice control hook with wake word detection and command execution
 */
export function useVoiceControl(options: VoiceControlOptions = {}) {
  const {
    enabled = true,
    wakeWordEnabled = true,
    handsFreeModeEnabled = false,
    confirmDestructiveCommands = true,
    commandThreshold = 0.7,
    onCommandExecuted,
    onWakeWordDetected,
    onError,
    ...handlers
  } = options;

  const [state, setState] = useState<VoiceControlState>({
    isEnabled: enabled,
    isListeningForWakeWord: false,
    isListeningForCommand: false,
    isHandsFreeMode: handsFreeModeEnabled,
    lastCommand: null,
    lastMatch: null,
    pendingConfirmation: null,
    suggestions: [],
    commands: [],
    error: null,
  });

  const wakeWordRecognition = useVoiceRecognition({
    continuous: true,
    interimResults: false,
    onResult: handleWakeWordResult,
    onError: handleWakeWordError,
  });

  const commandRecognition = useVoiceRecognition({
    continuous: false,
    interimResults: true,
    onResult: handleCommandResult,
    onError: handleCommandError,
  });

  const commandsRef = useRef<VoiceCommand[]>([]);
  const confirmationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize commands
  useEffect(() => {
    const commands = createVoiceCommands(handlers);
    commandsRef.current = commands;
    setState(prev => ({ ...prev, commands }));
  }, [handlers]);

  // Handle wake word detection result
  function handleWakeWordResult(transcript: string, isFinal: boolean) {
    if (!isFinal) return;

    const wakeWordDetected = detectWakeWord(transcript);

    if (wakeWordDetected) {
      console.log('[VoiceControl] Wake word detected:', transcript);

      // Stop wake word listening
      wakeWordRecognition.stopListening();
      setState(prev => ({ ...prev, isListeningForWakeWord: false }));

      // Notify callback
      onWakeWordDetected?.();

      // Extract and process command immediately if present
      const command = extractCommandFromTranscript(transcript);
      if (command && command.trim().length > 0) {
        processCommand(command);
      } else {
        // Start listening for command
        startListeningForCommand();
      }
    }
  }

  // Handle command recognition result
  function handleCommandResult(transcript: string, isFinal: boolean) {
    console.log('[VoiceControl] Command transcript:', transcript, 'isFinal:', isFinal);

    if (isFinal) {
      processCommand(transcript);
    } else {
      // Show suggestions for interim results
      const suggestions = getCommandSuggestions(transcript, commandsRef.current, 3);
      setState(prev => ({ ...prev, suggestions }));
    }
  }

  // Process voice command
  function processCommand(transcript: string) {
    const match = matchCommand(transcript, commandsRef.current, commandThreshold);

    if (!match) {
      const error = 'Command not recognized. Say "help" for available commands.';
      setState(prev => ({ ...prev, error, suggestions: [] }));
      onError?.(error);

      // Restart wake word listening in hands-free mode
      if (state.isHandsFreeMode) {
        setTimeout(() => startWakeWordListening(), 1000);
      }

      return;
    }

    console.log('[VoiceControl] Command matched:', match.command.name, 'confidence:', match.confidence);

    setState(prev => ({
      ...prev,
      lastCommand: match.command,
      lastMatch: match,
      suggestions: [],
      error: null,
    }));

    // Check if confirmation required
    if (confirmDestructiveCommands && match.command.requiresConfirmation) {
      setState(prev => ({ ...prev, pendingConfirmation: match.command }));

      // Auto-cancel confirmation after 10 seconds
      confirmationTimeoutRef.current = setTimeout(() => {
        cancelConfirmation();
      }, 10000);

      return;
    }

    // Execute command
    executeCommand(match.command);

    // Notify callback
    onCommandExecuted?.(match.command, match);

    // Restart wake word listening in hands-free mode
    if (state.isHandsFreeMode) {
      setTimeout(() => startWakeWordListening(), 500);
    }
  }

  // Execute command action
  function executeCommand(command: VoiceCommand) {
    try {
      command.action();
      console.log('[VoiceControl] Command executed:', command.name);
    } catch (error) {
      console.error('[VoiceControl] Command execution error:', error);
      const errorMsg = `Failed to execute command: ${command.name}`;
      setState(prev => ({ ...prev, error: errorMsg }));
      onError?.(errorMsg);
    }
  }

  // Handle wake word error
  function handleWakeWordError(error: string) {
    console.error('[VoiceControl] Wake word error:', error);
    setState(prev => ({ ...prev, error }));
    onError?.(error);
  }

  // Handle command error
  function handleCommandError(error: string) {
    console.error('[VoiceControl] Command error:', error);
    setState(prev => ({ ...prev, error }));
    onError?.(error);

    // Restart wake word listening in hands-free mode
    if (state.isHandsFreeMode) {
      setTimeout(() => startWakeWordListening(), 1000);
    }
  }

  // Start listening for wake word
  const startWakeWordListening = useCallback(() => {
    if (!state.isEnabled || !wakeWordEnabled) {
      return;
    }

    if (state.isListeningForCommand) {
      commandRecognition.stopListening();
      setState(prev => ({ ...prev, isListeningForCommand: false }));
    }

    setState(prev => ({ ...prev, isListeningForWakeWord: true, error: null }));
    wakeWordRecognition.startListening();
    console.log('[VoiceControl] Started listening for wake word');
  }, [state.isEnabled, wakeWordEnabled, state.isListeningForCommand]);

  // Stop listening for wake word
  const stopWakeWordListening = useCallback(() => {
    wakeWordRecognition.stopListening();
    setState(prev => ({ ...prev, isListeningForWakeWord: false }));
    console.log('[VoiceControl] Stopped listening for wake word');
  }, []);

  // Start listening for command
  const startListeningForCommand = useCallback(() => {
    if (!state.isEnabled) {
      return;
    }

    if (state.isListeningForWakeWord) {
      wakeWordRecognition.stopListening();
      setState(prev => ({ ...prev, isListeningForWakeWord: false }));
    }

    setState(prev => ({ ...prev, isListeningForCommand: true, error: null }));
    commandRecognition.startListening();
    console.log('[VoiceControl] Started listening for command');
  }, [state.isEnabled, state.isListeningForWakeWord]);

  // Stop listening for command
  const stopListeningForCommand = useCallback(() => {
    commandRecognition.stopListening();
    setState(prev => ({ ...prev, isListeningForCommand: false }));
    console.log('[VoiceControl] Stopped listening for command');
  }, []);

  // Enable voice control
  const enable = useCallback(() => {
    setState(prev => ({ ...prev, isEnabled: true }));
  }, []);

  // Disable voice control
  const disable = useCallback(() => {
    stopWakeWordListening();
    stopListeningForCommand();
    setState(prev => ({ ...prev, isEnabled: false }));
  }, [stopWakeWordListening, stopListeningForCommand]);

  // Toggle voice control
  const toggle = useCallback(() => {
    if (state.isEnabled) {
      disable();
    } else {
      enable();
    }
  }, [state.isEnabled, enable, disable]);

  // Enable hands-free mode
  const enableHandsFreeMode = useCallback(() => {
    setState(prev => ({ ...prev, isHandsFreeMode: true }));
    startWakeWordListening();
  }, [startWakeWordListening]);

  // Disable hands-free mode
  const disableHandsFreeMode = useCallback(() => {
    setState(prev => ({ ...prev, isHandsFreeMode: false }));
    stopWakeWordListening();
    stopListeningForCommand();
  }, [stopWakeWordListening, stopListeningForCommand]);

  // Toggle hands-free mode
  const toggleHandsFreeMode = useCallback(() => {
    if (state.isHandsFreeMode) {
      disableHandsFreeMode();
    } else {
      enableHandsFreeMode();
    }
  }, [state.isHandsFreeMode, enableHandsFreeMode, disableHandsFreeMode]);

  // Confirm pending command
  const confirmCommand = useCallback(() => {
    if (!state.pendingConfirmation) {
      return;
    }

    if (confirmationTimeoutRef.current) {
      clearTimeout(confirmationTimeoutRef.current);
      confirmationTimeoutRef.current = null;
    }

    const command = state.pendingConfirmation;
    setState(prev => ({ ...prev, pendingConfirmation: null }));
    executeCommand(command);

    // Restart wake word listening in hands-free mode
    if (state.isHandsFreeMode) {
      setTimeout(() => startWakeWordListening(), 500);
    }
  }, [state.pendingConfirmation, state.isHandsFreeMode, startWakeWordListening]);

  // Cancel pending command confirmation
  const cancelConfirmation = useCallback(() => {
    if (confirmationTimeoutRef.current) {
      clearTimeout(confirmationTimeoutRef.current);
      confirmationTimeoutRef.current = null;
    }

    setState(prev => ({ ...prev, pendingConfirmation: null }));

    // Restart wake word listening in hands-free mode
    if (state.isHandsFreeMode) {
      setTimeout(() => startWakeWordListening(), 500);
    }
  }, [state.isHandsFreeMode, startWakeWordListening]);

  // Show help
  const showHelp = useCallback(() => {
    const helpText = formatCommandHelp(commandsRef.current);
    console.log('[VoiceControl] Help:', helpText);
    return helpText;
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      wakeWordRecognition.stopListening();
      commandRecognition.stopListening();
      if (confirmationTimeoutRef.current) {
        clearTimeout(confirmationTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    isSupported: wakeWordRecognition.isSupported,
    startWakeWordListening,
    stopWakeWordListening,
    startListeningForCommand,
    stopListeningForCommand,
    enable,
    disable,
    toggle,
    enableHandsFreeMode,
    disableHandsFreeMode,
    toggleHandsFreeMode,
    confirmCommand,
    cancelConfirmation,
    showHelp,
    clearError,
  };
}
