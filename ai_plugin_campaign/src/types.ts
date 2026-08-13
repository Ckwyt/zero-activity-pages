export type CampaignTrackId = 'learning' | 'competition';

export interface StudentProfile {
  school: string;
  name: string;
  studentNumber: string;
  deviceId: string;
  loggedInAt: string;
}

export interface ActivityProgress {
  courseOpenedAt?: string;
  firstAiInteractionAt?: string;
  driveCompletedAt?: string;
  searchCompletedAt?: string;
  skinCompletedAt?: string;
  pdfCompletedAt?: string;
  summaryCompletedAt?: string;
  certificateGeneratedAt?: string;
}

export interface CampaignSession {
  profile: StudentProfile | null;
  progress: ActivityProgress;
}

export interface StudentLoginPayload {
  school: string;
  name: string;
  studentNumber: string;
  deviceId: string;
}

export interface PluginWork {
  id: string;
  title: string;
  description: string;
  author: string;
  badge: string;
  image: string;
}

// Legacy scaffold contracts retained for the preserved reusable components/services.
export type TrackId = 'plugin' | 'experience' | 'practice';
export interface CampaignTrack { id: TrackId; index: string; title: string; eyebrow: string; description: string; tags: string[]; icon: 'sparkles' | 'compass' | 'layers' }
export interface CampaignPhase { date: string; title: string; description: string; status: 'completed' | 'active' | 'upcoming' }
export interface ShowcaseWork { id: string; title: string; category: string; author: string; description: string; theme: 'violet' | 'cyan' | 'lime'; icon: 'brain' | 'wand' | 'orbit' }
export interface FaqItem { question: string; answer: string }
export interface RegistrationPayload { name: string; mobile: string; organization: string; track: TrackId; idea: string; acceptedTerms: boolean }
export interface RegistrationResult { registrationId: string; submittedAt: string }
