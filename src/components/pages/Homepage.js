import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { Link } from 'react-router-dom';
import ReportBugModal from '../ui/ReportBugModal';
import { FiArrowRight, FiZap, FiMessageCircle, FiMic, FiVideo, FiAlertTriangle } from 'react-icons/fi';
import UniversalHamburger from '../ui/UniversalHamburger';
import Footer from '../layout/Footer';

const Page = styled.div`
  min-height: 100vh;
  width: 100%;
  background: ${({ theme }) => theme.colors.appBg};
  color: #fff;
  overflow-x: hidden;
  position: relative;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: 
      radial-gradient(60% 80% at 50% 20%, rgba(29,185,84,0.08) 0%, rgba(0,0,0,0) 60%),
      radial-gradient(600px 300px at 50% 10%, rgba(29,185,84,0.05), rgba(0,0,0,0) 60%);
    pointer-events: none;
  }
`;

const TopNav = styled.nav`
  position: fixed;
  top: 0; left: 0; right: 0;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  backdrop-filter: blur(10px);
  background: rgba(0,0,0,0.5);
  border-bottom: 1px solid rgba(255,255,255,0.06);
`;

const NavInner = styled.div`
  width: 100%;
  max-width: 1200px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Brand = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: #fff;
  font-weight: 900;
  letter-spacing: 0.5px;
  img { height: 56px; width: 56px; border-radius: 12px; }
  @media (max-width: 720px) {
    img { height: 44px; width: 44px; border-radius: 10px; }
  }
`;

const BrandText = styled.span`
  color: #ffffff;
  font-family: 'Press Start 2P', cursive, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  font-size: 22px;
  line-height: 1;
  letter-spacing: 0.5px;
  @media (max-width: 720px) { font-size: 18px; }
`;

const NavCtas = styled.div`
  display: inline-flex;
  gap: 10px;
  align-items: center;
`;

const ReportPillButton = styled.button`
  margin-left: 0;
  padding: 6px 10px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.spotifyGreen};
  background: ${({ theme }) => `rgba(29,185,84,0.12)`};
  border: 1px solid ${({ theme }) => `rgba(29,185,84,0.35)`};
  cursor: pointer;
  transition: border-color 0.2s, transform 0.15s;
  &:hover { border-color: rgba(29,185,84,0.65); transform: translateY(-1px); }
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const GhostLink = styled(Link)`
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.12);
  text-decoration: none;
  color: #fff;
  font-weight: 700;
  background: rgba(0,0,0,0.5);
  transition: transform .2s, box-shadow .2s, border-color .2s;
  &:hover { transform: translateY(-1px); border-color: rgba(29,185,84,.6); box-shadow: 0 10px 24px rgba(29,185,84,.18); }
  ${({ $hero }) => $hero && `
    padding: 26px 28px;
    font-size: 1.15rem;
    background: rgba(255,255,255,0.06);
    border: 2px solid rgba(255,255,255,0.22);
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06), 0 6px 18px rgba(0,0,0,0.35);
  `}
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const PrimaryLink = styled(Link)`
  padding: 12px 20px;
  border-radius: 999px;
  text-decoration: none;
  color: #0b0b0f;
  font-weight: 900;
  background: linear-gradient(135deg, #1DB954, #19a64c);
  box-shadow: 0 0 0 2px rgba(29,185,84,.25), 0 12px 28px rgba(29,185,84,.25);
  border: 1px solid rgba(29,185,84,.9);
  transition: transform .2s, box-shadow .2s;
  &:hover { transform: translateY(-1px); box-shadow: 0 0 0 4px rgba(29,185,84,.18), 0 16px 34px rgba(29,185,84,.35); }
  ${({ $hero }) => $hero && `
    font-size: 2rem;
    padding: 24px 44px;
    animation: glowPulse 2.8s ease-in-out infinite;
  `}
  @keyframes glowPulse {
    0% { box-shadow: 0 0 0 2px rgba(29,185,84,.25), 0 12px 28px rgba(29,185,84,.25); }
    50% { box-shadow: 0 0 0 8px rgba(29,185,84,.05), 0 18px 40px rgba(29,185,84,.35); }
    100% { box-shadow: 0 0 0 2px rgba(29,185,84,.25), 0 12px 28px rgba(29,185,84,.25); }
  }
`;

const float = keyframes`
  0% { transform: translateY(0) }
  50% { transform: translateY(-8px) }
  100% { transform: translateY(0) }
`;

