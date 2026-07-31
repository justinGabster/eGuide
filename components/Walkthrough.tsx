'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

const WALKTHROUGH_STEPS = [
  {
    targetId: 'tour-theme-profile',
    title: 'E.G. Points, Theme & Profile',
    dialogue: "Hi, I'm E.G., your personal AI guide! Up here, you can view your E.G. Points, switch between Dark/Light mode, or tap your profile to tweak your account settings.",
    features: ["E.G. Points Balance: Check your current rewards points.", "Quick Theme Toggle: One-tap switching between Dark Mode and Light Mode for visual comfort.", "Account Management: View and edit personal profiles, contact details, and account credentials."]
  },
  {
    targetId: 'tour-home',
    title: 'Home',
    dialogue: "Welcome to your primary hub! Get a quick overview of your stats, tasks, and shortcuts right here.",
    features: ["Central Dashboard: Real-time summary cards for ongoing activities and balance updates.", "Quick Actions: One-tap shortcuts to access high-frequency tasks immediately.", "Personalized Feed: Dynamic news, alerts, and tailored operational updates."]
  },
  {
    targetId: 'tour-ride-pay',
    title: 'Ride & Pay',
    dialogue: "Ready to move? Ride & Pay makes booking trips and settling cashless payments completely seamless.",
    features: ["Dynamic QR Generation: Produces a unique QR code based on your trip origin and destination.", "Contactless Settlement: Integrated digital payment pipeline for instant, single-tap fare processing.", "Verified Merchants: Supports payments via GCash, Maya, GoTyme, and Visa cards."]
  },
  {
    targetId: 'tour-map',
    title: 'Map',
    dialogue: "Let's explore! The Map helps you find nearby stops, live traffic, and navigate routes effortlessly.",
    features: ["Transportation Tracking: Live map movement for trips, transit locations, and routes.", "Point of Interest (POI) Search: Locate nearby stops, terminals, and service centers quickly.", "Interactive Route View: Clear line-pathing overlaid with distance and traffic updates."]
  },
  {
    targetId: 'tour-notifications',
    title: 'Notifications',
    dialogue: "Never miss an update! Tap here for real-time trip alerts, payment receipts, and exclusive promos.",
    features: ["Push Notification Hub: Real-time alerts on trip arrivals, status shifts, and payments.", "Promotions & News: Direct feed for platform announcements and voucher updates.", "History Feed: Easily accessible record of past system messages and receipts."]
  },
  {
    targetId: 'tour-transactions',
    title: 'Transactions',
    dialogue: "Keep an eye on your activity! Your entire payment and travel history is securely stored here.",
    features: ["Detailed Expense Ledger: Itemized breakdowns of payments, refunds, and ride fares.", "Digital Receipts: Exportable receipts for personal expense reporting.", "History Filtering: Easily filter past records by date, type, or cost."]
  },
  {
    targetId: 'tour-eg-ai',
    title: 'EG AI Chatbot',
    dialogue: "And saving the best for last—me! Tap my icon anytime for quick answers, instant help, or smart recommendations.",
    features: ["24/7 Conversational Assistance: Ask questions about navigation, app features, or troubleshooting.", "In-App Navigation Guidance: Let E.G. point you directly to specific app functions.", "Contextual Suggestions: Smart, personalized help based on your current task."]
  }
];

