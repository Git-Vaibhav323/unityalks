import React, { useState } from 'react';
import styled from 'styled-components';
import { Link, useLocation } from 'react-router-dom';
import UniversalHamburger from '../ui/UniversalHamburger';
import ReportBugModal from '../ui/ReportBugModal';

const HeaderContainer = styled.div`
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  transition: all 0.3s ease;
  height: 72px;
  display: flex;
  align-items: center;
  width: ${props => props.$hasSidebar ? 'calc(100vw - 60px)' : '100vw'};
  
  @media (max-width: 768px) {
    padding: 0 1rem;
    width: 100% !important;
    max-width: 100vw !important;
    height: auto;
    min-height: 60px;
  }
`;

const HeaderFlex = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0 24px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Logo = styled(Link)`
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  transition: opacity 0.3s ease;
  position: relative;
  color: #fff;

  &:hover {
    opacity: 0.8;
  }

  img {
    height: 64px;
    width: auto;
    object-fit: contain;
    
    @media (max-width: 768px) {
      height: 48px;
    }
  }
`;

const BrandText = styled.span`
  color: #ffffff;
  font-family: 'Press Start 2P', cursive, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  font-size: 22px;
  line-height: 1;
  letter-spacing: 0.5px;
  @media (max-width: 768px) { font-size: 18px; }
`;

const Nav = styled.nav`
  display: flex;
  align-items: center;
  margin-left: auto;

  @media (max-width: 768px) {
    display: none;
  }
`;

const NavGroup = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 0;
`;

const ReportPillButton = styled.button`
  margin-left: 12px;
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
  @media (max-width: 768px) { display: none; }
`;

const NavLink = styled(Link)`
  color: #E5E7EB;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.95rem;
  padding: 10px 16px;
  border-radius: 10px;
  transition: all 0.2s ease;
  position: relative;
  line-height: 1;
  border: 1px solid ${({ $active }) => ($active ? 'rgba(29,185,84,0.6)' : 'rgba(255,255,255,0.12)')};
  background: ${({ $active }) => ($active ? 'linear-gradient(135deg, rgba(24,24,24,0.9) 0%, rgba(18,18,18,0.9) 100%)' : 'rgba(18,18,18,0.7)')};
  box-shadow: ${({ $active }) => ($active ? '0 8px 22px rgba(29,185,84,0.22)' : '0 6px 18px rgba(0,0,0,0.25)')};

  &:hover {
    transform: translateY(-1px);
    border-color: rgba(29,185,84,0.65);
    background: linear-gradient(135deg, rgba(24,24,24,0.8) 0%, rgba(18,18,18,0.8) 100%);
    box-shadow: 0 10px 26px rgba(29,185,84,0.22);
  }
`;

const navLinks = [
  { to: '/text', label: 'Text Chat' },
  { to: '/voice', label: 'Voice Chat' },
  { to: '/video', label: 'Video Chat' },
];

function Header({ 
  logo = "Unitalks", 
  navigationItems = [], 
  hasSidebar = false,
  onLogoClick,
  onNavItemClick
}) {
  const location = useLocation();
  const [bugOpen, setBugOpen] = useState(false);

  return (
    <HeaderContainer $hasSidebar={hasSidebar}>
      <HeaderFlex>
        <Logo to="/">
          <img src="/assets/logos/logo.png" alt="Unitalks Logo" />
          <BrandText>UniTalks</BrandText>
        </Logo>
        <Nav>
          <NavGroup>
            {navLinks.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                $active={location.pathname.startsWith(link.to)}
              >
                {link.label}
              </NavLink>
            ))}
            <ReportPillButton onClick={() => setBugOpen(true)}>Report Bug</ReportPillButton>
          </NavGroup>
        </Nav>
        <UniversalHamburger showHomeLink={true} />
      </HeaderFlex>
      {bugOpen && (
        <ReportBugModal onClose={() => setBugOpen(false)} />
      )}
    </HeaderContainer>
  );
}

export default Header;
