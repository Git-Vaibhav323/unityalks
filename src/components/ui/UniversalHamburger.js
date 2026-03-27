import React, { useState } from 'react';
import styled from 'styled-components';
import { Link, useLocation } from 'react-router-dom';
import { FiMenu, FiX, FiVideo, FiMic, FiMessageSquare, FiAlertCircle, FiInfo } from 'react-icons/fi';
import ReportBugModal from './ReportBugModal';

const HamburgerButton = styled.button`
  display: none;
  
  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    background: rgba(0, 0, 0, 0.3);
    color: #fff;
    font-size: 1.2rem;
    cursor: pointer;
    transition: all 0.2s ease;
    backdrop-filter: blur(10px);
    
    &:hover {
      background: rgba(29, 185, 84, 0.2);
      border-color: rgba(29, 185, 84, 0.5);
      transform: translateY(-1px);
    }
  }
`;

const MobileMenuOverlay = styled.div`
  display: none;
  
  @media (max-width: 768px) {
    display: ${props => props.$isOpen ? 'block' : 'none'};
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    z-index: 1000;
  }
`;

const MobileMenu = styled.div`
  display: none;
  
  @media (max-width: 768px) {
    display: ${props => props.$isOpen ? 'flex' : 'none'};
    position: fixed;
    top: 0;
    right: 0;
    width: 300px;
    height: 100vh;
    background: linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #334155 100%);
    border-left: 2px solid rgba(29, 185, 84, 0.4);
    flex-direction: column;
    padding: 2rem 1.5rem;
    z-index: 1001;
    box-shadow: -15px 0 40px rgba(0, 0, 0, 0.6);
    animation: slideIn 0.3s ease-out;
    backdrop-filter: blur(20px);
    
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  }
`;

const MobileMenuHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid rgba(29, 185, 84, 0.3);
  background: linear-gradient(90deg, rgba(29, 185, 84, 0.1) 0%, transparent 100%);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
`;

const MobileMenuTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
  margin: 0;
  background: linear-gradient(135deg, #1DB954 0%, #19a64c 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
`;

const MobileMenuCloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.3);
  color: #fff;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(29, 185, 84, 0.2);
    border-color: rgba(29, 185, 84, 0.5);
  }
`;

const MobileMenuLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  margin-bottom: 0.75rem;
  border-radius: 12px;
  text-decoration: none;
  color: #E5E7EB;
  font-weight: 600;
  font-size: 1.1rem;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  background: rgba(0, 0, 0, 0.2);
  
  &:hover {
    background: rgba(29, 185, 84, 0.15);
    border-color: rgba(29, 185, 84, 0.3);
    transform: translateX(4px);
  }
  
  &.active {
    background: linear-gradient(135deg, rgba(29, 185, 84, 0.2) 0%, rgba(29, 185, 84, 0.1) 100%);
    border-color: rgba(29, 185, 84, 0.5);
    color: #1DB954;
  }
`;

const MobileMenuIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(29, 185, 84, 0.2) 0%, rgba(29, 185, 84, 0.1) 100%);
  border: 1px solid rgba(29, 185, 84, 0.3);
  color: #1DB954;
  font-size: 1.2rem;
`;

const MobileMenuButton = styled.button`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  margin-bottom: 0.75rem;
  border-radius: 12px;
  border: 1px solid transparent;
  background: rgba(0, 0, 0, 0.2);
  color: #E5E7EB;
  font-weight: 600;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  text-align: left;
  
  &:hover {
    background: rgba(29, 185, 84, 0.15);
    border-color: rgba(29, 185, 84, 0.3);
    transform: translateX(4px);
  }
`;

const MobileReportButton = styled.button`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  margin-top: 1rem;
  border-radius: 12px;
  border: 1px solid rgba(29, 185, 84, 0.4);
  background: linear-gradient(135deg, rgba(29, 185, 84, 0.2) 0%, rgba(29, 185, 84, 0.1) 100%);
  color: #1DB954;
  font-weight: 600;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  text-align: left;
  
  &:hover {
    background: linear-gradient(135deg, rgba(29, 185, 84, 0.3) 0%, rgba(29, 185, 84, 0.2) 100%);
    border-color: rgba(29, 185, 84, 0.6);
    transform: translateX(4px);
  }
`;

function UniversalHamburger({ showHomeLink = false }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [bugOpen, setBugOpen] = useState(false);
  const location = useLocation();
  
  const closeMenu = () => setMenuOpen(false);
  
  const menuItems = [
    { to: '/video', label: 'Video Chat', icon: FiVideo },
    { to: '/text', label: 'Text Chat', icon: FiMessageSquare },
    { to: '/voice', label: 'Voice Chat', icon: FiMic },
  ];
  
  const actionItems = [
    { label: 'About Us', icon: FiInfo, onClick: () => console.log('About Us clicked') },
  ];

  return (
    <>
      <HamburgerButton onClick={() => setMenuOpen(true)}>
        <FiMenu />
      </HamburgerButton>
      
      <MobileMenuOverlay $isOpen={menuOpen} onClick={closeMenu} />
      <MobileMenu $isOpen={menuOpen}>
        <MobileMenuHeader>
          <MobileMenuTitle>Menu</MobileMenuTitle>
          <MobileMenuCloseButton onClick={closeMenu}>
            <FiX />
          </MobileMenuCloseButton>
        </MobileMenuHeader>
        
        {showHomeLink && (
          <MobileMenuLink 
            to="/" 
            onClick={closeMenu}
            className={location.pathname === '/' ? 'active' : ''}
          >
            <MobileMenuIcon>
              <FiMenu />
            </MobileMenuIcon>
            Home
          </MobileMenuLink>
        )}
        
        {menuItems.map(item => (
          <MobileMenuLink 
            key={item.to}
            to={item.to} 
            onClick={closeMenu}
            className={location.pathname.startsWith(item.to) ? 'active' : ''}
          >
            <MobileMenuIcon>
              <item.icon />
            </MobileMenuIcon>
            {item.label}
          </MobileMenuLink>
        ))}
        
        {actionItems.map(item => (
          <MobileMenuButton key={item.label} onClick={item.onClick}>
            <MobileMenuIcon>
              <item.icon />
            </MobileMenuIcon>
            {item.label}
          </MobileMenuButton>
        ))}
        
        <MobileReportButton onClick={() => {
          setBugOpen(true);
          closeMenu();
        }}>
          <MobileMenuIcon>
            <FiAlertCircle />
          </MobileMenuIcon>
          Report Bug
        </MobileReportButton>
      </MobileMenu>
      
      {bugOpen && (
        <ReportBugModal onClose={() => setBugOpen(false)} />
      )}
    </>
  );
}

export default UniversalHamburger;
