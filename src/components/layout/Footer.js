import React from 'react';
import styled from 'styled-components';

const FooterContainer = styled.footer`
  width: 100%;
  background: linear-gradient(135deg, #121212 0%, #000000 100%);
  color: #F8FAFC;
  padding: 2rem 0 1.5rem 0;
  text-align: center;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  margin-top: auto;
  position: relative;
  z-index: 1;
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  
  @media (max-width: 768px) {
    padding: 0 1rem;
  }
`;

const FooterLinks = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  
  @media (max-width: 768px) {
    flex-direction: row;
    gap: 0.8rem;
    flex-wrap: wrap;
    justify-content: center;
  }
`;

const FooterLink = styled.a`
  color: #B3B3B3;
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.3s ease;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  
  &:hover {
    color: #1DB954;
    background: rgba(29, 185, 84, 0.1);
  }
  
  @media (max-width: 768px) {
    font-size: 0.85rem;
    padding: 0.3rem 0.6rem;
    white-space: nowrap;
  }
`;

const Separator = styled.span`
  color: #666;
  font-weight: 300;
  
  @media (max-width: 768px) {
    display: inline;
    font-size: 0.8rem;
  }
`;

const Copyright = styled.div`
  color: #666;
  font-size: 0.9rem;
  font-weight: 400;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 1rem;
  
  @media (max-width: 768px) {
    font-size: 0.85rem;
  }
`;

const BrandName = styled.span`
  color: #1DB954;
  font-weight: 600;
`;

function Footer() {
  return (
    <FooterContainer>
      <FooterContent>
        <FooterLinks>
          <FooterLink href="/privacy">Privacy Policy</FooterLink>
          <Separator>•</Separator>
          <FooterLink href="/terms">Terms of Service</FooterLink>
          <Separator>•</Separator>
          <FooterLink href="/about">About</FooterLink>
          <Separator>•</Separator>
          <FooterLink href="/contact">Contact Us</FooterLink>
          <Separator>•</Separator>
          <FooterLink href="/help">Help Center</FooterLink>
        </FooterLinks>
        <Copyright>
          © 2025 <BrandName>Unitalks</BrandName>. All Rights Reserved.
        </Copyright>
      </FooterContent>
    </FooterContainer>
  );
}

export default Footer;
