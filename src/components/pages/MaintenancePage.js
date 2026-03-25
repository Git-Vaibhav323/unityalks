import React from 'react';
import styled, { keyframes } from 'styled-components';
import { Link } from 'react-router-dom';
import { FiTool, FiArrowLeft, FiClock, FiZap } from 'react-icons/fi';
import Header from '../layout/Header';
import Footer from '../layout/Footer';

const MaintenanceContainer = styled.div`
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
  justify-content: center;
  align-items: center;
  padding: 56px 20px 48px;
  margin-top: 70px;
  position: relative;
  overflow: hidden;
  z-index: 1;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(60% 80% at 50% 20%, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.35) 100%),
      radial-gradient(600px 300px at 50% 10%, rgba(29,185,84,0.15), rgba(0,0,0,0) 60%);
    z-index: 0;
  }
`;

const pulse = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
`;

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const MaintenanceIcon = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 24px;
  background: radial-gradient(120px 120px at 50% 0%, rgba(29,185,84,0.3), rgba(0,0,0,0.9));
  border: 2px solid rgba(29,185,84,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
  position: relative;
  z-index: 2;
  animation: ${pulse} 2s ease-in-out infinite;
  color: #1DB954;

  svg {
    width: 48px;
    height: 48px;
  }
`;

const Title = styled.h1`
  font-size: 3.5rem;
  font-weight: 900;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #1DB954 0%, #19a64c 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  position: relative;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: -0.5px;
  line-height: 1.12;
  z-index: 2;

  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 2rem;
  max-width: 600px;
  text-align: center;
  line-height: 1.7;
  position: relative;
  z-index: 2;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const StatusCard = styled.div`
  background: rgba(17, 24, 39, 0.8);
  border: 1px solid rgba(29,185,84,0.35);
  border-radius: 16px;
  padding: 2rem;
  max-width: 500px;
  width: 100%;
  text-align: center;
  margin-bottom: 2rem;
  position: relative;
  z-index: 2;
  backdrop-filter: blur(6px);
  box-shadow: 0 10px 40px rgba(29,185,84,0.08);
`;

const StatusTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: #1DB954;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`;

const StatusText = styled.p`
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.6;
  margin-bottom: 1.5rem;
`;

const FeatureList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
`;

const FeatureItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.95rem;
`;

const BackButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 12px 24px;
  border-radius: 999px;
  text-decoration: none;
  color: #0b0b0f;
  font-weight: 700;
  background: linear-gradient(135deg, #1DB954, #19a64c);
  box-shadow: 0 0 0 2px rgba(29,185,84,.25), 0 12px 28px rgba(29,185,84,.25);
  border: 1px solid rgba(29,185,84,.9);
  transition: transform .2s, box-shadow .2s;
  position: relative;
  z-index: 2;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 0 0 4px rgba(29,185,84,.18), 0 16px 34px rgba(29,185,84,.35);
  }
`;

const ComingSoonBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 8px 16px;
  border-radius: 999px;
  background: rgba(29,185,84,0.12);
  border: 1px solid rgba(29,185,84,0.35);
  color: #1DB954;
  font-weight: 700;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  animation: ${float} 3s ease-in-out infinite;
`;

function MaintenancePage({ chatType = 'chat' }) {
  const isVoice = chatType === 'voice';
  const isVideo = chatType === 'video';
  
  const getTitle = () => {
    if (isVoice) return 'Voice Chat';
    if (isVideo) return 'Video Chat';
    return 'Chat';
  };

  const getFeatures = () => {
    if (isVoice) {
      return [
        'Crystal clear audio quality',
        'Low-latency voice transmission',
        'Real-time voice processing',
        'Background noise cancellation'
      ];
    }
    if (isVideo) {
      return [
        'HD video streaming',
        'Real-time video processing',
        'Screen sharing capabilities',
        'Advanced video filters'
      ];
    }
    return ['Advanced chat features'];
  };

  return (
    <MaintenanceContainer>
      <Header 
        logo="Unitalks"
        hasSidebar={false}
      />
      <MainContent>
        <MaintenanceIcon>
          <FiTool />
        </MaintenanceIcon>
        
        <ComingSoonBadge>
          <FiZap />
          Coming Soon
        </ComingSoonBadge>
        
        <Title>{getTitle()}</Title>
        
        <Subtitle>
          We're working hard to bring you an amazing {getTitle().toLowerCase()} experience. 
          This feature is currently under development and will be available soon.
        </Subtitle>
        
        <StatusCard>
          <StatusTitle>
            <FiClock />
            Page Under Maintenance
          </StatusTitle>
          <StatusText>
            Our team is actively developing this feature to ensure the best possible experience for our users.
          </StatusText>
          
          <FeatureList>
            {getFeatures().map((feature, index) => (
              <FeatureItem key={index}>
                <FiZap size={16} color="#1DB954" />
                {feature}
              </FeatureItem>
            ))}
          </FeatureList>
          
          <StatusText>
            Stay tuned for updates! In the meantime, you can try our text chat feature.
          </StatusText>
        </StatusCard>
        
        <BackButton to="/start-chat">
          <FiArrowLeft />
          Back to Chat Options
        </BackButton>
      </MainContent>
      <Footer />
    </MaintenanceContainer>
  );
}

export default MaintenancePage;

