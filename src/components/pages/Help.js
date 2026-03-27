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
  text-transform: uppercase;
  letter-spacing: -0.5px;
`;

const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 24px;
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const Card = styled.button`
  background: rgba(17, 24, 39, 0.8);
  border: 1px solid rgba(29,185,84,0.35);
  border-radius: 14px;
  padding: 16px;
  color: #E5E7EB;
  text-align: left;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;

  &:hover { transform: translateY(-2px); border-color: rgba(29,185,84,0.7); box-shadow: 0 10px 30px rgba(29,185,84,0.12); }
`;

const CardTitle = styled.div`
  font-weight: 700;
  margin-bottom: 6px;
`;

const CardText = styled.div`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.95rem;
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

function Help() {
  const [type, setType] = useState('bug');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [status, setStatus] = useState('idle');

  const preset = (t) => { setType(t); if (!subject) setSubject(t.replace(/\b\w/g, c => c.toUpperCase())); };

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, subject, message, contact })
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setStatus('success');
        setSubject(''); setMessage(''); setContact('');
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
        <Title>Help Center</Title>
        <Subtitle>How can we help? Choose a category or write to us.</Subtitle>

        <CardGrid>
          <Card onClick={() => preset('bug')}>
            <CardTitle>Report a Bug</CardTitle>
            <CardText>Something broken? Tell us what went wrong.</CardText>
          </Card>
          <Card onClick={() => preset('feature')}>
            <CardTitle>Feature Suggestion</CardTitle>
            <CardText>Have an idea? Share what would make Unitalks better.</CardText>
          </Card>
          <Card onClick={() => preset('work-with-us')}>
            <CardTitle>Work With Us</CardTitle>
            <CardText>Collaborations, careers, campuses — we're listening.</CardText>
          </Card>
          <Card onClick={() => preset('advertise')}>
            <CardTitle>Advertise With Us</CardTitle>
            <CardText>Reach college audiences the right way.</CardText>
          </Card>
        </CardGrid>

        <Form onSubmit={onSubmit}>
          <Row>
            <div>
              <Label>Topic</Label>
              <Input value={type} onChange={(e) => setType(e.target.value)} list="topics" />
              <datalist id="topics">
                <option value="bug" />
                <option value="feature" />
                <option value="work-with-us" />
                <option value="advertise" />
              </datalist>
            </div>
            <div>
              <Label>Subject</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Short summary" />
            </div>
          </Row>
          <div style={{ marginTop: 12 }}>
            <Label>Message</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Describe the issue or request" />
          </div>
          <div style={{ marginTop: 12 }}>
            <Label>Contact (optional)</Label>
            <Input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Email or phone so we can reply" />
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

export default Help;