const ticker = keyframes`
  0% { transform: translateX(0); }
  100% { transform: translateX(-100%); }
`;

const Aurora = styled.div`
  position: absolute; inset: -20% -10% -10% -10%;
  pointer-events: none;
  z-index: 0;
  &::before, &::after {
    content: '';
    position: absolute;
    width: 60vw; height: 60vw;
    background: radial-gradient(50% 50% at 50% 50%, rgba(29,185,84,.25) 0%, rgba(29,185,84,0) 70%);
    filter: blur(40px);
    border-radius: 50%;
    animation: ${float} 9s ease-in-out infinite;
  }
  &::before { top: 0; left: -10vw; animation-delay: .2s }
  &::after { bottom: -10vh; right: -10vw; animation-delay: .9s }
`;

const Hero = styled.section`
  position: relative;
  padding: 140px 20px 60px;
  display: grid;
  grid-template-columns: 1.1fr .9fr;
  gap: 32px;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  z-index: 1;
  @media (max-width: 960px) { grid-template-columns: 1fr; padding-top: 120px; }
`;

const Headline = styled.h1`
  font-size: clamp(2.3rem, 5vw, 4rem);
  line-height: 1.05;
  font-weight: 900;
  letter-spacing: -0.5px;
  margin: 0 0 14px;
  background: linear-gradient(135deg, #1DB954 0%, #19a64c 60%, #8ef1b8 100%);
  -webkit-background-clip: text; background-clip: text; color: transparent;
`;

const Funky = styled.span`
  display: inline-block;
  transform: rotate(-2deg);
  padding: 2px 10px;
  background: rgba(29,185,84,.12);
  border: 1px solid rgba(29,185,84,.35);
  border-radius: 10px;
  color: #1DB954;
  -webkit-text-fill-color: #1DB954;
  font-weight: 900;
`;

const Sub = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: clamp(1rem, 1.7vw, 1.2rem);
  line-height: 1.7;
  margin: 0 0 18px;
`;

const Kicker = styled.div`
  display: inline-flex; align-items: center; gap: 8px; margin-bottom: 10px;
  color: #8ef1b8; font-weight: 800; letter-spacing: .4px; text-transform: uppercase; font-size: .9rem;
  background: rgba(29,185,84,.12); border: 1px solid rgba(29,185,84,.35); padding: 6px 10px; border-radius: 999px;
`;

const CTAGroup = styled.div`
  display: inline-flex; gap: 12px; flex-wrap: wrap; margin: 6px 0 16px;
`;

const Mock = styled.div`
  position: relative;
  width: 100%;
  height: 440px;
  border-radius: 24px;
  border: 1px solid rgba(255,255,255,.06);
  background: linear-gradient(180deg, rgba(0,0,0,.8), rgba(18,18,18,.95));
  box-shadow: 0 30px 80px rgba(0,0,0,.45), inset 0 0 0 1px rgba(255,255,255,.03);
  overflow: hidden;
  @media (max-width: 960px) { height: 360px; }
  @media (max-width: 768px) { height: 400px; }
`;

const MockStrip = styled.div`
  position: absolute; bottom: 0; left: 0; right: 0;
  padding: 16px; display: flex; align-items: center; gap: 10px; justify-content: center;
  background: linear-gradient(180deg, rgba(0,0,0,.2), rgba(0,0,0,.65));
  border-top: 1px solid rgba(255,255,255,.06);
`;

const TickerContainer = styled.div`
  position: absolute;
  left: 0; right: 0; bottom: 56px;
  height: 34px;
  overflow: hidden;
  display: flex;
  align-items: center;
  pointer-events: none; /* allow clicks through except for explicit buttons */
  
  @media (max-width: 768px) {
    bottom: 40px;
  }
`;

const TickerTrack = styled.div`
  display: inline-flex;
  gap: 40px;
  white-space: nowrap;
  will-change: transform;
  animation: ${ticker} 12s linear infinite; /* start immediately and move faster */
  position: relative;
  z-index: 2;
`;

const TickerText = styled.span`
  display: inline-block;
  transform: rotate(-2deg);
  padding: 4px 12px;
  background: rgba(29,185,84,.12);
  border: 1px solid rgba(29,185,84,.35);
  border-radius: 10px;
  color: #1DB954;
  -webkit-text-fill-color: #1DB954;
  font-weight: 900;
  font-size: 1rem;
`;

const TickerButton = styled.button`
  margin-left: 10px;
  padding: 4px 10px;
  border-radius: 999px;
  font-weight: 800;
  font-size: 0.9rem;
  color: #1DB954;
  background: rgba(29,185,84,.12);
  border: 1px solid rgba(29,185,84,.35);
  cursor: pointer;
  pointer-events: auto; /* enable click */
