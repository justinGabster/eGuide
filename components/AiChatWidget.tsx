'use client';

import { useState, useRef, useEffect } from 'react';

type Message = {
  role: 'user' | 'ai';
  text: string;
};

export default function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);

  const formatMessage = (text: string) => {
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
      
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/\n/g, '<br />');

    return { __html: html };
  };
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: 'Hi! I am E.G. How can I help you navigate the Philippines today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen && messages.length > 1) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userText })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to get AI response');
      }

      setMessages(prev => [...prev, { role: 'ai', text: data.data }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'ai', text: `⚠️ Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={widgetRef} style={{ position: 'absolute', bottom: '100px', right: '16px', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>

      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="slide-up"
          style={{
            background: '#eb8123',
            border: 'none',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 0,
            transition: 'transform 0.2s',
            zIndex: 101,
            position: 'relative'
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <img src="/e.G.png" alt="E.G. Mascot" style={{
            width: '250%',
            height: '250%',
            objectFit: 'contain',
            position: 'absolute',
            bottom: '-30px',
            left: '-40px',
            pointerEvents: 'none'
          }} />
        </button>
      )}

      {/* Expanded Chat Window */}
      {isOpen && (
        <div className="glass-card slide-up" style={{
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid var(--border-color)',
          width: 'calc(100vw - 32px)',
          maxWidth: '360px',
          height: '450px',
          maxHeight: 'calc(100vh - 140px)',
          padding: 0,
          boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
          borderRadius: '20px'
        }}>
          {/* Header */}
          <div style={{ background: 'var(--primary-color)', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTopLeftRadius: '20px', borderTopRightRadius: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', color: 'white', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ background: '#eb8123', borderRadius: '50%', width: '40px', height: '40px', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <img src="/e.G.png" alt="E.G. Mascot" style={{ 
                  width: '250%', 
                  height: '250%', 
                  objectFit: 'contain', 
                  position: 'absolute', 
                  bottom: '-24px', 
                  left: '-32px' 
                }} />
              </div>
              E.G.
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer', lineHeight: '1' }}
            >
              ×
            </button>
          </div>

          {/* Messages Area */}
          <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--bg-color)' }}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  background: msg.role === 'user' ? 'var(--primary-color)' : 'var(--card-bg)',
                  color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                  border: msg.role === 'user' ? 'none' : '1px solid var(--border-color)',
                  padding: '12px 16px',
                  borderRadius: '16px',
                  borderBottomRightRadius: msg.role === 'user' ? '4px' : '16px',
                  borderBottomLeftRadius: msg.role === 'ai' ? '4px' : '16px',
                  maxWidth: '85%',
                  fontSize: '13px',
                  lineHeight: '1.5'
                }}
              >
                <span dangerouslySetInnerHTML={formatMessage(msg.text)} />
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: 'flex-start', color: 'var(--text-secondary)', fontSize: '12px', fontStyle: 'italic', padding: '8px' }}>
                E.G. is typing...
              </div>
            )}
            <div ref={messagesEndRef} style={{ height: '4px' }} />
          </div>

          {/* Input Area */}
          <div style={{ padding: '16px', background: 'var(--card-bg)', display: 'flex', gap: '8px', borderTop: '1px solid var(--border-color)' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask anything about your commute..."
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '24px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-color)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none'
              }}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              style={{
                background: 'var(--primary-color)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '42px',
                height: '42px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: (loading || !input.trim()) ? 'default' : 'pointer',
                opacity: (loading || !input.trim()) ? 0.5 : 1,
                flexShrink: 0
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