export default function Walkthrough() {
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const startTour = useCallback(() => {
    setCurrentStep(0);
  }, []);

  const endTour = useCallback(() => {
    setCurrentStep(-1);
    localStorage.setItem('has_seen_walkthrough', 'true');
  }, []);

  useEffect(() => {
    const hasSeen = localStorage.getItem('has_seen_walkthrough');
    if (!hasSeen) {
      setTimeout(() => startTour(), 1000);
    }

    const handleTrigger = () => startTour();
    window.addEventListener('trigger-walkthrough', handleTrigger);
    return () => window.removeEventListener('trigger-walkthrough', handleTrigger);
  }, [startTour]);

  useEffect(() => {
    if (currentStep === -1) {
      setTargetRect(null);
      return;
    }

    const step = WALKTHROUGH_STEPS[currentStep];
    const updateRect = () => {
      const el = document.getElementById(step.targetId);
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect({
          top: rect.top - 8,
          left: rect.left - 8,
          width: rect.width + 16,
          height: rect.height + 16,
          bottom: rect.bottom + 8,
          right: rect.right + 8,
          x: rect.x - 8,
          y: rect.y - 8,
          toJSON: () => {}
        } as DOMRect);
      } else {
        setTargetRect(null);
      }
    };

    updateRect();

    let animationFrameId: number;
    const loop = () => {
      updateRect();
      animationFrameId = requestAnimationFrame(loop);
    };
    loop();

    return () => cancelAnimationFrame(animationFrameId);
  }, [currentStep]);

  if (currentStep === -1) return null;

  const step = WALKTHROUGH_STEPS[currentStep];
  const isLast = currentStep === WALKTHROUGH_STEPS.length - 1;

  let dialoguePosition: React.CSSProperties = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  
  if (targetRect) {
    const spaceBelow = window.innerHeight - targetRect.bottom;
    const spaceAbove = targetRect.top;
    
    if (spaceBelow > 300) {
      dialoguePosition = { top: targetRect.bottom + 16, left: '50%', transform: 'translateX(-50%)' };
    } else if (spaceAbove > 300) {
      dialoguePosition = { bottom: window.innerHeight - targetRect.top + 16, left: '50%', transform: 'translateX(-50%)' };
    } else {
      dialoguePosition = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }
  }

  const backdropStyle: React.CSSProperties = {
    position: 'fixed',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    zIndex: 99998,
    pointerEvents: 'auto',
  };

  return (
    <>
      {targetRect ? (
        <>
          <div style={{ ...backdropStyle, top: 0, left: 0, right: 0, height: Math.max(0, targetRect.top) }} />
          <div style={{ ...backdropStyle, top: targetRect.bottom, left: 0, right: 0, bottom: 0 }} />
          <div style={{ ...backdropStyle, top: targetRect.top, bottom: window.innerHeight - targetRect.bottom, left: 0, width: Math.max(0, targetRect.left) }} />
          <div style={{ ...backdropStyle, top: targetRect.top, bottom: window.innerHeight - targetRect.bottom, left: targetRect.right, right: 0 }} />
        </>
      ) : (
        <div style={{ ...backdropStyle, top: 0, left: 0, right: 0, bottom: 0 }} />
      )}

      {targetRect && (
        <div 
          style={{
            position: 'fixed',
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
            border: '2px solid var(--primary-color)',
            borderRadius: '12px',
            zIndex: 99999,
            pointerEvents: 'none',
            boxShadow: '0 0 16px var(--primary-color)',
            transition: 'all 0.2s ease-out'
          }}
        />
      )}

      <div 
        style={{
          position: 'fixed',
          ...dialoguePosition,
          zIndex: 100000,
          width: '90%',
          maxWidth: '380px',
          pointerEvents: 'auto',
          animation: 'fadeIn 0.3s ease-out'
        }}
      >
        <div 
          className="glass-card"
          style={{ 
            width: '100%',
            padding: '24px',
            paddingTop: '48px',
            position: 'relative',
            background: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '24px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.3)'
          }}
        >
          <div style={{ 
            position: 'absolute', 
            top: '-50px', 
            left: '-20px', 
            width: '110px', 
            height: '110px', 
            zIndex: 2
          }}>
            <img 
              src="/uiux/EG GIF.webp" 
              alt="E.G. Mascot"
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain',
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
              }} 
            />
          </div>
          <button 
            onClick={endTour}
            style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
            title="Skip Tour"
          >
            <X size={20} />
          </button>

          <h3 style={{ margin: '0 0 16px 0', color: 'var(--primary-color)', fontSize: '18px', fontWeight: 'bold', textAlign: 'center' }}>
            {step.title}
          </h3>
          
          <p style={{ margin: '0 0 16px 0', color: 'var(--text-primary)', fontSize: '15px', lineHeight: '1.5' }}>
            "{step.dialogue}"
          </p>

          <div style={{ background: 'rgba(0,0,0,0.05)', padding: '12px', borderRadius: '12px', marginBottom: '24px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Notable Features:</span>
            <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-primary)', fontSize: '13px', lineHeight: '1.6' }}>
              {step.features.map((feature, idx) => (
                <li key={idx}>{feature}</li>
              ))}
            </ul>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              {WALKTHROUGH_STEPS.map((_, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    background: idx === currentStep ? 'var(--primary-color)' : 'var(--border-color)',
                    transition: 'all 0.3s'
                  }} 
                />
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {currentStep > 0 && (
                <button 
                  onClick={() => setCurrentStep(s => s - 1)}
                  style={{
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-color)',
                    padding: '10px 16px',
                    borderRadius: '20px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s'
                  }}
                >
                  ‹ Back
                </button>
              )}
              <button 
                onClick={() => isLast ? endTour() : setCurrentStep(s => s + 1)}
                style={{
                  background: 'var(--primary-color)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: '20px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '14px',
                  boxShadow: '0 4px 12px rgba(45, 212, 191, 0.3)'
                }}
              >
                {isLast ? 'Finish' : 'Next ›'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