`;

const TickerLine = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
`;

const RunnerSvg = styled.svg`
  position: absolute;
  left: -34px; /* appears just behind the text block */
  bottom: 2px;
  width: 24px;
  height: 24px;
  stroke: #fff;
  fill: none;
  stroke-width: 2.2px;
  stroke-linecap: round;
  stroke-linejoin: round;
  filter: drop-shadow(0 0 6px rgba(255,255,255,.6));
  z-index: 1;

  .poseA { animation: gait 0.45s steps(1) infinite; }
  .poseB { animation: gait 0.45s steps(1) infinite reverse; }

  @keyframes gait { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
`;

const Dot = styled.span`
  display: inline-block; width: 8px; height: 8px; border-radius: 999px; background: #1DB954; box-shadow: 0 0 12px rgba(29,185,84,.6);
`;

const FeatureGrid = styled.section`
  width: 100%; max-width: 1200px; margin: 28px auto 40px; padding: 0 20px;
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;
  @media (max-width: 900px) { grid-template-columns: 1fr; }
`;

const Card = styled(Link)`
  text-decoration: none; color: #fff;
  background: rgba(0,0,0,.55);
  border: 1px solid rgba(29,185,84,.28);
  border-radius: 16px; padding: 18px; display: flex; gap: 12px; align-items: center;
  box-shadow: 0 12px 30px rgba(0,0,0,.35);
  transition: transform .2s, box-shadow .2s, border-color .2s;
  &:hover { transform: translateY(-4px); box-shadow: 0 18px 40px rgba(29,185,84,.12); border-color: rgba(29,185,84,.6); }
`;

const IconWrap = styled.div`
  width: 46px; height: 46px; border-radius: 12px; display: grid; place-items: center;
  background: radial-gradient(100% 100% at 50% 0%, rgba(29,185,84,.45), rgba(0,0,0,.9));
  border: 1px solid rgba(29,185,84,.5);
`;

const CardText = styled.div`
  display: flex; flex-direction: column; gap: 4px;
  h3 { margin: 0; font-size: 1.1rem; }
  p { margin: 0; color: #B3B3B3; line-height: 1.5; font-size: .95rem; }
`;

const MobileReportButton = styled.button`
  display: none;
  
  @media (max-width: 768px) {
    display: flex;
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: linear-gradient(135deg, #1DB954 0%, #19a64c 100%);
    border: none;
    color: white;
    font-size: 1.2rem;
    cursor: pointer;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(29, 185, 84, 0.3);
    z-index: 1000;
    transition: all 0.2s ease;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(29, 185, 84, 0.4);
    }
    
    &:active {
      transform: translateY(0);
    }
  }
`;

