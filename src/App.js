import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import Homepage from './components/pages/Homepage';
import StartChat from './components/pages/StartChat';
import About from './components/pages/About';
import Privacy from './components/pages/Privacy';
import Terms from './components/pages/Terms';
import Help from './components/pages/Help';
import Contact from './components/pages/Contact';
import VideoChat from './components/pages/VideoChat';
import AudioChat from './components/pages/AudioChat';
import TextChat from './components/pages/TextChat';

const AppBackground = styled.div`
  height: 100vh;
  width: 100%;
  background: ${props => props.theme.colors.appBg};
  display: flex;
  flex-direction: column;
  overflow: ${props => props.$isHomepage ? 'auto' : 'hidden'};
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  overflow: ${props => props.$isHomepage ? 'visible' : 'hidden'};
`;

// Component to determine if we're on homepage
function AppContent() {
  const location = useLocation();
  const isHomepage = location.pathname === '/';

  return (
    <AppBackground $isHomepage={isHomepage}>
      <MainContent $isHomepage={isHomepage}>
            <Routes>
              <Route path="/" element={<Homepage />} />
              <Route path="/start-chat" element={<StartChat />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/about" element={<About />} />
              <Route path="/help" element={<Help />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/voice" element={<AudioChat />} />
              <Route path="/video" element={<VideoChat />} />
              <Route path="/text" element={<TextChat />} />
            </Routes>
      </MainContent>
    </AppBackground>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
