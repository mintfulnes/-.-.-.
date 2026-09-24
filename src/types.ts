export type ArtworkId = 'proverbs' | 'haywain' | 'anatomy' | 'sea';

export interface Artwork {
  id: ArtworkId;
  title: string;
  author: string;
  year: string;
  description: string;
  learnMore: string;
  imageSrc: string;
  videoSrc: string;
  fallbackImage: string;
  remoteFallback?: string;
  aspectRatio?: string;
  genre: string;
}

export type SurveyAnswers = Record<string, string | string[]>;

export interface SessionItemMetric {
  dwellMs: number;
  watchCompletion: number;
  liked: boolean;
  likedAt: string | null;
  learnMoreClicked: boolean;
  learnMoreClickedAt: string | null;
}

export interface Phase2Data {
  completedAt: string;
  freeRecall: string;
  responses: {
    q_haywain_meaning: string;
    q_impression: string;
  };
}

export interface SessionData {
  code: string;
  group: 'A' | 'B';
  order: ArtworkId[];
  survey: SurveyAnswers;
  startedAt: string;
  device: string;
  items: Record<ArtworkId, SessionItemMetric>;
  phase1CompletedAt?: string | null;
  phase2?: Phase2Data | null;
  updatedAt?: string;
}

export type ScreenState = 'consent' | 'survey' | 'feed' | 'phase2' | 'completion';
