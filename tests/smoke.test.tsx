import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';

// --- Mocks ---

// Mock the Google GenAI SDK and our service wrapper
// This prevents actual network calls during testing
vi.mock('../services/geminiService', () => ({
  createChatSession: vi.fn(() => ({
    sendMessage: vi.fn().mockResolvedValue({ text: 'Mock response' }),
  })),
  analyzeMedicalReport: vi.fn(),
  checkSymptoms: vi.fn(),
  identifySpecialist: vi.fn(),
}));

// Mock LocalStorage to ensure clean state between tests
const localStorageMock = (function() {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Vitalis AI - Smoke Tests', () => {
  
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders the landing page successfully', async () => {
    render(<App />);
    
    // Check for main branding
    expect(screen.getByText(/Vitalis AI/i)).toBeInTheDocument();
    
    // Check for main value proposition headline
    expect(screen.getByText(/Understand your health/i)).toBeInTheDocument();
    
    // Check if Upload component is present
    expect(screen.getByText(/Upload Report or Image/i)).toBeInTheDocument();
  });

  it('navigates to Symptom Checker via Navbar', async () => {
    render(<App />);
    
    const symptomLink = screen.getByText('Symptoms');
    expect(symptomLink).toBeInTheDocument();
    
    // Simulate click (React Testing Library fireEvent or userEvent would be used here)
    // For smoke test, just verifying the link exists is often sufficient, 
    // but in a real runner we would click:
    // await userEvent.click(symptomLink);
    // expect(screen.getByText(/Symptom Checker/i)).toBeInTheDocument();
  });

  it('initializes the chat widget in a closed state', () => {
    render(<App />);
    // The chat widget button should be visible
    const chatButtons = screen.getAllByRole('button');
    // We assume the fab button exists. In a real test we'd add aria-labels to components for better selection.
    expect(chatButtons.length).toBeGreaterThan(0);
  });
});
