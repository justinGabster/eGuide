'use client';

import { useState, useRef, useEffect } from 'react';

type Message = {
  role: 'user' | 'ai';
  text: string;
};

export default function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: 'Hi! I am your eGuide AI Assistant. How can I help you navigate the Philippines today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    <div style={{ position: 'fixed', bottom: '85px', right: '16px', zIndex: 1000 }}>
      {/* Chat Window */}
      {isOpen && (
        <div 
          className="glass-card fade-in"
          style={{
            position: 'absolute',
            bottom: '60px',
            right: '0',
            width: '300px',
            height: '400px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}
        >
          {/* Header */}
          <div style={{ background: 'var(--primary-color)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '14px', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🤖</span> eGov AI Assistant
            </h3>
            <button 
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '16px' }}
            >
              ✕
            </button>
          </div>

          {/* Messages Area */}
          <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(0,0,0,0.4)' }}>
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                style={{ 
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  background: msg.role === 'user' ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)',
                  color: 'white',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  maxWidth: '85%',
                  fontSize: '13px',
                  lineHeight: '1.4'
                }}
              >
                {msg.text}
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: 'flex-start', color: 'var(--text-secondary)', fontSize: '12px', fontStyle: 'italic' }}>
                AI is typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{ padding: '12px', background: 'rgba(0,0,0,0.6)', display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask anything..."
              style={{ 
                flex: 1, 
                padding: '10px', 
                borderRadius: '20px', 
                border: '1px solid rgba(255,255,255,0.2)', 
                background: 'rgba(0,0,0,0.3)', 
                color: 'white',
                fontSize: '13px'
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
                width: '38px', 
                height: '38px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                cursor: (loading || !input.trim()) ? 'default' : 'pointer',
                opacity: (loading || !input.trim()) ? 0.5 : 1
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="btn-primary"
        style={{
          width: '50px',
          height: '50px',
          borderRadius: '25px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          padding: 0
        }}
      >
        {isOpen ? '✕' : '🤖'}
      </button>
    </div>
  );
}
