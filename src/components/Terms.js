import React from 'react';
import styled from 'styled-components';
import Header from '../layout/Header';
import Footer from '../layout/Footer';

const TermsContainer = styled.div`
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

const TermsContent = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 90px 20px 40px;
  line-height: 1.7;
  height: calc(100vh - 140px);
  overflow-y: auto;
  overflow-x: hidden;
`;

const ContentCard = styled.div`
  background: rgba(17, 24, 39, 0.8);
  border: 1px solid rgba(29,185,84,0.35);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 10px 40px rgba(29,185,84,0.08);
  backdrop-filter: blur(6px);
`;

const TermsTitle = styled.h1`
  font-size: 2.6rem;
  font-weight: 900;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #1DB954 0%, #19a64c 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-align: center;
  
  @media (max-width: 768px) {
    font-size: 2.2rem;
  }
`;

const EffectiveDate = styled.p`
  text-align: center;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 1.2rem;
  font-size: 1rem;
`;

const WelcomeParagraph = styled.p`
  margin-bottom: 2rem;
  color: #E2E8F0;
  font-size: 1.1rem;
  font-weight: 500;
  
  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const Section = styled.section`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 800;
  margin-bottom: 0.75rem;
  color: #F8FAFC;
  border-bottom: 2px solid rgba(29,185,84,0.55);
  padding-bottom: 0.35rem;
  
  @media (max-width: 768px) {
    font-size: 1.3rem;
  }
`;

const Paragraph = styled.p`
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 1rem;
  
  @media (max-width: 768px) {
    font-size: 0.95rem;
  }
`;

const UnorderedList = styled.ul`
  margin-bottom: 1rem;
  padding-left: 1.5rem;
`;

const ListItem = styled.li`
  margin-bottom: 0.8rem;
  color: #E2E8F0;
  line-height: 1.5;
`;

const Strong = styled.strong`
  color: #F8FAFC;
  font-weight: 600;
`;

const Link = styled.a`
  color: #1DB954;
  text-decoration: none;
  font-weight: 500;
  
  &:hover {
    text-decoration: underline;
  }
`;

function Terms() {
  return (
    <TermsContainer>
      <Header 
        logo="Unitalks"
        hasSidebar={false}
      />
      
      <TermsContent>
        <TermsTitle>Terms and Conditions</TermsTitle>
        <EffectiveDate>Effective Date: 05/08/2025</EffectiveDate>
        <ContentCard>
          <WelcomeParagraph>
            Welcome to Unitalks! By using this website, you agree to the following terms and conditions. Please read them carefully before continuing.
          </WelcomeParagraph>

          <Section>
            <SectionTitle>1. No Account Required</SectionTitle>
            <Paragraph>
              Our service does not require users to create an account. You can use our platform anonymously without registration.
            </Paragraph>
          </Section>

          <Section>
            <SectionTitle>2. No Data Collection</SectionTitle>
            <Paragraph>
              We do not collect, store, or share any personally identifiable information. However, standard technical information (such as IP address or device type) may be logged temporarily for security and performance reasons but is not used to identify users.
            </Paragraph>
          </Section>

          <Section>
            <SectionTitle>3. User Conduct</SectionTitle>
            <Paragraph>By using this website, you agree not to:</Paragraph>
            <UnorderedList>
              <ListItem>Share or request personal information (real name, address, phone number, etc.)</ListItem>
              <ListItem>Transmit illegal, harmful, abusive, or sexually explicit content</ListItem>
              <ListItem>Impersonate others or misrepresent your identity</ListItem>
              <ListItem>Harass, threaten, or intimidate other users</ListItem>
              <ListItem>Use the service for spamming or commercial solicitation</ListItem>
            </UnorderedList>
            <Paragraph>
              We reserve the right to ban users who violate these rules.
            </Paragraph>
          </Section>

          <Section>
            <SectionTitle>4. Use at Your Own Risk</SectionTitle>
            <Paragraph>
              This platform connects users randomly for text/video chat. We do not monitor conversations. By using the site, you understand that:
            </Paragraph>
            <UnorderedList>
              <ListItem>You may encounter inappropriate behavior or content</ListItem>
              <ListItem>We are not liable for user conduct during chats</ListItem>
            </UnorderedList>
            <Paragraph>
              Please report abuse using the provided reporting tools (if available).
            </Paragraph>
          </Section>

          <Section>
            <SectionTitle>5. Age Restriction</SectionTitle>
            <Paragraph>
              You must be at least 18 years old to use this website. By using the service, you confirm that you meet this age requirement.
            </Paragraph>
          </Section>

          <Section>
            <SectionTitle>6. Disclaimer of Warranty</SectionTitle>
            <Paragraph>
              This service is provided "as is" without warranties of any kind. We do not guarantee uninterrupted or error-free service.
            </Paragraph>
          </Section>

          <Section>
            <SectionTitle>7. Limitation of Liability</SectionTitle>
            <Paragraph>
              To the maximum extent permitted by law, Unitalks is not responsible for any damages arising from the use or inability to use the service.
            </Paragraph>
          </Section>

          <Section>
            <SectionTitle>8. Changes to Terms</SectionTitle>
            <Paragraph>
              We may update these Terms from time to time. Continued use of the service means you accept the revised Terms.
            </Paragraph>
          </Section>

          <Section>
            <SectionTitle>9. Governing Law</SectionTitle>
            <Paragraph>
              These Terms shall be governed by and construed in accordance with the laws of Delhi, India.
            </Paragraph>
          </Section>
        </ContentCard>
      </TermsContent>
      
      <Footer />
    </TermsContainer>
  );
}

export default Terms;
