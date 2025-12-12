export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface Finding {
  parameter: string;
  value: string;
  unit?: string;
  referenceRange?: string; 
  status: 'Normal' | 'Warning' | 'Critical' | 'Unknown';
  interpretation: string;
  category?: string;
}

export interface AnalysisResult {
  summary: string;
  findings: Finding[];
  researchContext: string;
  patientAdvice: string[];
  disclaimer: string;
}

export interface UploadedFile {
  file: File;
  previewUrl: string;
  base64?: string; 
  textContent?: string;
  mimeType: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isTyping?: boolean;
}

// User & Data Types

export type Sex = 'Male' | 'Female' | 'Other' | 'Prefer not to say';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  image?: string;
  sex?: Sex;
  healthHistory?: string[];
  createdAt: string;
}

export interface SavedReport {
  id: string;
  userId?: string; // If null, it's a guest report locally stored
  timestamp: string;
  fileName: string;
  fileType: string; // 'application/pdf', 'image/png', or 'symptom-check'
  result: AnalysisResult; // We will map symptom results to this structure for consistent storage
}

// Symptom Checker Types

export interface SymptomInput {
  symptoms: string[];
  duration: string;
  severity: 'Mild' | 'Moderate' | 'Severe';
  age: string;
  sex: string;
  history: string;
  activity: string;
}

export interface SymptomCondition {
  name: string;
  probability: 'Low' | 'Medium' | 'High';
  description: string;
  matching_symptoms: string[];
}

export interface SymptomCheckResult {
  conditions: SymptomCondition[];
  severity_level: 'Low' | 'Medium' | 'High';
  recommendations: {
    self_care: string[];
    doctor_visit: string;
    emergency: string;
  };
  disclaimer: string;
}

// --- New Features Types ---

export interface DailyLogEntry {
  id: string;
  userId: string;
  date: string; // ISO Date string
  mood: number; // 1-5
  stress: number; // 1-5
  sleepQuality: number; // 1-5
  pain: number; // 1-5
  energy: number; // 1-5
  notes?: string;
  
  // Wearable Data (Manual Integration)
  steps?: number;
  heartRate?: number; // bpm
  sleepHours?: number;
  calories?: number;
}

export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

export interface EmergencyProfile {
  userId: string;
  bloodGroup: string;
  allergies: string[];
  medications: string[];
  chronicConditions: string[];
  contacts: EmergencyContact[];
  doctorName?: string;
  doctorPhone?: string;
}

export type TimelineEventType = 'report' | 'log' | 'symptom_check';

export interface TimelineEvent {
  id: string;
  date: string;
  type: TimelineEventType;
  title: string;
  summary: string;
  details?: any; // Points to the full object (Report or Log)
}

export interface HealthInsight {
  type: 'pattern' | 'improvement' | 'warning';
  title: string;
  description: string;
}

export interface RiskAssessment {
  score: number; // 0-100
  level: 'Low' | 'Moderate' | 'High' | 'Severe';
  title: string;
  description: string;
  suggestions: string[];
}
