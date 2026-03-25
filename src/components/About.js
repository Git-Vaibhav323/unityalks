import React from 'react';
import styled from 'styled-components';
import Header from '../layout/Header';
import Footer from '../layout/Footer';

const AboutContainer = styled.div`
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

const AboutContent = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 90px 20px 40px;
  line-height: 1.7;
  height: calc(100vh - 140px);
  overflow-y: auto;
  overflow-x: hidden;
`;

const HeroSection = styled.section`
  text-align: center;
  margin-bottom: 4rem;
`;

const AboutTitle = styled.h1`
  font-size: 3rem;
  font-weight: 900;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #1DB954 0%, #19a64c 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  
  @media (max-width: 768px) {
    font-size: 2.2rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 2rem;
  font-weight: 500;
  
  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  margin-bottom: 4rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`;

const FeatureCard = styled.div`
  background: rgba(17, 24, 39, 0.8);
  border: 1px solid rgba(29,185,84,0.35);
  border-radius: 16px;
  padding: 2rem;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
  
  &:hover {
    transform: translateY(-4px);
    border-color: rgba(29,185,84,0.7);
    box-shadow: 0 10px 40px rgba(29,185,84,0.15);
  }
`;

const FeatureIcon = styled.div`
  width: 60px;
  height: 60px;
  background: radial-gradient(120px 120px at 50% 0%, rgba(29,185,84,0.5), rgba(0,0,0,0.9));
  border: 1px solid rgba(29,185,84,0.5);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
  color: #E5E7EB;
`;

const FeatureTitle = styled.h3`
  font-size: 1.4rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: #F8FAFC;
  
  @media (max-width: 768px) {
    font-size: 1.2rem;
  }
`;

const FeatureDescription = styled.p`
  color: #E2E8F0;
  font-size: 1rem;
  line-height: 1.6;
`;

const Section = styled.section`
  margin-bottom: 4rem;
`;

const SectionTitle = styled.h2`
  font-size: 2.2rem;
  font-weight: 700;
  margin-bottom: 2rem;
  color: #F8FAFC;
  text-align: center;
  border-bottom: 3px solid #1DB954;
  padding-bottom: 0.5rem;
  
  @media (max-width: 768px) {
    font-size: 1.8rem;
  }
`;

const PrivacySection = styled.div`
  background: rgba(17,24,39,0.8);
  border-radius: 20px;
  padding: 3rem;
  margin-bottom: 3rem;
  border: 1px solid rgba(29,185,84,0.35);
  box-shadow: 0 10px 40px rgba(29,185,84,0.08);
  backdrop-filter: blur(6px);
  
  @media (max-width: 768px) {
    padding: 2rem;
  }
`;

const PrivacyTitle = styled.h3`
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: #F8FAFC;
  text-align: center;
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const PrivacyContent = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`;

const PrivacyItem = styled.div`
  text-align: center;
  padding: 1.5rem;
  background: rgba(15, 23, 42, 0.5);
  border-radius: 12px;
  border: 1px solid rgba(139, 92, 246, 0.1);
`;

const PrivacyIcon = styled.div`
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  font-size: 1.2rem;
`;

const PrivacyItemTitle = styled.h4`
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #F8FAFC;
`;

const PrivacyItemText = styled.p`
  color: #E2E8F0;
  font-size: 0.95rem;
  line-height: 1.5;
`;

const MissionSection = styled.div`
  text-align: center;
  background: rgba(17,24,39,0.8);
  border-radius: 20px;
  padding: 3rem;
  border: 1px solid rgba(29,185,84,0.35);
  box-shadow: 0 10px 40px rgba(29,185,84,0.08);
  backdrop-filter: blur(6px);
  
  @media (max-width: 768px) {
    padding: 2rem;
  }
`;

const MissionTitle = styled.h3`
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: #F8FAFC;
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const MissionText = styled.p`
  color: #E2E8F0;
  font-size: 1.1rem;
  line-height: 1.7;
  max-width: 800px;
  margin: 0 auto;
  
  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const StatsSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
`;

const StatCard = styled.div`
  text-align: center;
  padding: 2rem;
  background: rgba(17, 24, 39, 0.8);
  border-radius: 16px;
  border: 1px solid rgba(29,185,84,0.35);
  box-shadow: 0 10px 40px rgba(29,185,84,0.08);
  backdrop-filter: blur(6px);
