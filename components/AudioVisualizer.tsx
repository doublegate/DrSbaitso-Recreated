/**
 * Audio Visualizer Component (v1.5.0)
 *
 * Real-time audio visualization with:
 * - Waveform display
 * - Frequency spectrum analyzer
 * - Multiple visualization modes
 * - Retro-styled graphics
 */

import { useEffect, useRef, useState } from 'react';

interface AudioVisualizerProps {
  audioContext: AudioContext | null;
  audioSource: AudioBufferSourceNode | null;
  isPlaying: boolean;
  mode?: 'waveform' | 'frequency' | 'bars';
}

export function AudioVisualizer({ audioContext, audioSource, isPlaying, mode = 'waveform' }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const [visualMode, setVisualMode] = useState<'waveform' | 'frequency' | 'bars'>(mode);

  useEffect(() => {
    if (!audioContext || !audioSource || !canvasRef.current) return;

    // Create analyzer node
    const analyzer = audioContext.createAnalyser();
    analyzer.fftSize = 2048;
    analyzer.smoothingTimeConstant = 0.8;

    // Connect audio source to analyzer
    try {
      audioSource.connect(analyzer);
      analyzerRef.current = analyzer;
    } catch (error) {
      // Source might already be connected
      console.warn('Could not connect audio source to analyzer:', error);
    }

    return () => {
      if (analyzerRef.current) {
        try {
          analyzerRef.current.disconnect();
        } catch (error) {
          // Already disconnected
        }
        analyzerRef.current = null;
      }
    };
  }, [audioContext, audioSource]);

  useEffect(() => {
    if (!isPlaying || !analyzerRef.current || !canvasRef.current) {
      // Stop animation if not playing
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyzer = analyzerRef.current;
    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      const width = canvas.width;
      const height = canvas.height;

      // Clear canvas
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, width, height);

      if (visualMode === 'waveform') {
        // Waveform visualization
        analyzer.getByteTimeDomainData(dataArray);

        ctx.lineWidth = 2;
        ctx.strokeStyle = '#00ff41'; // Retro green
        ctx.beginPath();

        const sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);
        ctx.stroke();
      } else if (visualMode === 'frequency') {
        // Frequency spectrum visualization
        analyzer.getByteFrequencyData(dataArray);

        ctx.fillStyle = '#00ff41'; // Retro green

        const barWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * height;

          const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height);
          gradient.addColorStop(0, '#00ff41');
          gradient.addColorStop(0.5, '#00cc33');
          gradient.addColorStop(1, '#008822');
          ctx.fillStyle = gradient;

          ctx.fillRect(x, height - barHeight, barWidth, barHeight);

          x += barWidth;
        }
      } else if (visualMode === 'bars') {
        // Bar graph visualization (grouped frequencies)
        analyzer.getByteFrequencyData(dataArray);

        const barCount = 32;
        const barWidth = width / barCount;
        const samplesPerBar = Math.floor(bufferLength / barCount);

        for (let i = 0; i < barCount; i++) {
          let sum = 0;
          for (let j = 0; j < samplesPerBar; j++) {
            sum += dataArray[i * samplesPerBar + j];
          }
          const average = sum / samplesPerBar;
          const barHeight = (average / 255) * height;

          // Color based on frequency range
          let color;
          if (i < 8) {
            color = '#ff4444'; // Low (red)
          } else if (i < 16) {
            color = '#ffaa44'; // Mid-low (orange)
          } else if (i < 24) {
            color = '#ffff44'; // Mid-high (yellow)
          } else {
            color = '#44ff44'; // High (green)
          }

          ctx.fillStyle = color;
          ctx.fillRect(i * barWidth + 2, height - barHeight, barWidth - 4, barHeight);
        }
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isPlaying, visualMode]);

  return (
    <div className="bg-black rounded border-2 border-current p-2">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-bold">AUDIO VISUALIZER</span>
        <div className="flex gap-1">
          <button
            onClick={() => setVisualMode('waveform')}
            className={`px-2 py-1 text-xs rounded ${
              visualMode === 'waveform' ? 'bg-green-600' : 'bg-gray-700'
            }`}
            title="Waveform"
          >
            〰
          </button>
          <button
            onClick={() => setVisualMode('frequency')}
            className={`px-2 py-1 text-xs rounded ${
              visualMode === 'frequency' ? 'bg-green-600' : 'bg-gray-700'
            }`}
            title="Frequency"
          >
            ∿
          </button>
          <button
            onClick={() => setVisualMode('bars')}
            className={`px-2 py-1 text-xs rounded ${
              visualMode === 'bars' ? 'bg-green-600' : 'bg-gray-700'
            }`}
            title="Bars"
          >
            ▃▅▆▇
          </button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={600}
        height={150}
        className="w-full h-auto border border-current rounded"
        style={{ backgroundColor: '#000' }}
      />
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
          {analyzerRef.current ? 'Audio stopped' : 'Waiting for audio...'}
        </div>
      )}
    </div>
  );
}
