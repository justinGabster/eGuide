'use client';

import { useState, useRef, useEffect } from 'react';

type Message = {
  role: 'user' | 'ai';
  text: string;
};

export default function AiChatWidget() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: 'Hi! I am e.G. How can I help you navigate the Philippines today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (messages.length > 1) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [messages]);



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
    <div ref={containerRef} className="glass-card fade-in" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      overflow: 'hidden', 
      border: '1px solid var(--border-color)', 
      marginTop: '16px',
      height: '350px',
      padding: 0
    }}>
      {/* Header */}
      <div style={{ background: 'var(--primary-color)', padding: '12px 16px', display: 'flex', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '14px', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/e.G.png" alt="e.G Mascot" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} /> e.G
        </h3>
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
            e.G is typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ padding: '12px', background: 'var(--card-bg)', display: 'flex', gap: '8px', borderTop: '1px solid var(--border-color)' }}>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask anything about your commute..."
          style={{ 
            flex: 1, 
            padding: '10px', 
            borderRadius: '20px', 
            border: '1px solid var(--border-color)', 
            background: 'var(--bg-color)', 
            color: 'var(--text-primary)',
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
  );
}
