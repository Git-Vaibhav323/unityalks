/* eslint-disable no-unused-vars, react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { FiMic, FiMicOff, FiUsers, FiSend, FiSmile, FiHeadphones, FiMessageCircle, FiSquare, FiSkipForward, FiSkipBack, FiZap, FiVideo, FiPlay } from 'react-icons/fi';
import SimplePeer from 'simple-peer';
import Header from '../layout/Header';
import { socketService } from '../../utils/socketService';
import { getRtcConfig, ESTABLISHMENT_DELAY_THRESHOLD_MS, STUN_SERVERS } from '../../utils/webrtcStun';
import { createInitialState, applyMove as applyChessMove } from '../../utils/chessEngine';
import ChessBoard from '../ui/ChessBoard';
import AudioVisualizer from '../ui/AudioVisualizer';

// Minimal process polyfill for simple-peer in browser builds
if (typeof window !== 'undefined') {
  const proc = window.process || {};
  if (!proc.env) proc.env = {};
  if (typeof proc.nextTick !== 'function') {
    proc.nextTick = (cb, ...args) => Promise.resolve().then(() => cb(...args));
  }
  window.process = proc;
}

const AudioChatContainer = styled.div`
  height: 100vh;
  max-width: 100vw;
  background: ${({ theme }) => theme.colors.appBg};
  color: #F8FAFC;
  overflow: hidden;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 0;
`;

const MainContent = styled.div`
  height: calc(100vh - 64px);
  display: flex;
  flex-direction: column;
  margin-top: 70px;
  position: relative;
  overflow: hidden;
  z-index: 1;
`;

const AudioSection = styled.div`
  display: flex;
  height: 100%;
  gap: 0;
  position: relative;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const AudioFeedsContainer = styled.div`
  width: 35%;
  display: flex;
  flex-direction: column;
  background: #1a1a1a;
  
  @media (max-width: 768px) {
    width: 100%;
    height: 40%;
    flex-direction: row;
  }
`;

const AudioFeed = styled.div`
  flex: 1;
  background: #0f0f0f;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  min-height: 200px;
  overflow: hidden;
  
  @media (min-width: 769px) {
    border: 2px solid #1DB954;
    border-radius: 8px;
    margin: 4px;
    
    &:last-child {
      border-bottom: 2px solid #1DB954;
    }
  }
  
  @media (max-width: 768px) {
    min-height: 150px;
    
    &:last-child {
      border-right: none;
    }
  }
`;

const HiddenAudioElement = styled.audio`
  display: none;
`;

const AudioPlaceholder = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 0.9rem;
  text-align: center;
  padding: 20px;
  z-index: 1;
  
  svg {
    font-size: 2rem;
    margin-bottom: 10px;
    color: #1DB954;
  }
`;

const AudioLabel = styled.div`
  position: absolute;
  bottom: 10px;
  left: 10px;
  background: rgba(0,0,0,0.7);
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  z-index: 2;
`;

const RemoteBufferOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(0,0,0,0.45), rgba(0,0,0,0.75));
  z-index: 3;
`;

const AudioOverlayButton = styled.button`
  position: absolute;
  bottom: 10px;
  right: 10px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.2);
  background: rgba(0,0,0,0.6);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1.2rem;
  z-index: 2;
  
  &:hover {
    background: rgba(29,185,84,0.2);
    border-color: rgba(29,185,84,0.5);
    transform: translateY(-1px);
  }
  
  &.active {
    background: #1DB954;
    color: #000;
  }
  
  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
    font-size: 1rem;
    bottom: 8px;
    right: 8px;
  }
`;

const MobileAudioControls = styled.div`
  display: none;
  
  @media (max-width: 768px) {
    display: flex;
    position: absolute;
    bottom: 8px;
    left: 8px;
    gap: 8px;
    align-items: center;
    z-index: 2;
  }
`;

const MobileControlButton = styled.button`
  padding: 8px 12px;
  border-radius: 6px;
  border: none;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  }
  
  &.start {
    background: linear-gradient(135deg, #1DB954, #19a64c);
    
    &:hover {
      background: linear-gradient(135deg, #20e06b, #1db954);
    }
  }
  
  &.stop {
    background: linear-gradient(135deg, #DC3545, #c82333);
    
    &:hover {
      background: linear-gradient(135deg, #e74c5c, #d63031);
    }
  }
  
  &.skip {
    background: linear-gradient(135deg, #1DB954, #19a64c);
    
    &:hover {
      background: linear-gradient(135deg, #20e06b, #1db954);
    }
  }
`;

const Watermark = styled.div`
  position: absolute;
  bottom: 10px;
  right: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(0,0,0,0.7);
  padding: 6px 10px;
  border-radius: 6px;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(29,185,84,0.3);
  z-index: 2;
  
  @media (max-width: 768px) {
    bottom: 8px;
    right: 8px;
    padding: 4px 8px;
    gap: 4px;
  }
`;

const WatermarkLogo = styled.img`
  width: 16px;
  height: 16px;
  border-radius: 3px;
  object-fit: contain;
  
  @media (max-width: 768px) {
    width: 14px;
    height: 14px;
  }
`;

const WatermarkText = styled.div`
  color: #1DB954;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  
  @media (max-width: 768px) {
    font-size: 0.7rem;
  }
`;

const ChatSection = styled.div`
  flex: 1;
  background: #000000;
  display: flex;
  flex-direction: column;
  position: relative;
  min-height: 0;
  padding-bottom: 80px;
  
  @media (max-width: 768px) {
    height: 60%;
  }
`;

const ChessArea = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 16px;
  background: #0d0d0d;
`;

const MusicPlayerContainer = styled.div`
  width: 100%;
  max-width: min(90vw, 600px);
  max-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  color: #e5e7eb;
  background: radial-gradient(circle at top, rgba(34,197,94,0.18) 0, rgba(15,23,42,0.96) 40%, rgba(3,7,18,0.98) 100%);
  border-radius: 18px;
  padding: 16px 18px 18px;
  border: 1px solid rgba(34,197,94,0.35);
  box-shadow:
    0 0 0 1px rgba(15,23,42,1),
    0 16px 40px rgba(0,0,0,0.75),
    0 0 32px rgba(34,197,94,0.22);
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
  
  @media (max-width: 768px) {
    max-width: 100%;
    padding: 12px 12px 14px;
    gap: 12px;
    border-radius: 14px;
    box-shadow:
      0 0 0 1px rgba(15,23,42,1),
      0 10px 26px rgba(0,0,0,0.7),
      0 0 22px rgba(34,197,94,0.18);
  }
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(0,0,0,0.25);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(34,197,94,0.6);
    border-radius: 3px;
    
    &:hover {
      background: rgba(34,197,94,0.8);
    }
  }
`;

const MusicSearchSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const MusicTrackInput = styled.input`
  width: 100%;
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid rgba(148,163,184,0.4);
  background: rgba(0,0,0,0.4);
  color: #e5e7eb;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: rgba(29,185,84,0.6);
    box-shadow: 0 0 0 3px rgba(29,185,84,0.1);
  }
  
  &::placeholder {
    color: #6b7280;
  }
`;

const MusicStatusText = styled.div`
  font-size: 0.85rem;
  color: #9ca3af;
  text-align: center;
`;

const MusicPlayerMain = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
  flex-shrink: 0;
  
  @media (max-width: 768px) {
    gap: 12px;
  }
`;

const MusicArtworkSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  
  @media (max-width: 768px) {
    gap: 8px;
  }
`;

const MusicArtwork = styled.img`
  width: min(60vw, 240px);
  height: min(60vw, 240px);
  max-width: 100%;
  aspect-ratio: 1;
  border-radius: 12px;
  object-fit: cover;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
  border: 2px solid rgba(29,185,84,0.3);
  transition: transform 0.3s ease;
  flex-shrink: 0;
  
  &:hover {
    transform: scale(1.02);
  }
  
  @media (max-width: 768px) {
    width: min(50vw, 180px);
    height: min(50vw, 180px);
    border-radius: 10px;
  }
`;

const MusicInfoSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
`;

const MusicTitle = styled.h3`
  font-size: clamp(1rem, 4vw, 1.5rem);
  font-weight: 700;
  color: #ffffff;
  margin: 0;
  line-height: 1.3;
  word-wrap: break-word;
  overflow-wrap: break-word;
  
  @media (max-width: 768px) {
    font-size: clamp(0.9rem, 4vw, 1.2rem);
  }
`;

const MusicArtist = styled.div`
  font-size: clamp(0.85rem, 3vw, 1rem);
  color: #9ca3af;
  font-weight: 500;
  word-wrap: break-word;
  overflow-wrap: break-word;
  
  @media (max-width: 768px) {
    font-size: clamp(0.75rem, 3vw, 0.9rem);
  }
`;

const MusicDurationText = styled.div`
  font-size: clamp(0.7rem, 2.5vw, 0.85rem);
  color: #6b7280;
  margin-top: 4px;
`;

const MusicProgressSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const MusicEqualizer = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 4px;
  height: 20px;
  margin-bottom: 4px;
`;

const eqBarPulse = keyframes`
  0% { transform: scaleY(0.4); opacity: 0.9; }
  25% { transform: scaleY(1); opacity: 1; }
  50% { transform: scaleY(0.5); opacity: 0.8; }
  75% { transform: scaleY(0.9); opacity: 1; }
  100% { transform: scaleY(0.4); opacity: 0.9; }
`;

const MusicEqualizerBar = styled.div`
  width: 4px;
  border-radius: 999px;
  background: linear-gradient(to top, #22c55e, #bbf7d0);
  transform-origin: bottom;
  opacity: 0.85;
  ${({ $delay = 0 }) => css`
    animation: ${eqBarPulse} 1.1s ease-in-out ${$delay}ms infinite;
  `}
  ${({ $isPlaying }) => !$isPlaying && 'animation-play-state: paused; transform: scaleY(0.35); opacity: 0.6;'}
`;

const MusicProgressRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const MusicProgressInput = styled.input`
  flex: 1;
  appearance: none;
  height: 6px;
  border-radius: 999px;
  background: rgba(31,41,55,0.9);
  outline: none;
  cursor: pointer;
  transition: height 0.2s ease;

  &:hover {
    height: 8px;
  }

  &::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #1DB954;
    box-shadow: 0 0 8px rgba(29,185,84,0.8);
    cursor: grab;
    
    &:active {
      cursor: grabbing;
    }
  }

  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #1DB954;
    box-shadow: 0 0 8px rgba(29,185,84,0.8);
    border: none;
    cursor: grab;
    
    &:active {
      cursor: grabbing;
    }
  }
`;

const MusicTimeText = styled.div`
  font-size: 0.85rem;
  color: #9ca3af;
  min-width: 80px;
  text-align: center;
  font-variant-numeric: tabular-nums;
`;

const MusicControlsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex-shrink: 0;
  
  @media (max-width: 768px) {
    gap: 12px;
  }
`;

const MusicControlButton = styled.button`
  width: clamp(40px, 10vw, 50px);
  height: clamp(40px, 10vw, 50px);
  border-radius: 50%;
  border: 2px solid rgba(148,163,184,0.4);
  background: rgba(0,0,0,0.5);
  color: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: clamp(1rem, 3vw, 1.3rem);
  flex-shrink: 0;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 4px 12px rgba(29,185,84,0.4);
    border-color: rgba(29,185,84,0.8);
    background: rgba(29,185,84,0.1);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0) scale(1);
  }
  
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  
  &.play-pause {
    width: clamp(52px, 12vw, 64px);
    height: clamp(52px, 12vw, 64px);
    font-size: clamp(1.2rem, 3.5vw, 1.6rem);
    background: rgba(29,185,84,0.2);
    border-color: rgba(29,185,84,0.6);
    
    &:hover:not(:disabled) {
      background: rgba(29,185,84,0.3);
      box-shadow: 0 6px 20px rgba(29,185,84,0.5);
    }
  }
  
  @media (max-width: 768px) {
    width: clamp(36px, 8vw, 44px);
    height: clamp(36px, 8vw, 44px);
    font-size: clamp(0.9rem, 2.5vw, 1.1rem);
    
    &.play-pause {
      width: clamp(48px, 10vw, 56px);
      height: clamp(48px, 10vw, 56px);
      font-size: clamp(1.1rem, 3vw, 1.3rem);
    }
  }
`;

const MusicLyricsSection = styled.div`
  max-height: min(30vh, 200px);
  overflow-y: auto;
  padding: 12px;
  background: rgba(0,0,0,0.3);
  border-radius: 10px;
  border: 1px solid rgba(29,185,84,0.2);
  flex-shrink: 0;
  
  @media (max-width: 768px) {
    max-height: min(25vh, 150px);
    padding: 10px;
    border-radius: 8px;
  }
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(0,0,0,0.2);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(29,185,84,0.5);
    border-radius: 3px;
    
    &:hover {
      background: rgba(29,185,84,0.7);
    }
  }
`;

const MusicLyricsText = styled.div`
  font-size: clamp(0.8rem, 2.5vw, 0.95rem);
  line-height: 1.6;
  color: #d1d5db;
  white-space: pre-line;
  text-align: center;
  word-wrap: break-word;
  overflow-wrap: break-word;
  
  @media (max-width: 768px) {
    line-height: 1.5;
  }
  
  &:empty::before {
    content: 'No lyrics available';
    color: #6b7280;
    font-style: italic;
  }
`;

const ButtonIcon = styled.span`
  display: inline-flex;
  align-items: center;
  margin-right: 8px;
  font-size: 1.1em;
`;

const StartChatButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 38px;
  min-width: 140px;
  border-radius: 999px;
  border: none;
  font-weight: 600;
  font-size: 1.15rem;
  letter-spacing: 0.3px;
  cursor: pointer;
  transition: all 0.25s ease;
  background: linear-gradient(135deg, #1DB954 0%, #169c46 100%);
  color: #fff;
  box-shadow: 0 4px 14px rgba(29, 185, 84, 0.35);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(29, 185, 84, 0.45);
    background: linear-gradient(135deg, #22e06b 0%, #1DB954 100%);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  @media (max-width: 768px) {
    padding: 10px 28px;
    min-width: 120px;
    font-size: 1.05rem;
  }
`;

const StopButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 38px;
  min-width: 100px;
  border-radius: 999px;
  border: 2px solid #ef4444;
  font-weight: 600;
  font-size: 1.15rem;
  letter-spacing: 0.3px;
  cursor: pointer;
  transition: all 0.25s ease;
  background: #000;
  color: #ef4444;
  
  &:hover {
    transform: translateY(-2px);
    background: #111;
    box-shadow: 0 0 12px rgba(239, 68, 68, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  @media (max-width: 768px) {
    padding: 10px 28px;
    min-width: 88px;
    font-size: 1.05rem;
  }
`;

const SkipButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 38px;
  min-width: 100px;
  border-radius: 999px;
  border: 2px solid rgba(29, 185, 84, 0.6);
  font-weight: 600;
  font-size: 1.15rem;
  letter-spacing: 0.3px;
  cursor: pointer;
  transition: all 0.25s ease;
  background: rgba(29, 185, 84, 0.15);
  color: #1DB954;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    background: rgba(29, 185, 84, 0.25);
    box-shadow: 0 4px 14px rgba(29, 185, 84, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  @media (max-width: 768px) {
    padding: 10px 28px;
    min-width: 88px;
    font-size: 1.05rem;
  }
`;

const FunButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 38px;
  min-width: 90px;
  border-radius: 999px;
  border: 2px solid rgba(245, 158, 11, 0.7);
  font-weight: 600;
  font-size: 1.15rem;
  letter-spacing: 0.3px;
  cursor: pointer;
  transition: all 0.25s ease;
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    background: rgba(245, 158, 11, 0.35);
    box-shadow: 0 4px 14px rgba(245, 158, 11, 0.3);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  @media (max-width: 768px) {
    padding: 10px 24px;
    min-width: 80px;
    font-size: 1.05rem;
  }
`;

const MobileFunWrap = styled.div`
  display: none;
  align-items: center;
  flex-shrink: 0;
  
  @media (max-width: 768px) {
    display: flex;
  }
`;

const FunMenuWrap = styled.div`
  position: relative;
  display: inline-flex;
`;

const FunMenuPopover = styled.div`
  position: absolute;
  bottom: calc(100% + 10px);
  left: calc(50% + 40px);
  transform: translateX(-50%);
  min-width: 180px;
  background: rgba(0, 0, 0, 0.96);
  border: 1px solid rgba(29, 185, 84, 0.4);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  padding: 8px 0;
  z-index: 20;
  backdrop-filter: blur(12px);
  
  @media (max-width: 768px) {
    bottom: calc(100% + 25px);
    min-width: 160px;
    left: calc(50% + 50px);
    transform: translateX(-50%);
    padding: 6px 0;
  }
`;

const FunMenuItem = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border: none;
  background: none;
  color: #F8FAFC;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  transition: background 0.2s ease;
  
  &:hover {
    background: rgba(29, 185, 84, 0.15);
    color: #1DB954;
  }
  
  &:active {
    background: rgba(29, 185, 84, 0.25);
  }
  
  @media (max-width: 768px) {
    padding: 12px 14px;
    font-size: 0.9rem;
  }
`;

const FunSubmenu = styled.div`
  padding: 4px 0 4px 8px;
  border-left: 2px solid rgba(29, 185, 84, 0.4);
  margin: 4px 0 4px 12px;
`;

const FunRequestOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
`;
const FunRequestCard = styled.div`
  background: #000;
  border: 1px solid rgba(29, 185, 84, 0.4);
  border-radius: 12px;
  padding: 24px;
  max-width: 320px;
  width: 100%;
  text-align: center;
`;
const FunRequestText = styled.p`
  color: #F8FAFC;
  font-size: 1rem;
  margin: 0 0 20px 0;
  line-height: 1.5;
`;
const FunRequestActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
`;

const FunButtonSmall = styled(FunButton)`
  padding: 10px 14px;
  font-size: 0.9rem;
  
  @media (max-width: 768px) {
    padding: 10px 12px;
  }
`;

const ChatBox = styled.div`
  position: ${props => props.$chessMode ? 'relative' : 'absolute'};
  ${props => props.$chessMode
    ? 'flex: 1; min-height: 0; width: 100%; max-width: 100%; top: auto; right: auto; bottom: auto; left: auto;'
    : 'top: 20px; right: 20px; bottom: 100px; width: 300px;'}
  background: rgba(0,0,0,0.9);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(10px);
  z-index: 5;
  ${props => !props.$chessMode && 'border: 1px solid rgba(29,185,84,0.3);'}
  
  @media (max-width: 768px) {
    position: ${props => props.$chessMode ? 'relative' : 'fixed'};
    ${props => props.$chessMode
      ? 'flex: 1; min-height: 120px;'
      : `left: 0; right: 0; width: 100%; height: 200px; transition: top 0.2s ease;
         ${props.$mobileChatTop != null ? `top: ${props.$mobileChatTop}px; bottom: auto;` : 'top: auto; bottom: 0;'}`}
    border-radius: 0;
    border: none;
  }
`;

const ChatMessages = styled.div`
  flex: 1;
  padding: 10px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  
  @media (max-width: 768px) {
    scroll-behavior: smooth;
    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-track { background: rgba(255,255,255,0.1); border-radius: 2px; }
    &::-webkit-scrollbar-thumb { background: rgba(29,185,84,0.5); border-radius: 2px; }
  }
`;

const Message = styled.div`
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.9rem;
  max-width: 80%;
  word-wrap: break-word;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &.own {
    background: rgba(29,185,84,0.2);
    color: #fff;
    align-self: flex-end;
    border: 1px solid rgba(29,185,84,0.4);
  }
  
  &.other {
    background: rgba(255,255,255,0.1);
    color: #fff;
    align-self: flex-start;
    border: 1px solid rgba(255,255,255,0.2);
  }
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  }
`;

const ReplyPreview = styled.div`
  background: rgba(29,185,84,0.1);
  border-left: 3px solid #1DB954;
  padding: 6px 8px;
  margin-bottom: 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  color: #1DB954;
  position: relative;
`;

const ReplyText = styled.div`
  font-weight: 600;
  margin-bottom: 2px;
`;

const ReplyContent = styled.div`
  color: #B3B3B3;
  font-style: italic;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ReplyCancel = styled.button`
  position: absolute;
  top: 4px;
  right: 4px;
  background: none;
  border: none;
  color: #1DB954;
  cursor: pointer;
  font-size: 0.8rem;
  padding: 2px;
  
  &:hover { color: #fff; }
`;

const ReplyIndicator = styled.div`
  background: rgba(29,185,84,0.1);
  border-left: 3px solid #1DB954;
  padding: 4px 8px;
  margin-bottom: 6px;
  border-radius: 4px;
  font-size: 0.75rem;
  color: #1DB954;
`;

const ReplyContentSmall = styled.div`
  color: #B3B3B3;
  font-style: italic;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ChatInput = styled.div`
  display: flex;
  flex-direction: column;
  padding: 10px;
  border-top: 1px solid rgba(255,255,255,0.1);
  gap: 8px;
  min-width: 0;
  
  @media (max-width: 768px) {
    padding: 10px 8px;
    background: rgba(0,0,0,0.95);
  }
`;

const InputRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  min-width: 0;
  @media (max-width: 768px) {
    gap: 6px;
    min-width: 0;
    width: 100%;
  }
`;

const MessageInput = styled.input`
  flex: 1;
  min-width: 0;
  padding: 8px 12px;
  border: 1px solid rgba(29,185,84,0.3);
  border-radius: 6px;
  background: rgba(0,0,0,0.6);
  color: #fff;
  font-size: 0.9rem;
  
  &:focus { outline: none; border-color: rgba(29,185,84,0.6); }
  &::placeholder { color: #666; }
  
  @media (max-width: 768px) {
    padding: 8px 10px;
    font-size: 0.9rem;
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(29,185,84,0.5);
  }
`;

const SendButton = styled.button`
  padding: 8px;
  border: 1px solid rgba(29,185,84,0.3);
  border-radius: 6px;
  background: rgba(29,185,84,0.1);
  color: #1DB954;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover { background: rgba(29,185,84,0.2); border-color: rgba(29,185,84,0.5); }
  
  @media (max-width: 768px) { padding: 10px; font-size: 1.1rem; flex-shrink: 0; }
`;

const EmojiButton = styled.button`
  padding: 8px;
  border: 1px solid rgba(29,185,84,0.3);
  border-radius: 6px;
  background: rgba(29,185,84,0.1);
  color: #1DB954;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover { background: rgba(29,185,84,0.2); border-color: rgba(29,185,84,0.5); }
  
  @media (max-width: 768px) { padding: 10px; font-size: 1.1rem; flex-shrink: 0; }
`;

const EmojiPicker = styled.div`
  position: absolute;
  bottom: 50px;
  left: 0;
  right: 0;
  width: 100%;
  max-height: 120px;
  background: rgba(0,0,0,0.95);
  border: 1px solid rgba(29,185,84,0.3);
  border-radius: 8px;
  padding: 8px;
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 4px;
  backdrop-filter: blur(10px);
  z-index: 10;
  overflow: hidden;
`;

const EmojiItem = styled.button`
  background: none;
  border: none;
  color: #fff;
  font-size: 1rem;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 24px;
  
  &:hover { background: rgba(29,185,84,0.2); }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const BufferSpinner = styled.div`
  width: 56px;
  height: 56px;
  border: 6px solid rgba(29,185,84,0.3);
  border-top-color: #1DB954;
  border-radius: 50%;
  animation: ${spin} 0.9s linear infinite;
  filter: drop-shadow(0 0 6px rgba(29,185,84,0.5));
`;

const ErrorMessage = styled.div`
  color: #ff4444;
  font-size: 0.9rem;
  text-align: center;
  margin-bottom: 20px;
  padding: 10px;
  background: rgba(255,68,68,0.1);
  border: 1px solid rgba(255,68,68,0.3);
  border-radius: 6px;
`;

const BottomControlsSection = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 80px;
  background: rgba(0,0,0,0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  z-index: 10;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const ChatControls = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0 20px;
  
  @media (max-width: 768px) {
    padding: 0 10px;
  }
`;

const ChatControlsCentered = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ChatControlsStartRight = styled.div`
  width: 100%;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding-right: 50px;
  @media (max-width: 768px) {
    justify-content: center;
    padding-right: 0;
  }
`;

const ChatControlsRight = styled.div`
  display: flex;
  gap: 15px;
  align-items: center;
  
  @media (max-width: 768px) {
    gap: 10px;
  }
`;

function AudioChat() {
  const [isConnected, setIsConnected] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [isStarted, setIsStarted] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [mobileChatTop, setMobileChatTop] = useState(null);
  const [waitingMessage, setWaitingMessage] = useState('');
  const [hasLocalStream, setHasLocalStream] = useState(false);
  const [showRemoteBuffer, setShowRemoteBuffer] = useState(false);
  const [showFunMenu, setShowFunMenu] = useState(false);
  const [showPlayAlongSubmenu, setShowPlayAlongSubmenu] = useState(false);
  const [funToken, setFunToken] = useState(0);
  const [pendingFunRequest, setPendingFunRequest] = useState(null);
  const [acceptedFunGame, setAcceptedFunGame] = useState(null);
  const [amIWhite, setAmIWhite] = useState(true);
  const [chessState, setChessState] = useState(createInitialState);
  const [isMusicHost, setIsMusicHost] = useState(false);
  const [musicTrackUrl, setMusicTrackUrl] = useState('');
  const [musicTrackTitle, setMusicTrackTitle] = useState('');
  const [musicTrackArtist, setMusicTrackArtist] = useState('');
  const [musicTrackArtwork, setMusicTrackArtwork] = useState('');
  const [musicTrackLyrics, setMusicTrackLyrics] = useState('');
  const [musicTrackDuration, setMusicTrackDuration] = useState(0);
  const [saavnQuery, setSaavnQuery] = useState('');
  const [isLoadingTrack, setIsLoadingTrack] = useState(false);
  const [musicIsPlaying, setMusicIsPlaying] = useState(false);
  const [musicPosition, setMusicPosition] = useState(0);
  const [musicDuration, setMusicDuration] = useState(0);
  const hasRemoteStreamRef = useRef(false);
  const funMenuRef = useRef(null);
  const funMenuMobileRef = useRef(null);
  
  const remoteAudioRef = useRef(null);
  const localStreamRef = useRef(null);
  const musicAudioRef = useRef(null);
  const messagesEndRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const partnerIdRef = useRef(null);
  const isInitiatorRef = useRef(false);
  const remoteStreamRef = useRef(null);
  const remoteBufferTimerRef = useRef(null);
  const stunServerIndexRef = useRef(0);
  const connectionStartTimeRef = useRef(null);
  const establishmentRecordedRef = useRef(false);

  const recordEstablishmentTime = () => {
    if (establishmentRecordedRef.current) return;
    establishmentRecordedRef.current = true;
    const start = connectionStartTimeRef.current;
    if (start != null) {
      const elapsed = Date.now() - start;
      if (elapsed > ESTABLISHMENT_DELAY_THRESHOLD_MS) {
        stunServerIndexRef.current = (stunServerIndexRef.current + 1) % STUN_SERVERS.length;
        console.log('[STUN] Establishment took', Math.round(elapsed), 'ms > 2.5s, next connection will try server index', stunServerIndexRef.current);
      }
    }
  };

  // New state for visualizer
  const [remoteStreamForVisualizer, setRemoteStreamForVisualizer] = useState(null);

  const cleanupPeer = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.destroy?.();
      peerConnectionRef.current = null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
    remoteStreamRef.current = null;
    setRemoteStreamForVisualizer(null);
    partnerIdRef.current = null;
    hasRemoteStreamRef.current = false;
  };

  const cleanupStreams = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
    setHasLocalStream(false);
    setShowRemoteBuffer(false);
    if (remoteBufferTimerRef.current) {
      clearTimeout(remoteBufferTimerRef.current);
      remoteBufferTimerRef.current = null;
    }
    hasRemoteStreamRef.current = false;
  };

  const triggerRemoteBuffer = (keepVisible = false) => {
    setShowRemoteBuffer(true);
    if (remoteBufferTimerRef.current) {
      clearTimeout(remoteBufferTimerRef.current);
      remoteBufferTimerRef.current = null;
    }
    
    if (!keepVisible) {
      remoteBufferTimerRef.current = setTimeout(() => {
        setShowRemoteBuffer(false);
        remoteBufferTimerRef.current = null;
      }, 1000);
    }
  };

  const startAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true
      });

      localStreamRef.current = stream;
      setHasLocalStream(true);
      
      setIsWaiting(true);
      setError('');
      return true;
    } catch (err) {
      setError('Microphone blocked. Please enable it and try again.');
      console.error('Error accessing microphone:', err);
      setIsStarted(false);
      return false;
    }
  };

  const setupWebRTC = async (isInitiator) => {
    try {
      if (!localStreamRef.current) {
        setError('Microphone not ready. Please allow access and retry.');
        return;
      }

      const peer = new SimplePeer({
        initiator: isInitiator,
        trickle: true,
        stream: localStreamRef.current,
        config: getRtcConfig(stunServerIndexRef.current),
      });
      peerConnectionRef.current = peer;
      isInitiatorRef.current = isInitiator;

      peer.on('signal', (sig) => {
        if (!partnerIdRef.current) return;
        const signalType = sig.type || (sig.candidate ? 'ice' : 'offer');
        socketService.send({ type: 'signal', signalType, data: sig });
      });

      peer.on('stream', (remoteStream) => {
        console.log('Peer stream event', remoteStream);
        recordEstablishmentTime();
        remoteStreamRef.current = remoteStream;
        setRemoteStreamForVisualizer(remoteStream);
        applyRemoteStream();
        setIsConnected(true);
        setIsWaiting(false);
        setShowRemoteBuffer(false);
        hasRemoteStreamRef.current = true;
      });

      peer.on('track', (track, stream) => {
        console.log('Peer track event', track, stream);
        recordEstablishmentTime();
        if (!remoteStreamRef.current) {
          remoteStreamRef.current = new MediaStream();
        }
        remoteStreamRef.current.addTrack(track);
        setRemoteStreamForVisualizer(remoteStreamRef.current);
        track.onunmute = () => {
          applyRemoteStream();
        };
        applyRemoteStream();
        setIsConnected(true);
        setIsWaiting(false);
        setShowRemoteBuffer(false);
        hasRemoteStreamRef.current = true;
      });

      peer.on('connect', () => {
        recordEstablishmentTime();
        setIsConnected(true);
        setIsWaiting(false);
        setShowRemoteBuffer(false);
      });

      peer.on('close', () => {
        hasRemoteStreamRef.current = false;
        resetForRequeue('Connection closed. Rejoining queue...');
      });

      peer.on('error', (err) => {
        console.error('Peer error', err);
        setError('Connection error');
        resetForRequeue('Connection error. Rejoining queue...');
      });
      peer.on('data', (data) => {
        try {
          const text = new TextDecoder().decode(data);
          let obj = null;
          try { obj = JSON.parse(text); } catch (_) {}
          if (obj && obj.type === 'chess-move') {
            setChessState((prev) => {
              const next = applyChessMove(prev, { from: obj.from, to: obj.to, promotion: obj.promotion });
              return next || prev;
            });
            return;
          }
          if (obj && obj.type === 'music-control') {
            handleIncomingMusicControl(obj);
            return;
          }
          const message = {
            id: Date.now(),
            text,
            isOwn: false,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, message]);
        } catch (e) {
          console.error('Data channel decode error', e);
        }
      });
      const pc = peer._pc;
      if (pc) {
        pc.oniceconnectionstatechange = () => {
          const state = pc.iceConnectionState;
          if (state === 'failed' || state === 'disconnected' || state === 'closed') {
            resetForRequeue('Connection lost. Rejoining queue...');
          }
        };
        pc.onconnectionstatechange = () => {
          const state = pc.connectionState;
          if (state === 'failed' || state === 'disconnected' || state === 'closed') {
            resetForRequeue('Connection lost. Rejoining queue...');
          }
        };
      }
    } catch (error) {
      console.error('Error setting up WebRTC:', error);
      setError('Failed to establish connection');
    }
  };

  const handleWebRTCSignal = async (data) => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    try {
      const { signal } = data;
      if (signal) {
        if (data.from && partnerIdRef.current && data.from !== partnerIdRef.current) return;
        if (signal.type === 'offer' && isInitiatorRef.current) return;
        if (signal.type === 'answer' && !isInitiatorRef.current) return;
        
        const state = pc._pc?.signalingState;
        if (signal.type === 'answer') {
          if (state === 'stable' || (state && state !== 'have-local-offer' && state !== 'have-remote-pranswer')) return;
        }
        if (signal.type === 'offer') {
          if (state && state !== 'stable') return;
        }
        pc.signal(signal);
      }
    } catch (error) {
      console.error('Error handling signal:', error);
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioEnabled;
        setAudioEnabled(!audioEnabled);
      }
    }
  };

  const applyRemoteStream = () => {
    if (remoteStreamRef.current && remoteAudioRef.current) {
      const audio = remoteAudioRef.current;
      if (audio.srcObject !== remoteStreamRef.current) {
        audio.srcObject = remoteStreamRef.current;
      }
      audio.play?.().catch((err) => {
        if (err?.name !== 'AbortError') {
          console.error('Remote play error', err);
        }
      });
    }
  };

  const resetForRequeue = (message = '') => {
    setIsConnected(false);
    setIsWaiting(true);
    setWaitingMessage(message);
    setMessages([]);
    setReplyingTo(null);
    setFunToken(0);
    setPendingFunRequest(null);
    setAcceptedFunGame(null);
    setChessState(createInitialState());
    setAudioEnabled(true);
    setError('');
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => t.enabled = true);
    }
    cleanupPeer();
    triggerRemoteBuffer(true);
    setTimeout(() => {
      socketService.send({ type: 'join', mode: 'audio' });
      console.log('[socket] 🔄 rejoining AUDIO queue');
    }, 100);
  };

  const sendMusicControl = (payload) => {
    const peer = peerConnectionRef.current;
    if (!peer || typeof peer.send !== 'function') return;
    try {
      peer.send(JSON.stringify({
        type: 'music-control',
        ...payload,
        sentAt: Date.now(),
      }));
    } catch (e) {
      console.error('Music control send error', e);
    }
  };

  const applyMusicStateToAudio = (trackUrl, isPlaying, positionSeconds) => {
    const audio = musicAudioRef.current;
    if (!audio) return;
    if (trackUrl && audio.src !== trackUrl) {
      audio.src = trackUrl;
    }
    if (!Number.isNaN(positionSeconds) && isFinite(positionSeconds)) {
      try {
        audio.currentTime = Math.max(0, positionSeconds);
      } catch (_) {}
    }
    if (isPlaying) {
      audio.play?.().catch(err => console.error('Music play error', err));
    } else {
      audio.pause?.();
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds || !Number.isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleIncomingMusicControl = (msg) => {
    const { action, trackUrl: incomingUrl, position, sentAt, title, artist, artwork, lyrics, duration } = msg;
    if (action === 'change-track') {
      const pos = typeof position === 'number' ? position : 0;
      setMusicTrackUrl(incomingUrl || '');
      setMusicTrackTitle(title || '');
      setMusicTrackArtist(artist || '');
      setMusicTrackArtwork(artwork || '');
      setMusicTrackLyrics(lyrics || '');
      const safeDuration = typeof duration === 'number' ? duration : 0;
      setMusicTrackDuration(safeDuration);
      if (safeDuration > 0) {
        setMusicDuration(safeDuration);
      }
      setMusicIsPlaying(true);
      setMusicPosition(pos);
      const effectivePos = sentAt ? pos + (Date.now() - sentAt) / 1000 : pos;
      applyMusicStateToAudio(incomingUrl || '', true, effectivePos);
      return;
    }
    if (action === 'play') {
      const pos = typeof position === 'number' ? position : musicPosition;
      setMusicIsPlaying(true);
      setMusicPosition(pos);
      const effectivePos = sentAt ? pos + (Date.now() - sentAt) / 1000 : pos;
      applyMusicStateToAudio(musicTrackUrl, true, effectivePos);
      return;
    }
    if (action === 'pause') {
      const pos = typeof position === 'number' ? position : musicPosition;
      setMusicIsPlaying(false);
      setMusicPosition(pos);
      applyMusicStateToAudio(musicTrackUrl, false, pos);
      return;
    }
    if (action === 'seek') {
      const pos = typeof position === 'number' ? position : musicPosition;
      // Treat seek as an authoritative jump to a specific timestamp, without
      // latency compensation, to avoid overshooting when skipping or dragging.
      setMusicPosition(pos);
      applyMusicStateToAudio(musicTrackUrl, musicIsPlaying, pos);
    }
  };

  useEffect(() => {
    const audio = musicAudioRef.current;
    // Only attach listeners when listen-along is active and the <audio> exists
    if (!audio || acceptedFunGame !== 'listen-along') return;

    const handleTimeUpdate = () => {
      setMusicPosition(audio.currentTime || 0);
      if (!Number.isNaN(audio.duration) && isFinite(audio.duration)) {
        setMusicDuration(audio.duration);
      }
    };

    const handleLoadedMetadata = () => {
      if (!Number.isNaN(audio.duration) && isFinite(audio.duration)) {
        setMusicDuration(audio.duration);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [acceptedFunGame, musicTrackUrl]);

  const JIOSAAVN_API_BASE = 'https://saavnapi-nine.vercel.app/result/?query=';

  const loadSaavnTrack = async () => {
    const query = saavnQuery.trim();
    if (!query) return;
    try {
      setIsLoadingTrack(true);
      // Stop any existing track cleanly before loading a new one
      const existingAudio = musicAudioRef.current;
      if (existingAudio) {
        try {
          existingAudio.pause();
          existingAudio.currentTime = 0;
        } catch (_) {}
      }
      const resp = await fetch(`${JIOSAAVN_API_BASE}${encodeURIComponent(query)}&lyrics=true`);
      const data = await resp.json().catch(() => null);
      const first = Array.isArray(data) ? data[0] : data;
      if (!first || !(first.media_url || first.url)) {
        console.error('JioSaavn API: no playable link', data);
        return;
      }
      const streamUrl = first.media_url || first.url;
      const title = first.song || first.title || '';
      const artist = first.singers || first.music || '';
      const artwork = first.image || first.image_url || '';
      const lyrics = first.lyrics || '';
      const duration = parseInt(first.duration, 10) || 0;
      setMusicTrackUrl(streamUrl);
      setMusicTrackTitle(title);
      setMusicTrackArtist(artist);
      setMusicTrackArtwork(artwork);
      setMusicTrackLyrics(lyrics);
      setMusicTrackDuration(duration);
      setMusicDuration(duration);
      setMusicIsPlaying(true);
      setMusicPosition(0);
      applyMusicStateToAudio(streamUrl, true, 0);
      sendMusicControl({
        action: 'change-track',
        trackUrl: streamUrl,
        title,
        artist,
        artwork,
        lyrics,
        duration,
        position: 0,
      });
    } catch (e) {
      console.error('JioSaavn API error', e);
    } finally {
      setIsLoadingTrack(false);
    }
  };

  const startNewChat = async () => {
    try {
      setIsConnected(false);
      setIsWaiting(false);
      setWaitingMessage('');
      setError('');
      setIsStarted(false);

      const ok = await startAudio();
      if (!ok) {
        setIsStarted(false);
        return;
      }

      const socket = await socketService.connect().catch(() => null);
      if (!socket) {
        setError('Unable to connect to server. Please try again.');
        setIsStarted(false);
        return;
      }

      setIsStarted(true);
      setIsWaiting(true);
      setWaitingMessage('Looking for a partner...');
      triggerRemoteBuffer(true);
      socketService.send({ type: 'join', mode: 'audio' });
    } catch (err) {
      setError('Failed to start chat. Please try again.');
      console.error('Error starting chat:', err);
      setIsStarted(false);
    }
  };

  const stopChat = () => {
    if (isStarted) {
      socketService.send({ type: 'leave' });
    }
    
    setIsConnected(false);
    setIsWaiting(false);
    setWaitingMessage('');
    setIsStarted(false);
    setFunToken(0);
    setPendingFunRequest(null);
    setAcceptedFunGame(null);
    setChessState(createInitialState());
    setError('');
    setMessages([]);
    setReplyingTo(null);
    
    cleanupPeer();
    cleanupStreams();
    socketService.disconnect();
    partnerIdRef.current = null;
  };

  const cancelSearch = () => {
    if (isWaiting && !isConnected) {
      socketService.send({ type: 'cancel' });
      setIsWaiting(false);
      setWaitingMessage('');
      setShowRemoteBuffer(false);
    }
  };

  const handleChessMove = (move) => {
    const next = applyChessMove(chessState, move);
    if (!next) return;
    setChessState(next);
    const peer = peerConnectionRef.current;
    if (peer && typeof peer.send === 'function') {
      try {
        peer.send(JSON.stringify({ type: 'chess-move', from: move.from, to: move.to, promotion: move.promotion || undefined }));
      } catch (e) {
        console.error('Chess send error', e);
      }
    }
  };

  const exitFun = () => {
    socketService.send({ type: 'fun-exit' });
    setFunToken(0);
    setAcceptedFunGame(null);
    setChessState(createInitialState());
    setShowFunMenu(false);
    setShowPlayAlongSubmenu(false);
  };

  const skipPartner = async () => {
    if (!isStarted) return;
    
    cleanupPeer();
    setIsConnected(false);
    setIsWaiting(true);
    setWaitingMessage('');
    setMessages([]);
    setReplyingTo(null);
    setFunToken(0);
    setAcceptedFunGame(null);
    setChessState(createInitialState());
    setError('');
    triggerRemoteBuffer(true);
    setAudioEnabled(true);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => t.enabled = true);
    }
    
    const socket = socketService.getSocket() || await socketService.connect().catch(() => null);
    if (socket) {
      socketService.send({ type: 'skip' });
      setTimeout(() => {
        socketService.send({ type: 'join', mode: 'audio' });
        console.log('[socket] ⏭️ skipped + rejoining AUDIO queue');
      }, 100);
    } else {
      setError('Unable to reconnect. Please restart.');
      setIsStarted(false);
      setIsWaiting(false);
      setShowRemoteBuffer(false);
    }
  };

  const scrollToBottom = () => {
    if (window.innerWidth <= 768 && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!showFunMenu) return;
    const handleClickOutside = (e) => {
      const inDesktop = funMenuRef.current && funMenuRef.current.contains(e.target);
      const inMobile = funMenuMobileRef.current && funMenuMobileRef.current.contains(e.target);
      if (!inDesktop && !inMobile) setShowFunMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showFunMenu]);

  const sendMessage = () => {
    const trimmed = newMessage.trim();
    if (!trimmed) return;

    try {
      if (peerConnectionRef.current) {
        const encoder = new TextEncoder();
        peerConnectionRef.current.send(encoder.encode(trimmed));
      }
    } catch (err) {
      console.error('Data channel send failed', err);
    }

    const message = {
      id: Date.now(),
      text: trimmed,
      isOwn: true,
      timestamp: new Date(),
      replyTo: replyingTo ? {
        id: replyingTo.id,
        text: replyingTo.text,
        isOwn: replyingTo.isOwn
      } : null
    };
    setMessages(prev => [...prev, message]);
    setNewMessage('');
    setReplyingTo(null);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  const toggleEmojiPicker = () => setShowEmojiPicker(!showEmojiPicker);
  const addEmoji = (emoji) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Position chat box above keyboard on mobile using visual viewport (keeps input attached to keyboard)
  const MOBILE_CHAT_HEIGHT = 200;
  useEffect(() => {
    const updateMobileChatPosition = () => {
      if (window.innerWidth > 768) return;
      if (window.visualViewport) {
        const vv = window.visualViewport;
        const top = vv.offsetTop + vv.height - MOBILE_CHAT_HEIGHT;
        setMobileChatTop(top);
        const kh = window.innerHeight - vv.height;
        setKeyboardHeight(kh > 0 ? kh : 0);
      } else {
        setMobileChatTop(window.innerHeight - MOBILE_CHAT_HEIGHT);
        setKeyboardHeight(0);
      }
    };
    if (window.visualViewport) {
      updateMobileChatPosition();
      window.visualViewport.addEventListener('resize', updateMobileChatPosition);
      window.visualViewport.addEventListener('scroll', updateMobileChatPosition);
    } else {
      window.addEventListener('resize', updateMobileChatPosition);
    }
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateMobileChatPosition);
        window.visualViewport.removeEventListener('scroll', updateMobileChatPosition);
      } else {
        window.removeEventListener('resize', updateMobileChatPosition);
      }
    };
  }, []);

  const replyToMessage = (message) => {
    setReplyingTo(message);
    setShowEmojiPicker(false);
  };
  const cancelReply = () => setReplyingTo(null);

  // Ensure remote audio attaches when stream arrives or element mounts
  useEffect(() => {
    applyRemoteStream();
    const audioElement = remoteAudioRef.current;
    if (audioElement) {
      const handler = () => applyRemoteStream();
      audioElement.addEventListener('loadedmetadata', handler);
      return () => audioElement.removeEventListener('loadedmetadata', handler);
    }
  }, [isConnected]);

  // Waiting message timeout
  useEffect(() => {
    let timer;
    if (isWaiting && !isConnected) {
      timer = setTimeout(() => {
        setWaitingMessage('Still looking for a partner...');
      }, 8000);
    } else {
      setWaitingMessage('');
    }
    return () => timer && clearTimeout(timer);
  }, [isWaiting, isConnected]);

  useEffect(() => {
    // Clean up on component unmount
    return () => {
      if (isStarted) {
        socketService.send({ type: 'leave' });
      }
      cleanupPeer();
      cleanupStreams();
      socketService.disconnect();
    };
  }, []);

  // Setup socket event listeners
  useEffect(() => {
    if (!isStarted) return;

    const handleMatch = async (data) => {
      setMessages([]);
      setReplyingTo(null);
      partnerIdRef.current = data.partnerId;
      setWaitingMessage('Found partner! Connecting...');
      triggerRemoteBuffer(false);
      connectionStartTimeRef.current = Date.now();
      establishmentRecordedRef.current = false;

      console.log('[ws] 🎯 matched with', data.partnerId);

      if (!localStreamRef.current) {
        setError('Microphone not ready.');
        return;
      }

      socketService.send({ type: 'acknowledge' });
      await setupWebRTC(data.initiator);
    };

    const handleSessionReady = () => setWaitingMessage('Connected!');
    const handleSearchCancelled = () => {
      setIsWaiting(false);
      setWaitingMessage('');
      setShowRemoteBuffer(false);
    };

    const handleSignal = (data) => {
      triggerRemoteBuffer();
      handleWebRTCSignal({ signal: data.data });
    };

    const handlePartnerLeft = () => resetForRequeue('Partner disconnected. Rejoining queue...');
    const handlePartnerSkipped = () => resetForRequeue('Partner skipped. Rejoining queue...');

    const handleQueue = (data) => {
      setIsWaiting(true);
      setIsConnected(false);
      const position = data.position || 1;
      setWaitingMessage(position === 1 ? 'Looking for a partner...' : `In queue (position ${position})`);
      triggerRemoteBuffer(true);
    };

    const handleError = (error) => {
      const msg = error.message || error?.data || '';
      if (!msg.toLowerCase().includes('already in session') && !msg.toLowerCase().includes('already searching')) {
        console.error('WS error:', error);
      }
    };

    const handleFunRequest = (msg) => {
      setPendingFunRequest({ game: msg.game || 'chess' });
      setShowFunMenu(false);
      setShowPlayAlongSubmenu(false);
    };
    const handleFunAccept = (msg) => {
      const game = msg?.game || 'chess';
      setFunToken(1);
      setAcceptedFunGame(game);
      if (game === 'chess') {
        setAmIWhite(true);
        setChessState(createInitialState());
      }
      if (game === 'listen-along') {
        setIsMusicHost(true);
      }
      setShowFunMenu(false);
      setShowPlayAlongSubmenu(false);
    };
    const handleFunExit = () => {
      setFunToken(0);
      setAcceptedFunGame(null);
      setChessState(createInitialState());
      setIsMusicHost(false);
      setShowFunMenu(false);
      setShowPlayAlongSubmenu(false);
    };
    const handleFunReject = () => {
      setPendingFunRequest(null);
    };

    socketService.on('matched', handleMatch);
    socketService.on('fun-request', handleFunRequest);
    socketService.on('fun-accept', handleFunAccept);
    socketService.on('fun-reject', handleFunReject);
    socketService.on('fun-exit', handleFunExit);
    socketService.on('signal', handleSignal);
    socketService.on('partner-left', handlePartnerLeft);
    socketService.on('partner-skipped', handlePartnerSkipped);
    socketService.on('queue', handleQueue);
    socketService.on('session-ready', handleSessionReady);
    socketService.on('search-cancelled', handleSearchCancelled);
    socketService.on('error', handleError);

    return () => {
      socketService.off('matched', handleMatch);
      socketService.off('signal', handleSignal);
      socketService.off('partner-left', handlePartnerLeft);
      socketService.off('partner-skipped', handlePartnerSkipped);
      socketService.off('queue', handleQueue);
      socketService.off('session-ready', handleSessionReady);
      socketService.off('search-cancelled', handleSearchCancelled);
      socketService.off('error', handleError);
      socketService.off('fun-request', handleFunRequest);
      socketService.off('fun-accept', handleFunAccept);
      socketService.off('fun-reject', handleFunReject);
      socketService.off('fun-exit', handleFunExit);
    };
  }, [isStarted]);

  const funGameLabel = { chess: 'Chess', 'truth-and-dare': 'Truth and Dare' }[pendingFunRequest?.game] || pendingFunRequest?.game || '';

  return (
    <AudioChatContainer>
      {pendingFunRequest && (
        <FunRequestOverlay>
          <FunRequestCard>
            <FunRequestText>
              Stranger wants to play <strong>{funGameLabel}</strong>. Accept or reject?
            </FunRequestText>
            <FunRequestActions>
              <StopButton
                onClick={() => {
                  socketService.send({ type: 'fun-reject' });
                  setPendingFunRequest(null);
                }}
                style={{ background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)', border: 'none' }}
              >
                Reject
              </StopButton>
              <StartChatButton
                onClick={() => {
                  socketService.send({ type: 'fun-accept', game: pendingFunRequest.game });
                  setFunToken(1);
                  setAcceptedFunGame(pendingFunRequest.game);
                  if (pendingFunRequest.game === 'chess') {
                    setAmIWhite(false);
                    setChessState(createInitialState());
                  }
                  if (pendingFunRequest.game === 'listen-along') {
                    setIsMusicHost(false);
                  }
                  setPendingFunRequest(null);
                }}
              >
                Accept
              </StartChatButton>
            </FunRequestActions>
          </FunRequestCard>
        </FunRequestOverlay>
      )}
      <Header logo="Unitalks" hasSidebar={false} />
      
      <MainContent>
        <AudioSection>
          <AudioFeedsContainer>
            {/* Hidden Audio Element for playing remote sound */}
            <HiddenAudioElement ref={remoteAudioRef} autoPlay />

            {/* Remote Audio Visualizer */}
            <AudioFeed>
              {isConnected && remoteStreamForVisualizer ? (
                <AudioVisualizer stream={remoteStreamForVisualizer} isLocal={false} />
              ) : (
                <AudioPlaceholder style={{ position: 'absolute', inset: 0 }}>
                  <FiUsers />
                  <div>Stranger</div>
                </AudioPlaceholder>
              )}
              {showRemoteBuffer && (
                <RemoteBufferOverlay>
                  <BufferSpinner />
                </RemoteBufferOverlay>
              )}
              <AudioLabel>Stranger</AudioLabel>
              <Watermark>
                <WatermarkLogo src="/assets/logos/logo.png" alt="UniTalks Logo" />
                <WatermarkText>UniTalks</WatermarkText>
              </Watermark>
            </AudioFeed>
            
            {/* Local Audio Visualizer */}
            <AudioFeed>
              {hasLocalStream && localStreamRef.current ? (
                <AudioVisualizer stream={localStreamRef.current} isLocal={true} />
              ) : (
                <AudioPlaceholder>
                  <FiMic />
                  <div>Your Mic</div>
                </AudioPlaceholder>
              )}
              <AudioOverlayButton
                onClick={toggleAudio}
                className={audioEnabled ? 'active' : ''}
                title={audioEnabled ? 'Mute microphone' : 'Unmute microphone'}
              >
                {audioEnabled ? <FiMic /> : <FiMicOff />}
              </AudioOverlayButton>
              <MobileAudioControls>
                <MobileControlButton
                  onClick={skipPartner}
                  className="skip"
                  title="Skip to next stranger"
                  disabled={!isStarted || (isWaiting && !isConnected)}
                  style={{ opacity: isStarted && (!isWaiting || isConnected) ? 1 : 0.5, cursor: isStarted && (!isWaiting || isConnected) ? 'pointer' : 'not-allowed' }}
                >
                  SKIP
                </MobileControlButton>
                {funToken !== 1 && (
                  <MobileControlButton
                    onClick={isStarted ? stopChat : startNewChat}
                    className={isStarted ? 'stop' : 'start'}
                    title={isStarted ? "Stop chat" : "Start new chat"}
                  >
                    {isStarted ? 'STOP' : 'START'}
                  </MobileControlButton>
                )}
                {funToken === 1 && (
                  <MobileControlButton
                    onClick={exitFun}
                    title="Exit fun game"
                    style={{ marginLeft: 4, borderColor: 'rgba(239,68,68,0.7)', background: 'rgba(239,68,68,0.2)', color: '#f87171' }}
                  >
                    EXIT FUN
                  </MobileControlButton>
                )}
              </MobileAudioControls>
            </AudioFeed>
          </AudioFeedsContainer>
          
          <ChatSection>
            {error && !error.includes('already in session') && !error.includes('Already searching') && <ErrorMessage>{error}</ErrorMessage>}
            {(acceptedFunGame === 'chess' || acceptedFunGame === 'listen-along') && (
              <ChessArea>
                {acceptedFunGame === 'chess' && (
                  <ChessBoard
                    state={chessState}
                    amIWhite={amIWhite}
                    onMove={handleChessMove}
                    disabled={!!chessState.gameOver || (chessState.turn === 'white' && !amIWhite) || (chessState.turn === 'black' && amIWhite)}
                  />
                )}
                {acceptedFunGame === 'listen-along' && (
                  <MusicPlayerContainer>
                    {isMusicHost && (
                      <MusicSearchSection>
                        <MusicTrackInput
                          type="text"
                          placeholder="Search songs on JioSaavn..."
                          value={saavnQuery}
                          onChange={(e) => setSaavnQuery(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') loadSaavnTrack(); }}
                          disabled={isLoadingTrack}
                        />
                        <MusicStatusText>
                          {isLoadingTrack ? 'Loading track…' : 'Press Enter to search and play'}
                        </MusicStatusText>
                      </MusicSearchSection>
                    )}
                    {!isMusicHost && (
                      <MusicStatusText>
                        Your partner is controlling the music. You are listening along.
                      </MusicStatusText>
                    )}
                    {musicTrackTitle && (
                      <MusicPlayerMain>
                        <MusicArtworkSection>
                          {musicTrackArtwork && (
                            <MusicArtwork src={musicTrackArtwork} alt={musicTrackTitle} />
                          )}
                          <MusicInfoSection>
                            <MusicTitle>{musicTrackTitle}</MusicTitle>
                            <MusicArtist>{musicTrackArtist || 'Unknown Artist'}</MusicArtist>
                            {musicTrackDuration > 0 && (
                              <MusicDurationText>Duration: {formatDuration(musicTrackDuration)}</MusicDurationText>
                            )}
                          </MusicInfoSection>
                        </MusicArtworkSection>
                        <MusicProgressSection>
                          <MusicEqualizer>
                            <MusicEqualizerBar $isPlaying={musicIsPlaying} $delay={0} />
                            <MusicEqualizerBar $isPlaying={musicIsPlaying} $delay={120} />
                            <MusicEqualizerBar $isPlaying={musicIsPlaying} $delay={240} />
                            <MusicEqualizerBar $isPlaying={musicIsPlaying} $delay={360} />
                            <MusicEqualizerBar $isPlaying={musicIsPlaying} $delay={480} />
                          </MusicEqualizer>
                          <MusicProgressRow>
                            <MusicTimeText>{formatDuration(musicPosition)}</MusicTimeText>
                            <MusicProgressInput
                              type="range"
                              min={0}
                              max={musicDuration || musicTrackDuration || 0}
                              step={0.5}
                              value={Math.max(0, Math.min(musicPosition, musicDuration || musicTrackDuration || 0))}
                              onChange={(e) => {
                                const nextPos = parseFloat(e.target.value) || 0;
                                setMusicPosition(nextPos);
                              }}
                              onMouseUp={(e) => {
                                const nextPos = parseFloat(e.target.value) || 0;
                                if (!musicTrackUrl) return;
                                applyMusicStateToAudio(musicTrackUrl, musicIsPlaying, nextPos);
                                sendMusicControl({
                                  action: 'seek',
                                  trackUrl: musicTrackUrl,
                                  position: nextPos,
                                });
                              }}
                              onTouchEnd={(e) => {
                                const target = e.target;
                                const nextPos = parseFloat(target.value) || 0;
                                if (!musicTrackUrl) return;
                                applyMusicStateToAudio(musicTrackUrl, musicIsPlaying, nextPos);
                                sendMusicControl({
                                  action: 'seek',
                                  trackUrl: musicTrackUrl,
                                  position: nextPos,
                                });
                              }}
                            />
                            <MusicTimeText>{formatDuration(musicDuration || musicTrackDuration || 0)}</MusicTimeText>
                          </MusicProgressRow>
                        </MusicProgressSection>
                        <MusicControlsRow>
                          <MusicControlButton
                            disabled={!musicTrackUrl}
                            onClick={() => {
                              const audio = musicAudioRef.current;
                              if (!audio) return;
                              const nextPos = Math.max(0, audio.currentTime - 10);
                              setMusicPosition(nextPos);
                              applyMusicStateToAudio(musicTrackUrl, musicIsPlaying, nextPos);
                              sendMusicControl({
                                action: 'seek',
                                trackUrl: musicTrackUrl,
                                position: nextPos,
                              });
                            }}
                            title="Rewind 10s"
                          >
                            <FiSkipBack />
                          </MusicControlButton>
                          {musicIsPlaying ? (
                            <MusicControlButton
                              className="play-pause"
                              disabled={!musicTrackUrl}
                              onClick={() => {
                                const audio = musicAudioRef.current;
                                const current = audio ? audio.currentTime : 0;
                                setMusicIsPlaying(false);
                                setMusicPosition(current);
                                applyMusicStateToAudio(musicTrackUrl, false, current);
                                sendMusicControl({
                                  action: 'pause',
                                  trackUrl: musicTrackUrl,
                                  position: current,
                                });
                              }}
                              title="Pause"
                            >
                              <FiSquare />
                            </MusicControlButton>
                          ) : (
                            <MusicControlButton
                              className="play-pause"
                              disabled={!musicTrackUrl}
                              onClick={() => {
                                if (!musicTrackUrl) return;
                                const audio = musicAudioRef.current;
                                const current = audio ? audio.currentTime : 0;
                                setMusicIsPlaying(true);
                                setMusicPosition(current);
                                applyMusicStateToAudio(musicTrackUrl, true, current);
                                sendMusicControl({
                                  action: 'play',
                                  trackUrl: musicTrackUrl,
                                  position: current,
                                });
                              }}
                              title="Play"
                            >
                              <FiPlay />
                            </MusicControlButton>
                          )}
                          <MusicControlButton
                            disabled={!musicTrackUrl}
                            onClick={() => {
                              const audio = musicAudioRef.current;
                              if (!audio) return;
                              const nextPos = Math.min(audio.duration || audio.currentTime + 10, audio.currentTime + 10);
                              setMusicPosition(nextPos);
                              applyMusicStateToAudio(musicTrackUrl, musicIsPlaying, nextPos);
                              sendMusicControl({
                                action: 'seek',
                                trackUrl: musicTrackUrl,
                                position: nextPos,
                              });
                            }}
                            title="Forward 10s"
                          >
                            <FiSkipForward />
                          </MusicControlButton>
                        </MusicControlsRow>
                        {musicTrackLyrics && (
                          <MusicLyricsSection>
                            <MusicLyricsText>{musicTrackLyrics}</MusicLyricsText>
                          </MusicLyricsSection>
                        )}
                      </MusicPlayerMain>
                    )}
                    <audio ref={musicAudioRef} style={{ display: 'none' }} />
                  </MusicPlayerContainer>
                )}
              </ChessArea>
            )}
            {funToken !== 1 && (
            <ChatBox $keyboardHeight={keyboardHeight} $mobileChatTop={mobileChatTop} $chessMode={acceptedFunGame === 'chess'}>
              <ChatMessages>
                {messages.map((message) => (
                  <Message 
                    key={message.id} 
                    className={message.isOwn ? 'own' : 'other'}
                    onClick={() => replyToMessage(message)}
                  >
                    {message.replyTo && (
                      <ReplyIndicator>
                        <ReplyText>
                          Replying to {message.replyTo.isOwn ? 'yourself' : 'stranger'}
                        </ReplyText>
                        <ReplyContentSmall>
                          {message.replyTo.text}
                        </ReplyContentSmall>
                      </ReplyIndicator>
                    )}
                    {message.text}
                  </Message>
                ))}
                <div ref={messagesEndRef} />
              </ChatMessages>
              <ChatInput>
                {replyingTo && (
                  <ReplyPreview>
                    <ReplyText>
                      Replying to {replyingTo.isOwn ? 'yourself' : 'stranger'}
                    </ReplyText>
                    <ReplyContent>
                      {replyingTo.text}
                    </ReplyContent>
                    <ReplyCancel onClick={cancelReply}>
                      ✕
                    </ReplyCancel>
                  </ReplyPreview>
                )}
                <InputRow>
                  {isStarted && (
                    <MobileFunWrap>
                      <FunMenuWrap ref={funMenuMobileRef}>
                        {funToken === 1 ? (
                          <FunButtonSmall onClick={exitFun} title="Exit fun game" style={{ borderColor: 'rgba(239,68,68,0.7)', background: 'rgba(239,68,68,0.2)', color: '#f87171' }}>
                            EXIT FUN
                          </FunButtonSmall>
                        ) : (
                          <>
                        <FunButtonSmall
                          disabled={isWaiting && !isConnected}
                          onClick={() => { if (!(isWaiting && !isConnected)) setShowFunMenu((v) => !v); setShowPlayAlongSubmenu(false); }}
                          title="Fun features"
                        >
                          <ButtonIcon><FiZap /></ButtonIcon>
                          Fun
                        </FunButtonSmall>
                        {showFunMenu && (
                          <FunMenuPopover>
                            <FunMenuItem onClick={() => { setShowFunMenu(false); setShowPlayAlongSubmenu(false); }}>
                              <FiVideo size={18} /> Watch Along
                            </FunMenuItem>
                           <FunMenuItem onClick={() => { socketService.send({ type: 'fun-request', game: 'listen-along' }); setShowFunMenu(false); setShowPlayAlongSubmenu(false); }}>
                             <FiHeadphones size={18} /> Listen Along
                           </FunMenuItem>
                            <FunMenuItem onClick={() => setShowPlayAlongSubmenu((v) => !v)}>
                              <FiPlay size={18} /> Play Along
                            </FunMenuItem>
                            {showPlayAlongSubmenu && (
                              <FunSubmenu>
                                <FunMenuItem onClick={() => { socketService.send({ type: 'fun-request', game: 'chess' }); setShowFunMenu(false); setShowPlayAlongSubmenu(false); }}>Chess</FunMenuItem>
                                <FunMenuItem onClick={() => { socketService.send({ type: 'fun-request', game: 'truth-and-dare' }); setShowFunMenu(false); setShowPlayAlongSubmenu(false); }}>Truth and Dare</FunMenuItem>
                              </FunSubmenu>
                            )}
                          </FunMenuPopover>
                        )}
                            </>
                          )}
                      </FunMenuWrap>
                    </MobileFunWrap>
                  )}
                  <MessageInput
                    type="text"
                    placeholder={replyingTo ? "Type your reply..." : "Type a message..."}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <EmojiButton onClick={toggleEmojiPicker}>
                    <FiSmile />
                  </EmojiButton>
                  <SendButton onClick={sendMessage}>
                    <FiSend />
                  </SendButton>
                </InputRow>
                {showEmojiPicker && (
                  <EmojiPicker>
                    {['😀', '😂', '😍', '🥰', '😎', '🤔', '😢', '😡', '👍', '👎', '❤️', '🔥', '🎉', '💯', '👏', '🙌', '😊', '😘', '🤗', '😴', '🤤', '😋', '🥳', '😇', '😮', '😯', '😲', '😳', '😵', '😶', '😷', '🤒'].map((emoji) => (
                      <EmojiItem key={emoji} onClick={() => addEmoji(emoji)}>
                        {emoji}
                      </EmojiItem>
                    ))}
                  </EmojiPicker>
                )}
              </ChatInput>
            </ChatBox>
            )}
             
            <BottomControlsSection>
              <ChatControls>
                {!isStarted ? (
                  <ChatControlsStartRight>
                    <StartChatButton onClick={startNewChat} title="Start chat">
                      Start Chat
                    </StartChatButton>
                  </ChatControlsStartRight>
                ) : (
                  <>
                    <FunMenuWrap ref={funMenuRef}>
                      {funToken === 1 ? (
                        <FunButton onClick={exitFun} title="Exit fun game" style={{ borderColor: 'rgba(239,68,68,0.7)', background: 'rgba(239,68,68,0.2)', color: '#f87171' }}>
                          EXIT FUN
                        </FunButton>
                      ) : (
                        <>
                      <FunButton
                        disabled={isWaiting && !isConnected}
                        onClick={() => { if (!(isWaiting && !isConnected)) setShowFunMenu((v) => !v); setShowPlayAlongSubmenu(false); }}
                        title="Fun features"
                      >
                        <ButtonIcon><FiZap /></ButtonIcon>
                        Fun
                      </FunButton>
                      {showFunMenu && (
                        <FunMenuPopover>
                          <FunMenuItem onClick={() => { setShowFunMenu(false); setShowPlayAlongSubmenu(false); }}>
                            <FiVideo size={18} /> Watch Along
                          </FunMenuItem>
                          <FunMenuItem onClick={() => { socketService.send({ type: 'fun-request', game: 'listen-along' }); setShowFunMenu(false); setShowPlayAlongSubmenu(false); }}>
                            <FiHeadphones size={18} /> Listen Along
                          </FunMenuItem>
                          <FunMenuItem onClick={() => setShowPlayAlongSubmenu((v) => !v)}>
                            <FiPlay size={18} /> Play Along
                          </FunMenuItem>
                          {showPlayAlongSubmenu && (
                            <FunSubmenu>
                              <FunMenuItem onClick={() => { socketService.send({ type: 'fun-request', game: 'chess' }); setShowFunMenu(false); setShowPlayAlongSubmenu(false); }}>Chess</FunMenuItem>
                              <FunMenuItem onClick={() => { socketService.send({ type: 'fun-request', game: 'truth-and-dare' }); setShowFunMenu(false); setShowPlayAlongSubmenu(false); }}>Truth and Dare</FunMenuItem>
                            </FunSubmenu>
                          )}
                        </FunMenuPopover>
                      )}
                        </>
                      )}
                    </FunMenuWrap>
                    <ChatControlsRight>
                      <StopButton
                        onClick={isWaiting && !isConnected ? cancelSearch : stopChat}
                        title={isWaiting && !isConnected ? "Cancel search" : "Stop chat"}
                      >
                        Stop
                      </StopButton>
                      <SkipButton
                        onClick={skipPartner}
                        title="Skip to next stranger"
                        disabled={!isStarted || (isWaiting && !isConnected)}
                      >
                        Skip
                      </SkipButton>
                    </ChatControlsRight>
                  </>
                )}
              </ChatControls>
            </BottomControlsSection>
          </ChatSection>
        </AudioSection>
      </MainContent>
    </AudioChatContainer>
  );
}

export default AudioChat;