function Homepage() {
  const [bugOpen, setBugOpen] = useState(false);
  
  return (
    <Page>
      <Aurora />
      <TopNav>
        <NavInner>
          <Brand to="/">
            <img src="/assets/logos/logo.png" alt="Unitalks" />
            <BrandText>UniTalks</BrandText>
          </Brand>
          <NavCtas>
            <GhostLink to="/video">Try video</GhostLink>
            <GhostLink to="/voice">Try voice</GhostLink>
            <ReportPillButton onClick={() => setBugOpen(true)}>
              Report Bug
            </ReportPillButton>
            <UniversalHamburger />
          </NavCtas>
        </NavInner>
      </TopNav>
      
      
      {bugOpen && <ReportBugModal onClose={() => setBugOpen(false)} />}

      <Hero>
        <div>
          <Kicker>🔥 No identity. No small talk. Just vibes.</Kicker>
          <Headline>
            Life is too short. <Funky>Just skip & Enjoy.</Funky> Connect and Vibe.
          </Headline>
          <Sub>
            Hop into anonymous conversations that actually feel good. Text, voice, or video —  Meet new people, share hot takes, and vibe out.
          </Sub>
          <CTAGroup>
            <PrimaryLink to="/start-chat" $hero>
              Start chatting <FiArrowRight style={{ marginLeft: 8, verticalAlign: '-2px' }} />
            </PrimaryLink>
            <GhostLink to="/video" $hero>Try video</GhostLink>
            <GhostLink to="/voice" $hero>Try voice</GhostLink>
          </CTAGroup>
        </div>
        <Mock>
          {/* Subtle animated stripes to mimic live activity */}
          <div style={{position:'absolute', inset:0, background:
            'radial-gradient(70% 50% at 50% 30%, rgba(29,185,84,.15), rgba(0,0,0,0) 60%)'}} />
          <div style={{position:'absolute', top:24, left:24, right:24, display:'flex', gap:10, alignItems:'center'}}>
            <span style={{fontWeight:800, letterSpacing:.4}}>Live rooms</span>
            <span style={{opacity:.7, fontSize:'.95rem'}}>Text • Voice • Video</span>
          </div>
          <div style={{position:'absolute', top:76, left:24, right:24, display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{height:110, borderRadius:12, border:'1px solid rgba(255,255,255,.06)', overflow:'hidden', position:'relative', background:'#000'}}>
                <div style={{width:'100%', height:'100%', objectFit:'cover', opacity:.85, filter:'saturate(1.05)', background:'linear-gradient(45deg, #1DB954, #19a64c)'}} />
                <div style={{position:'absolute', inset:0, background:'linear-gradient(180deg, rgba(0,0,0,0) 20%, rgba(0,0,0,.65) 100%)'}} />
                <div style={{position:'absolute', top:8, left:8, padding:'4px 8px', borderRadius:999, border:'1px solid rgba(255,255,255,.12)', background:'rgba(0,0,0,.55)', display:'inline-flex', alignItems:'center', gap:6, fontSize:12}}>
                  <Dot />
                  <span>matching…</span>
                </div>
              </div>
            ))}
          </div>
          <MockStrip>
            <FiZap color="#1DB954" />
            <span style={{opacity:.9}}>One tap to hop into a fresh convo</span>
          </MockStrip>
          <TickerContainer>
            <TickerTrack>
              <TickerLine>
                <RunnerSvg viewBox="0 0 24 24">
                  <g className="poseA">
                    <circle cx="8" cy="5" r="2" />
                    <path d="M8 7 L8 12 L5 16" />
                    <path d="M8.5 9 L11 11" />
                    <path d="M8 12 L11 14" />
                  </g>
                  <g className="poseB">
                    <circle cx="8" cy="5" r="2" />
                    <path d="M8 7 L9.5 11 L7 15" />
                    <path d="M8.5 9 L6 11" />
                    <path d="M9.3 12 L12 12.8" />
                  </g>
                </RunnerSvg>
                <TickerText>
                  We are evolving — report bug if found any, give suggestions
                </TickerText>
                <TickerButton onClick={() => setBugOpen(true)}>Report Bug</TickerButton>
              </TickerLine>
              <TickerLine>
                <RunnerSvg viewBox="0 0 24 24">
                  <g className="poseA">
                    <circle cx="8" cy="5" r="2" />
                    <path d="M8 7 L8 12 L5 16" />
                    <path d="M8.5 9 L11 11" />
                    <path d="M8 12 L11 14" />
                  </g>
                  <g className="poseB">
                    <circle cx="8" cy="5" r="2" />
                    <path d="M8 7 L9.5 11 L7 15" />
                    <path d="M8.5 9 L6 11" />
                    <path d="M9.3 12 L12 12.8" />
                  </g>
                </RunnerSvg>
                <TickerText>
                  We are evolving — report bug if found any, give suggestions
                </TickerText>
                <TickerButton onClick={() => setBugOpen(true)}>Report Bug</TickerButton>
              </TickerLine>
            </TickerTrack>
          </TickerContainer>
        </Mock>
      </Hero>

      <FeatureGrid>
        <Card to="/text">
          <IconWrap><FiMessageCircle /></IconWrap>
          <CardText>
            <h3>Text that flows</h3>
            <p>Fast bubbles, clean layout, no clutter. Say more with less.</p>
          </CardText>
        </Card>
        <Card to="/voice">
          <IconWrap><FiMic /></IconWrap>
          <CardText>
            <h3>Crystal voice</h3>
            <p>Low-latency audio with slick visualizers. You'll feel the vibe.</p>
          </CardText>
        </Card>
        <Card to="/video">
          <IconWrap><FiVideo /></IconWrap>
          <CardText>
            <h3>Face time, reimagined</h3>
            <p>Minimal UI, maximal energy. Meet new minds, instantly.</p>
          </CardText>
        </Card>
      </FeatureGrid>
      <Footer />
      
      {/* Mobile Report Bug Button */}
      <MobileReportButton onClick={() => setBugOpen(true)} title="Report Bug">
        <FiAlertTriangle />
      </MobileReportButton>
    </Page>
  );
}

export default Homepage;