`;

const StatNumber = styled.div`
  font-size: 2.5rem;
  font-weight: 900;
  color: #1DB954;
  margin-bottom: 0.5rem;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const StatLabel = styled.div`
  color: #E2E8F0;
  font-size: 1rem;
  font-weight: 500;
`;

function About() {
  return (
    <AboutContainer>
      <Header 
        logo="Unitalks"
        hasSidebar={false}
      />
      
      <AboutContent>
        <HeroSection>
          <AboutTitle>About Unitalks</AboutTitle>
          <Subtitle>
            Connecting people worldwide through secure, anonymous, and real-time communication
          </Subtitle>
        </HeroSection>

        <FeaturesGrid>
          <FeatureCard>
            <FeatureIcon>💬</FeatureIcon>
            <FeatureTitle>Text Chat</FeatureTitle>
            <FeatureDescription>
              Connect with random users through instant text messaging. Share thoughts, ideas, and conversations in real-time with complete anonymity.
            </FeatureDescription>
          </FeatureCard>

          <FeatureCard>
            <FeatureIcon>🎤</FeatureIcon>
            <FeatureTitle>Voice Calls</FeatureTitle>
            <FeatureDescription>
              Experience crystal-clear voice conversations with users around the world. Our high-quality audio ensures smooth communication.
            </FeatureDescription>
          </FeatureCard>

          <FeatureCard>
            <FeatureIcon>📹</FeatureIcon>
            <FeatureTitle>Video Calls</FeatureTitle>
            <FeatureDescription>
              Face-to-face conversations with HD video quality. Connect visually with people globally while maintaining your privacy.
            </FeatureDescription>
          </FeatureCard>
        </FeaturesGrid>

        <Section>
          <SectionTitle>Our Privacy Commitment</SectionTitle>
          <PrivacySection>
            <PrivacyTitle>Your Privacy is Our Priority</PrivacyTitle>
            <PrivacyContent>
              <PrivacyItem>
                <PrivacyIcon>🔒</PrivacyIcon>
                <PrivacyItemTitle>No Data Storage</PrivacyItemTitle>
                <PrivacyItemText>
                  We don't store any personal information, chat logs, or user data. Your conversations remain private and temporary.
                </PrivacyItemText>
              </PrivacyItem>

              <PrivacyItem>
                <PrivacyIcon>👤</PrivacyIcon>
                <PrivacyItemTitle>Anonymous Usage</PrivacyItemTitle>
                <PrivacyItemText>
                  No registration required. Use our platform completely anonymously without creating any accounts.
                </PrivacyItemText>
              </PrivacyItem>

              <PrivacyItem>
                <PrivacyIcon>🛡️</PrivacyIcon>
                <PrivacyItemTitle>Secure Connections</PrivacyItemTitle>
                <PrivacyItemText>
                  All communications are encrypted and secure. Your conversations are protected with industry-standard security.
                </PrivacyItemText>
              </PrivacyItem>

              <PrivacyItem>
                <PrivacyIcon>🌐</PrivacyIcon>
                <PrivacyItemTitle>Global Access</PrivacyItemTitle>
                <PrivacyItemText>
                  Connect with people worldwide while maintaining your privacy and anonymity across all interactions.
                </PrivacyItemText>
              </PrivacyItem>
            </PrivacyContent>
          </PrivacySection>
        </Section>

        <Section>
          <SectionTitle>Platform Statistics</SectionTitle>
          <StatsSection>
            <StatCard>
              <StatNumber>100%</StatNumber>
              <StatLabel>Anonymous</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber>0</StatNumber>
              <StatLabel>Data Stored</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber>3</StatNumber>
              <StatLabel>Chat Modes</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber>24/7</StatNumber>
              <StatLabel>Available</StatLabel>
            </StatCard>
          </StatsSection>
        </Section>

        <MissionSection>
          <MissionTitle>Our Mission</MissionTitle>
          <MissionText>
            At Unitalks, we believe in the power of human connection without compromising privacy. Our platform enables meaningful conversations between people worldwide while ensuring complete anonymity and data protection. We're committed to providing a safe, secure, and user-friendly environment where genuine connections can flourish without the burden of personal data collection or storage.
          </MissionText>
        </MissionSection>
      </AboutContent>
      
      <Footer />
    </AboutContainer>
  );
}

export default About;
