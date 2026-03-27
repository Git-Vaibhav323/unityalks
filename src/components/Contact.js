import React, { useState } from 'react';
import styled from 'styled-components';
import Header from '../layout/Header';
import Footer from '../layout/Footer';

const Page = styled.div`
  height: 100vh;
  max-width: 100vw;
  background: ${({ theme }) => theme.colors.appBg};
  color: #F8FAFC;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
`;

const Container = styled.div`
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
  padding: 90px 20px 40px;
  height: calc(100vh - 140px);
  overflow-y: auto;
  overflow-x: hidden;
`;

const Title = styled.h1`
  font-size: 2.4rem;
  font-weight: 900;
  margin-bottom: 12px;
  background: linear-gradient(135deg, #1DB954 0%, #19a64c 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  letter-spacing: -0.5px;
`;

const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 24px;
`;

const Form = styled.form`
  background: rgba(17, 24, 39, 0.8);
  border: 1px solid rgba(29,185,84,0.35);
  border-radius: 16px;
  padding: 20px;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  @media (max-width: 768px) { grid-template-columns: 1fr; }
`;

const Label = styled.label`
  display: block;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 6px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid rgba(29,185,84,0.35);
  background: rgba(0,0,0,0.6);
  color: #E5E7EB;
`;

const Textarea = styled.textarea`
  width: 100%;
  min-height: 140px;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid rgba(29,185,84,0.35);
  background: rgba(0,0,0,0.6);
  color: #E5E7EB;
  resize: vertical;
`;

const Submit = styled.button`
  margin-top: 12px;
  padding: 12px 18px;
  border-radius: 999px;
  border: 1px solid rgba(29,185,84,0.6);
  background: linear-gradient(135deg, #181818 0%, #121212 100%);
  color: #FFFFFF;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  &:hover { transform: translateY(-1px); box-shadow: 0 10px 30px rgba(29,185,84,0.22); }
`;

const Success = styled.div`
  color: #34D399;
  margin-top: 10px;
`;

const Error = styled.div`
  color: #F87171;
  margin-top: 10px;
`;

function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Contact');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle');

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'contact', subject, message, contact: `${name} <${email}>` })
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setStatus('success');
        setName(''); setEmail(''); setMessage('');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <Page>
      <Header logo="Unitalks" hasSidebar={false} />
      <Container>
        <Title>Contact Us</Title>
        <Subtitle>We usually reply within 1-2 business days.</Subtitle>
        <Form onSubmit={onSubmit}>
          <Row>
            <div>
              <Label>Your Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <Label>Your Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </Row>
          <div style={{ marginTop: 12 }}>
            <Label>Message</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="How can we help?" required />
          </div>
          <Submit type="submit" disabled={status==='loading'}>{status==='loading' ? 'Sending…' : 'Send'}</Submit>
          {status==='success' && <Success>Thanks! We'll get back to you soon.</Success>}
          {status==='error' && <Error>Couldn't send. Please try again.</Error>}
        </Form>
      </Container>
      <Footer />
    </Page>
  );
}

export default Contact;
