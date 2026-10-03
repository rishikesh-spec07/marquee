import React, { useEffect, useRef } from 'react';
import { useMusicStore } from '../store/useMusicStore';
import { soundFX } from '../services/audioFX';

export const VisualizerCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isPlayingAudio, visualizerMode } = useMusicStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const analyser = soundFX.getAnalyserNode();

      const bufferLength = analyser ? analyser.frequencyBinCount : 64;
      const dataArray = new Uint8Array(bufferLength);

      if (analyser && isPlayingAudio) {
        analyser.getByteFrequencyData(dataArray);
      } else if (isPlayingAudio) {
        // Generate dynamic DJ frequency bars animation synced to time
        const time = Date.now() * 0.005;
        for (let i = 0; i < bufferLength; i++) {
          const val = Math.floor(
            Math.abs(Math.sin(time + i * 0.25) * 180 + Math.cos(time * 1.5 + i * 0.1) * 75)
          );
          dataArray[i] = Math.min(255, val);
        }
      }

      if (visualizerMode === 'bars') {
        const totalBars = 36;
        const barWidth = (canvas.width / totalBars) - 3;
        const now = Date.now() * 0.003;

        // DJ Strobe Ambient Spotlights
        if (isPlayingAudio) {
          const spotlightX1 = canvas.width * 0.2 + Math.sin(now) * 80;
          const spotlightX2 = canvas.width * 0.8 + Math.cos(now * 1.2) * 80;

          const grad1 = ctx.createRadialGradient(spotlightX1, 0, 5, spotlightX1, canvas.height, 140);
          grad1.addColorStop(0, 'rgba(236, 72, 153, 0.25)');
          grad1.addColorStop(1, 'transparent');
          ctx.fillStyle = grad1;
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          const grad2 = ctx.createRadialGradient(spotlightX2, 0, 5, spotlightX2, canvas.height, 140);
          grad2.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
          grad2.addColorStop(1, 'transparent');
          ctx.fillStyle = grad2;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Render DJ Frequency Equalizer Bars
        for (let i = 0; i < totalBars; i++) {
          const sampleIdx = Math.floor((i / totalBars) * dataArray.length);
          let rawVal = dataArray[sampleIdx] || 0;

          if (!isPlayingAudio) {
            rawVal = Math.floor(12 + Math.sin(now * 2 + i * 0.3) * 8);
          }

          const barHeight = Math.max(6, (rawVal / 255) * canvas.height * 0.85);
          const x = i * (barWidth + 3) + 4;
          const y = canvas.height - barHeight;

          // Multi-color DJ Stage Gradient (Red Peak -> Amber -> Emerald -> Electric Cyan)
          const barGrad = ctx.createLinearGradient(0, canvas.height, 0, 0);
          barGrad.addColorStop(0, '#3b82f6');  // Electric Blue Bottom
          barGrad.addColorStop(0.35, '#10b981'); // Emerald Green
          barGrad.addColorStop(0.7, '#f59e0b');  // DJ Gold Amber
          barGrad.addColorStop(1.0, '#ef4444');  // Peak Red Strobe

          ctx.fillStyle = barGrad;
          ctx.shadowBlur = isPlayingAudio ? 12 : 0;
          ctx.shadowColor = '#ec4899';

          // Draw rounded top equalizer bar
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 1, 1]);
          ctx.fill();

          // Peak Indicator Cap
          if (isPlayingAudio && rawVal > 120) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x, y - 4, barWidth, 2);
          }
        }
      } else if (visualizerMode === 'circular') {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) * 0.42;

        ctx.beginPath();
        for (let i = 0; i < bufferLength; i++) {
          const angle = (i / bufferLength) * Math.PI * 2;
          const amp = isPlayingAudio ? (dataArray[i] / 255) * 35 : 4 + Math.sin(Date.now() * 0.003 + i) * 3;
          const r = radius + amp;
          const x = centerX + Math.cos(angle) * r;
          const y = centerY + Math.sin(angle) * r;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ec4899';
        ctx.stroke();
      } else if (visualizerMode === 'particles') {
        for (let i = 0; i < bufferLength; i += 2) {
          const val = isPlayingAudio ? dataArray[i] : Math.abs(Math.sin(Date.now() * 0.002 + i) * 120);
          if (val > 30) {
            const x = (i / bufferLength) * canvas.width;
            const y = canvas.height - (val / 255) * canvas.height;
            const size = Math.max(2, (val / 255) * 7);

            ctx.fillStyle = `rgba(236, 72, 153, ${val / 255})`;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#f59e0b';
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [isPlayingAudio, visualizerMode]);

  return (
    <canvas
      ref={canvasRef}
      width={480}
      height={140}
      className="w-full h-full rounded-2xl opacity-95"
    />
  );
};
