import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message } from './types';
import { getDrSbaitsoResponse, synthesizeSpeech } from './services/geminiService';
import { decode, decodeAudioData, playAudio } from './utils/audio';

export default function App() {
  const [userName, setUserName] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGreeting, setIsGreeting] = useState(false);
  const [greetingIndex, setGreetingIndex] = useState(0);
  const [greetingLines, setGreetingLines] = useState<string[]>([]);
  const [isPreparingGreeting, setIsPreparingGreeting] = useState(false);
  const [greetingAudio, setGreetingAudio] = useState<string[]>([]);
  const [nameError, setNameError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const playingGreetingIndexRef = useRef<number>(-1);

  const ensureAudioContext = () => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      } catch (e) {
        console.error("Could not create AudioContext:", e);
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, messages.length > 0 && messages[messages.length-1].text]);

  useEffect(() => {
    // When the name screen is visible and not loading, focus the name input.
    if (!userName && !isPreparingGreeting) {
      // Using a timeout helps ensure the focus command runs after the browser has
      // finished rendering, making it more reliable.
      setTimeout(() => nameInputRef.current?.focus(), 50);
    } 
    // When the chat is ready for user input, focus the chat input.
    else if (userName && !isLoading && !isGreeting) {
      inputRef.current?.focus();
    }
  }, [userName, isLoading, isGreeting, isPreparingGreeting]);
  
  const playAndProgress = useCallback(async (base64Audio: string, onFinished: () => void) => {
    if (audioContextRef.current && base64Audio) {
      try {
        const audioBytes = decode(base64Audio);
        const audioBuffer = await decodeAudioData(audioBytes, audioContextRef.current, 24000, 1);
        await playAudio(audioBuffer, audioContextRef.current);
      } catch (error) {
        console.error("Audio playback failed:", error);
      } finally {
        onFinished();
      }
    } else {
      setTimeout(onFinished, 100); 
    }
  }, []);

  const handleNameSubmit = async () => {
    ensureAudioContext();
    if (nameInput.trim() && !isPreparingGreeting) {
      setIsPreparingGreeting(true);
      setNameError(null); // Clear previous errors
      const name = nameInput.trim().toUpperCase();
      
      const lines = [
        `HELLO ${name}, MY NAME IS DOCTOR SBAITSO.`,
        "I AM HERE TO HELP YOU.",
        "SAY WHATEVER IS IN YOUR MIND FREELY,",
        "OUR CONVERSATION WILL BE KEPT IN STRICT CONFIDENCE.",
        "MEMORY CONTENTS WILL BE WIPED OFF AFTER YOU LEAVE.",
        "",
        "SO, TELL ME ABOUT YOUR PROBLEMS.",
      ];

      try {
        const audioData = await Promise.all(lines.map(line => synthesizeSpeech(line)));
        setGreetingAudio(audioData);
        setGreetingLines(lines);
        setUserName(name);
        setIsGreeting(true);
      } catch (error) {
        console.error("Failed to prepare greeting audio:", error);
        setNameError("SYSTEM ERROR: FAILED TO INITIALIZE. PLEASE REFRESH.");
      } finally {
        setIsPreparingGreeting(false);
      }
    }
  };
  
  useEffect(() => {
    if (isGreeting && greetingIndex < greetingLines.length && playingGreetingIndexRef.current !== greetingIndex) {
      playingGreetingIndexRef.current = greetingIndex; // Prevents double-playback in StrictMode
      const line = greetingLines[greetingIndex];
      const audio = greetingAudio[greetingIndex];
      
      setMessages(prev => [...prev, { author: 'dr', text: line }]);
      
      playAndProgress(audio, () => {
        setGreetingIndex(prev => prev + 1);
      });
    } else if (isGreeting && greetingIndex >= greetingLines.length) {
      setIsGreeting(false);
      setIsLoading(false);
    }
  }, [isGreeting, greetingIndex, greetingLines, greetingAudio, playAndProgress]);

  const handleUserInput = async () => {
    ensureAudioContext();
    const trimmedInput = userInput.trim();

    if (!trimmedInput || isLoading) {
      return;
    }
    
    const userMessage: Message = { author: 'user', text: trimmedInput };
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      const drResponseText = await getDrSbaitsoResponse(trimmedInput);
      const audioPromise = synthesizeSpeech(drResponseText);
      setMessages(prev => [...prev, { author: 'dr', text: '' }]);

      const typingSpeed = 40;
      for (let i = 0; i < drResponseText.length; i++) {
          await new Promise(resolve => setTimeout(resolve, typingSpeed));
          setMessages(prev => {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1].text += drResponseText[i];
              return newMessages;
          });
      }

      const base64Audio = await audioPromise;
      if (audioContextRef.current && base64Audio) {
          const audioBytes = decode(base64Audio);
          const audioBuffer = await decodeAudioData(audioBytes, audioContextRef.current, 24000, 1);
          await playAudio(audioBuffer, audioContextRef.current);
      }
    } catch (error) {
      console.error("An error occurred during response generation:", error);
      const errorMessages = [
          'UNEXPECTED DATA STREAM CORRUPTION. PLEASE REBOOT.',
          'INTERNAL PROCESSOR FAULT. PLEASE TRY AGAIN.',
          'MEMORY ADDRESS CONFLICT. PLEASE RESTATE YOUR PROBLEM.',
          'IRQ CONFLICT AT ADDRESS 220H. SESSION TERMINATED.'
      ];
      const randomError = errorMessages[Math.floor(Math.random() * errorMessages.length)];
      
      setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          // If the last message was the empty one for the typewriter, remove it.
          if (lastMessage && lastMessage.author === 'dr') {
               return prev.slice(0, -1);
          }
          return prev;
      });
      setMessages(prev => [...prev, { author: 'dr', text: randomError }]);

    } finally {
        setIsLoading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleUserInput();
    }
  };

  if (!userName) {
    return (
      <main className="bg-blue-800 text-white font-mono w-screen h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          {nameError && (
            <p className="text-red-500 text-lg mb-4">{nameError}</p>
          )}
          {isPreparingGreeting ? (
            <p className="text-xl mb-4 animate-pulse">PREPARING SESSION...</p>
          ) : (
            <>
              <p className="text-xl mb-4">PLEASE ENTER YOUR NAME:</p>
              <div className="flex items-center justify-center">
                <span className="text-yellow-300 mr-2">{'>'}</span>
                <input
                  ref={nameInputRef}
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleNameSubmit();
                    }
                  }}
                  className="bg-transparent border-none text-yellow-300 w-3/4 focus:outline-none placeholder-gray-500 text-center"
                  placeholder="TYPE NAME AND PRESS ENTER"
                  disabled={isPreparingGreeting}
                />
              </div>
            </>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="bg-blue-800 text-white font-mono w-screen h-screen flex flex-col p-2 sm:p-4 overflow-hidden">
      <div className="w-full max-w-4xl mx-auto flex flex-col flex-grow border-2 border-gray-400 p-4 min-h-0">
        <div className="flex-grow overflow-y-auto pr-2 min-h-0">
          {messages.map((msg, index) => (
            <p key={index} className={msg.author === 'dr' ? 'text-white' : 'text-yellow-300'}>
              {msg.author === 'user' && '> '}
              {msg.text}
              {isLoading && !isGreeting && msg.author === 'dr' && index === messages.length - 1 && (
                <span className="animate-pulse">_</span>
              )}
            </p>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="flex-shrink-0 flex items-center mt-4">
          <span className="text-yellow-300 mr-2">{'>'}</span>
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="bg-transparent border-none text-yellow-300 w-full focus:outline-none placeholder-gray-500"
            placeholder={isLoading ? '' : 'TYPE HERE AND PRESS ENTER...'}
          />
        </div>
      </div>
    </main>
  );
}