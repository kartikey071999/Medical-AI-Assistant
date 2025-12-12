import { SavedReport, UserProfile, AnalysisResult, DailyLogEntry, EmergencyProfile, TimelineEvent, ChatMessage } from '../types';

// Keys for LocalStorage
const USERS_KEY = 'vitalis_users';
const REPORTS_KEY = 'vitalis_reports';
const LOGS_KEY = 'vitalis_daily_logs';
const EMERGENCY_KEY = 'vitalis_emergency_info';
const CURRENT_USER_KEY = 'vitalis_current_user_id';
const CHAT_HISTORY_KEY = 'vitalis_chat_history';

// Simulating API Latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- User Management ---

export const saveUserProfile = async (profile: UserProfile): Promise<UserProfile> => {
  await delay(300);
  const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
  users[profile.id] = profile;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  
  // Update session
  if (getCurrentUserId() === profile.id) {
     localStorage.setItem('vitalis_session_user', JSON.stringify(profile));
  }
  return profile;
};

export const getUserProfile = async (id: string): Promise<UserProfile | null> => {
  await delay(200);
  const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
  return users[id] || null;
};

export const getCurrentUserId = (): string | null => {
  return localStorage.getItem(CURRENT_USER_KEY);
};

export const setCurrentUserId = (id: string | null) => {
  if (id) {
    localStorage.setItem(CURRENT_USER_KEY, id);
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
};

// --- Chat Memory Management (New) ---

export const saveUserChatHistory = async (userId: string, messages: ChatMessage[]): Promise<void> => {
  // No delay for chat to keep it snappy
  const allChats = JSON.parse(localStorage.getItem(CHAT_HISTORY_KEY) || '{}');
  // Keep only last 50 messages to manage storage size
  const prunedMessages = messages.slice(-50);
  allChats[userId] = prunedMessages;
  localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(allChats));
};

export const getUserChatHistory = async (userId: string): Promise<ChatMessage[]> => {
  const allChats = JSON.parse(localStorage.getItem(CHAT_HISTORY_KEY) || '{}');
  return allChats[userId] || [];
};

export const clearUserChatHistory = async (userId: string): Promise<void> => {
  const allChats = JSON.parse(localStorage.getItem(CHAT_HISTORY_KEY) || '{}');
  delete allChats[userId];
  localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(allChats));
};

// --- Report Management ---

export const saveReport = async (report: Omit<SavedReport, 'id' | 'timestamp'> & { id?: string }): Promise<SavedReport> => {
  await delay(400);
  const reports: SavedReport[] = JSON.parse(localStorage.getItem(REPORTS_KEY) || '[]');
  
  const newReport: SavedReport = {
    ...report,
    id: report.id || Date.now().toString(),
    timestamp: new Date().toISOString(),
  };

  const existingIndex = reports.findIndex(r => r.id === newReport.id);
  if (existingIndex >= 0) {
    reports[existingIndex] = newReport;
  } else {
    reports.push(newReport);
  }

  localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
  return newReport;
};

export const getUserReports = async (userId: string): Promise<SavedReport[]> => {
  await delay(300);
  const reports: SavedReport[] = JSON.parse(localStorage.getItem(REPORTS_KEY) || '[]');
  return reports.filter(r => r.userId === userId).sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
};

export const deleteReport = async (reportId: string): Promise<void> => {
  await delay(200);
  const reports: SavedReport[] = JSON.parse(localStorage.getItem(REPORTS_KEY) || '[]');
  const filtered = reports.filter(r => r.id !== reportId);
  localStorage.setItem(REPORTS_KEY, JSON.stringify(filtered));
};

export const deleteAllUserReports = async (userId: string): Promise<void> => {
    await delay(500);
    const reports: SavedReport[] = JSON.parse(localStorage.getItem(REPORTS_KEY) || '[]');
    const filtered = reports.filter(r => r.userId !== userId);
    localStorage.setItem(REPORTS_KEY, JSON.stringify(filtered));
};

// --- Daily Logs (New) ---

export const saveDailyLog = async (log: Omit<DailyLogEntry, 'id'>): Promise<DailyLogEntry> => {
    await delay(300);
    const logs: DailyLogEntry[] = JSON.parse(localStorage.getItem(LOGS_KEY) || '[]');
    
    // Check if log exists for this date (prevent duplicates per day if needed, or just append)
    // Here we'll just append for simplicity, but in a real app we might update
    const newLog: DailyLogEntry = {
        ...log,
        id: Date.now().toString()
    };
    
    logs.push(newLog);
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
    return newLog;
};

export const getUserLogs = async (userId: string): Promise<DailyLogEntry[]> => {
    await delay(200);
    const logs: DailyLogEntry[] = JSON.parse(localStorage.getItem(LOGS_KEY) || '[]');
    return logs.filter(l => l.userId === userId).sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );
};

// --- Emergency Info (New) ---

export const saveEmergencyProfile = async (info: EmergencyProfile): Promise<EmergencyProfile> => {
    await delay(400);
    const allInfo = JSON.parse(localStorage.getItem(EMERGENCY_KEY) || '{}');
    allInfo[info.userId] = info;
    localStorage.setItem(EMERGENCY_KEY, JSON.stringify(allInfo));
    return info;
};

export const getEmergencyProfile = async (userId: string): Promise<EmergencyProfile | null> => {
    await delay(200);
    const allInfo = JSON.parse(localStorage.getItem(EMERGENCY_KEY) || '{}');
    return allInfo[userId] || null;
};

// --- Timeline Aggregation (New) ---

export const getTimelineEvents = async (userId: string): Promise<TimelineEvent[]> => {
    const [reports, logs] = await Promise.all([
        getUserReports(userId),
        getUserLogs(userId)
    ]);

    const reportEvents: TimelineEvent[] = reports.map(r => ({
        id: r.id,
        date: r.timestamp,
        type: r.fileType === 'symptom-check' ? 'symptom_check' : 'report',
        title: r.fileType === 'symptom-check' ? 'Symptom Check' : `Analysis: ${r.fileName}`,
        summary: r.result.summary.substring(0, 100) + '...',
        details: r
    }));

    const logEvents: TimelineEvent[] = logs.map(l => ({
        id: l.id,
        date: l.date,
        type: 'log',
        title: 'Daily Health Log',
        summary: `Mood: ${l.mood}/5, Stress: ${l.stress}/5${l.notes ? ` - ${l.notes}` : ''}`,
        details: l
    }));

    const allEvents = [...reportEvents, ...logEvents];
    return allEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// --- Auth Simulation ---

export const mockGoogleLogin = async (): Promise<UserProfile> => {
  await delay(800);
  // Simulate a Google User
  const mockUser: UserProfile = {
    id: 'google_123456789',
    name: 'Demo User',
    email: 'demo.user@example.com',
    image: 'https://ui-avatars.com/api/?name=Demo+User&background=0D9488&color=fff',
    createdAt: new Date().toISOString(),
    sex: 'Prefer not to say',
    healthHistory: []
  };

  // Check if user exists in our "DB", if not create
  const existing = await getUserProfile(mockUser.id);
  if (!existing) {
    await saveUserProfile(mockUser);
    return mockUser;
  }
  return existing;
};