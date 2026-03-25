import React, { useRef, useState } from 'react';
import styled from 'styled-components';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: #000;
  display: grid;
  place-items: center;
  z-index: 2000;
`;

const Card = styled.div`
  width: 92%;
  max-width: 560px;
  background: #121212;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  padding: 1.25rem;
  color: #e5e7eb;
  box-shadow: 0 20px 40px rgba(0,0,0,0.45);
`;

const Title = styled.h3`
  margin: 0 0 0.5rem 0;
  color: #fff;
`;

const Desc = styled.p`
  margin: 0 0 1rem 0;
  color: #b3b3b3;
  font-size: 0.95rem;
`;

const Row = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
`;

const Label = styled.label`
  font-weight: 700;
  font-size: 0.9rem;
  color: #e5e7eb;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.12);
  background: #000;
  color: #fff;
  outline: none;
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.12);
  background: #000;
  color: #fff;
  outline: none;
  min-height: 90px;
  resize: vertical;
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
`;

const Button = styled.button`
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.12);
  color: #fff;
  background: linear-gradient(135deg, #181818 0%, #121212 100%);
  font-weight: 700;
  cursor: pointer;
`;

const Primary = styled(Button)`
  border-color: rgba(29,185,84,0.6);
  background: linear-gradient(135deg, #1DB954 0%, #19a64c 100%);
`;

const SuccessNote = styled.div`
  margin-top: 12px;
  color: #bbf7d0;
  font-weight: 600;
`;

const ReportBugModal = ({ onClose }) => {
  const [page, setPage] = useState(typeof window !== 'undefined' ? window.location.pathname : '');
  const [email, setEmail] = useState('');
  const [bug, setBug] = useState('');
  const [suggestions, setSuggestions] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const submittedRef = useRef(false);

  const WEB3FORMS_KEY = process.env.REACT_APP_WEB3FORMS_KEY || 'a932dd6c-756e-4564-a810-3088ac0b722b';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError('');
    if (!WEB3FORMS_KEY) {
      setError('Missing Web3Forms key. Please set REACT_APP_WEB3FORMS_KEY in .env');
      return;
    }
    setSubmitting(true);
    submittedRef.current = true;
    try {
      const payload = {
        access_key: WEB3FORMS_KEY,
        subject: 'Bug Report / Feature Request',
        from_name: 'Unitalks Bug Reporter',
        replyto: email || undefined,
        page,
        bug,
        suggestions,
        url: typeof window !== 'undefined' ? window.location.href : '',
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
      };
      // Remove undefined keys
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data && data.success) {
        setSubmitted(true);
      } else {
        setError(data?.message || 'Submission failed. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please try again later.');
    } finally {
      setSubmitting(false);
      submittedRef.current = false;
    }
  };

  return (
    <Overlay onClick={onClose}>
      <Card onClick={(e) => e.stopPropagation()}>
        <Title>Report a Bug / Request a Feature</Title>
        <Desc>Help us improve. Tell us where you saw the issue and what happened.</Desc>

        <form onSubmit={handleSubmit}>
          <Row>
            <Label>Bug appeared on which page</Label>
            <Input value={page} onChange={(e) => setPage(e.target.value)} placeholder="/video, /voice, /text, or page name" required />
          </Row>
          <Row>
            <Label>Your email (optional)</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </Row>
          <Row>
            <Label>Bug details</Label>
            <Textarea value={bug} onChange={(e) => setBug(e.target.value)} placeholder="Describe the bug in detail" required />
          </Row>
          <Row>
            <Label>Request Features / Suggestions</Label>
            <Textarea value={suggestions} onChange={(e) => setSuggestions(e.target.value)} placeholder="Share feature ideas or suggestions" />
          </Row>
          <Actions>
            <Button type="button" onClick={onClose}>Close</Button>
            <Primary type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit'}</Primary>
          </Actions>
        </form>

        {error && (
          <SuccessNote style={{ color: '#fecaca' }}>{error}</SuccessNote>
        )}
        {submitted && (
          <SuccessNote>
            Thank you! We received your report/suggestions. We'll review it and prioritize your requested features.
          </SuccessNote>
        )}
      </Card>
    </Overlay>
  );
};

export default ReportBugModal;
