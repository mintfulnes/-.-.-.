/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ScreenState,
  SessionData,
  SurveyAnswers,
  ArtworkId,
  SessionItemMetric,
  Phase2Data
} from './types';
import { ConsentScreen } from './components/ConsentScreen';
import { SurveyScreen } from './components/SurveyScreen';
import { CodeRevealScreen } from './components/CodeRevealScreen';
import { FeedFormatA } from './components/FeedFormatA';
import { FeedFormatB } from './components/FeedFormatB';
import { CompletionScreen } from './components/CompletionScreen';
import { ResearcherModal } from './components/ResearcherModal';
import {
  testConnection,
  createSessionDoc,
  updateSessionDoc,
  getSessionDoc
} from './firebase';
import {
  generateParticipantCode,
  assignGroup,
  shuffleArtworkOrder
} from './utils/codeGenerator';
import { Database, Shield } from 'lucide-react';

export default function App() {
  const [screen, setScreen] = useState<ScreenState>('consent');
  const [session, setSession] = useState<SessionData | null>(null);
  const [isSubmittingSurvey, setIsSubmittingSurvey] = useState(false);
  const [isResearcherModalOpen, setIsResearcherModalOpen] = useState(false);

  // Buffer ref to avoid excessive Firestore writes on rapid updates
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestSessionRef = useRef<SessionData | null>(null);
  latestSessionRef.current = session;

  // Initial connection test as mandated by Firebase skill
  useEffect(() => {
    testConnection();
  }, []);

  // Periodic or debounced sync of items to Firestore
  const syncItemsToFirestore = useCallback((code: string, items: Record<ArtworkId, SessionItemMetric>) => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    syncTimeoutRef.current = setTimeout(async () => {
      try {
        await updateSessionDoc(code, {
          items,
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Failed background items sync to Firestore:', err);
      }
    }, 600);
  }, []);

  // Handler for Survey completion -> generate participant code and create Firestore session doc
  const handleSurveyComplete = async (surveyAnswers: SurveyAnswers) => {
    setIsSubmittingSurvey(true);
    try {
      const code = generateParticipantCode();
      const group = assignGroup();
      const order = shuffleArtworkOrder();

      const initialItems: Record<ArtworkId, SessionItemMetric> = {
        proverbs: {
          dwellMs: 0,
          watchCompletion: 0,
          liked: false,
          likedAt: null,
          learnMoreClicked: false,
          learnMoreClickedAt: null
        },
        haywain: {
          dwellMs: 0,
          watchCompletion: 0,
          liked: false,
          likedAt: null,
          learnMoreClicked: false,
          learnMoreClickedAt: null
        },
        anatomy: {
          dwellMs: 0,
          watchCompletion: 0,
          liked: false,
          likedAt: null,
          learnMoreClicked: false,
          learnMoreClickedAt: null
        },
        sea: {
          dwellMs: 0,
          watchCompletion: 0,
          liked: false,
          likedAt: null,
          learnMoreClicked: false,
          learnMoreClickedAt: null
        }
      };

      const newSession: SessionData = {
        code,
        group,
        order,
        survey: surveyAnswers,
        startedAt: new Date().toISOString(),
        device: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
        items: initialItems,
        phase1CompletedAt: null,
        phase2: null
      };

      // Write session doc to Firestore
      await createSessionDoc(code, {
        group: newSession.group,
        order: newSession.order,
        survey: newSession.survey,
        startedAt: newSession.startedAt,
        device: newSession.device,
        items: newSession.items
      });

      setSession(newSession);
      setScreen('code_reveal');
    } catch (error) {
      console.error('Error creating research session in Firestore:', error);
      alert('Не вдалося зʼєднатися з базою даних для створення сесії. Перевірте підключення до Інтернету.');
    } finally {
      setIsSubmittingSurvey(false);
    }
  };

  // Update item metrics (dwell time, likes, completion, learn more)
  const handleUpdateItemMetric = useCallback(
    (id: ArtworkId, updater: (prev: SessionItemMetric) => SessionItemMetric) => {
      setSession((prevSession) => {
        if (!prevSession) return null;
        const currentItem = prevSession.items[id] || {
          dwellMs: 0,
          watchCompletion: 0,
          liked: false,
          likedAt: null,
          learnMoreClicked: false,
          learnMoreClickedAt: null
        };
        const updatedItem = updater(currentItem);
        const updatedItems = {
          ...prevSession.items,
          [id]: updatedItem
        };

        // Trigger debounced Firestore update
        syncItemsToFirestore(prevSession.code, updatedItems);

        return {
          ...prevSession,
          items: updatedItems
        };
      });
    },
    [syncItemsToFirestore]
  );

  // Finish feed: record phase1CompletedAt
  const handleFinishFeed = async () => {
    if (!session) return;
    const nowIso = new Date().toISOString();

    const updatedSession: SessionData = {
      ...session,
      phase1CompletedAt: nowIso
    };
    setSession(updatedSession);
    setScreen('completion');

    // Immediately flush to Firestore
    try {
      await updateSessionDoc(session.code, {
        phase1CompletedAt: nowIso,
        items: updatedSession.items,
        updatedAt: nowIso
      });
    } catch (err) {
      console.error('Error writing phase1CompletedAt to Firestore:', err);
    }
  };

  // Phase 2 persistence
  const handleSavePhase2 = async (phase2Data: Phase2Data) => {
    if (!session) return;
    const updatedSession: SessionData = {
      ...session,
      phase2: phase2Data
    };
    setSession(updatedSession);
    await updateSessionDoc(session.code, {
      phase2: phase2Data,
      updatedAt: new Date().toISOString()
    });
  };

  // Resume an existing session by code
  const handleResumeCode = async (code: string) => {
    try {
      const data = await getSessionDoc(code);
      if (data) {
        const loadedSession: SessionData = {
          code,
          group: data.group,
          order: data.order,
          survey: data.survey,
          startedAt: data.startedAt,
          device: data.device,
          items: data.items,
          phase1CompletedAt: data.phase1CompletedAt,
          phase2: data.phase2
        };
        setSession(loadedSession);
        if (loadedSession.phase1CompletedAt) {
          setScreen('completion');
        } else {
          setScreen('feed');
        }
      } else {
        alert(`Сесію з кодом "${code}" не знайдено.`);
      }
    } catch (err) {
      console.error('Error resuming session:', err);
      alert('Помилка завантаження сесії з бази даних.');
    }
  };

  const handleResetSession = () => {
    setSession(null);
    setScreen('consent');
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#2B2724] flex flex-col font-sans selection:bg-[#EAE2D5]">
      {/* Screen Router */}
      <div className="flex-1">
        {screen === 'consent' && (
          <ConsentScreen
            onStart={() => setScreen('survey')}
            onResumeCode={handleResumeCode}
          />
        )}

        {screen === 'survey' && (
          <SurveyScreen
            onComplete={handleSurveyComplete}
            isSubmitting={isSubmittingSurvey}
          />
        )}

        {screen === 'code_reveal' && session && (
          <CodeRevealScreen
            code={session.code}
            group={session.group}
            onContinue={() => setScreen('feed')}
          />
        )}

        {screen === 'feed' && session && (
          <>
            {session.group === 'A' ? (
              <FeedFormatA
                order={session.order}
                initialItems={session.items}
                onUpdateItemMetric={handleUpdateItemMetric}
                onFinishFeed={handleFinishFeed}
              />
            ) : (
              <FeedFormatB
                order={session.order}
                initialItems={session.items}
                onUpdateItemMetric={handleUpdateItemMetric}
                onFinishFeed={handleFinishFeed}
              />
            )}
          </>
        )}

        {screen === 'completion' && session && (
          <CompletionScreen
            session={session}
            onSavePhase2={handleSavePhase2}
            onResetSession={handleResetSession}
          />
        )}
      </div>

      {/* Persistent Academic Footnote (hidden during full-screen feed for immersion) */}
      {screen !== 'feed' && (
        <footer className="py-4 px-6 border-t border-[#EAE3D6] text-center text-xs text-[#8A7E71] flex flex-col sm:flex-row items-center justify-between gap-3 max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#8F4F24]" />
            <span>Анонімне наукове дослідження • Мистецтво в соціальних мережах</span>
          </div>
          <button
            type="button"
            onClick={() => setIsResearcherModalOpen(true)}
            className="flex items-center gap-1 text-[#8F4F24] hover:text-[#6E3C1A] underline underline-offset-4 cursor-pointer"
          >
            <Database className="w-3 h-3" />
            <span>Панель дослідника (МАН)</span>
          </button>
        </footer>
      )}

      {/* Researcher Modal */}
      <ResearcherModal
        isOpen={isResearcherModalOpen}
        onClose={() => setIsResearcherModalOpen(false)}
        currentSessionCode={session?.code || ''}
      />
    </div>
  );
}
