import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';

const VisualizerCanvas = styled.canvas`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  max-width: 200px;
  max-height: 200px;
`;

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  position: absolute;
  inset: 0;
`;

const AudioVisualizer = ({ stream, isLocal }) => {
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!stream) return;

    // Initialize Audio Context
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);

    source.connect(analyser);
    analyser.fftSize = 64; // Small size for simple bars

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    sourceRef.current = source;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Handle retina displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, rect.width, rect.height);

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const radius = Math.min(centerX, centerY) * 0.4;
      
      // Draw base circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = '#1DB954';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw bars
      // const barWidth = (2 * Math.PI * radius) / bufferLength; // Unused
      
      for (let i = 0; i < bufferLength; i++) {
        const value = dataArray[i];
        const percent = value / 255;
        const barHeight = radius * 0.5 * percent * 1.5; // Scale height
        const angle = (i / bufferLength) * 2 * Math.PI - Math.PI / 2;

        const x1 = centerX + Math.cos(angle) * (radius + 5);
        const y1 = centerY + Math.sin(angle) * (radius + 5);
        const x2 = centerX + Math.cos(angle) * (radius + 5 + barHeight);
        const y2 = centerY + Math.sin(angle) * (radius + 5 + barHeight);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = `rgba(29, 185, 84, ${0.4 + percent * 0.6})`;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
      if (sourceRef.current) sourceRef.current.disconnect();
      if (analyserRef.current) analyserRef.current.disconnect();
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [stream]);

  return (
    <Container>
      <VisualizerCanvas ref={canvasRef} />
    </Container>
  );
};

export default AudioVisualizer;
