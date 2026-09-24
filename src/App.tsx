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
import { FeedFormatA } from './components/FeedFormatA';
import { FeedFormatB } from './components/FeedFormatB';
import { Phase2Screen } from './components/Phase2Screen';
import { CompletionScreen } from './components/CompletionScreen';
import { ResearcherModal } from './components/ResearcherModal';
import {
  testConnection,
  createSessionDoc,
  updateSessionDoc
} from './firebase';
import {
  generateParticipantCode,
  assignGroup,
  shuffleArtworkOrder
} from './utils/codeGenerator';

export default function App() {
  const [screen, setScreen] = useState<ScreenState>('consent');
  const [session, setSession] = useState<SessionData | null>(null);
  const [isSubmittingSurvey, setIsSubmittingSurvey] = useState(false);
  const [isSubmittingPhase2, setIsSubmittingPhase2] = useState(false);
  const [isResearcherModalOpen, setIsResearcherModalOpen] = useState(false);

  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    testConnection();
  }, []);

  const syncItemsToFirestore = useCallback(
    (code: string, items: Record<ArtworkId, SessionItemMetric>) => {
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
          console.warn('Failed background items sync:', err);
        }
      }, 500);
    },
    []
  );

  // Survey Complete -> directly start Feed (no intermediate code screen)
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

      await createSessionDoc(code, {
        group: newSession.group,
        order: newSession.order,
        survey: newSession.survey,
        startedAt: newSession.startedAt,
        device: newSession.device,
        items: newSession.items
      });

      setSession(newSession);
      // Navigate directly to Feed!
      setScreen('feed');
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Помилка підключення до бази даних. Будь ласка, спробуйте ще раз.');
    } finally {
      setIsSubmittingSurvey(false);
    }
  };

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

        syncItemsToFirestore(prevSession.code, updatedItems);

        return {
          ...prevSession,
          items: updatedItems
        };
      });
    },
    [syncItemsToFirestore]
  );

  // Feed finished -> navigate directly to mandatory Phase 2 (no intermediate thank-you)
  const handleFinishFeed = async () => {
    if (!session) return;
    const nowIso = new Date().toISOString();

    const updatedSession: SessionData = {
      ...session,
      phase1CompletedAt: nowIso
    };
    setSession(updatedSession);
    // Go directly to mandatory Phase 2
    setScreen('phase2');

    try {
      await updateSessionDoc(session.code, {
        phase1CompletedAt: nowIso,
        items: updatedSession.items,
        updatedAt: nowIso
      });
    } catch (err) {
      console.error('Error updating feed progress:', err);
    }
  };

  // Phase 2 submitted -> now navigate to final thank-you screen!
  const handlePhase2Submit = async (phase2Data: Phase2Data) => {
    if (!session) return;
    setIsSubmittingPhase2(true);
    try {
      const updatedSession: SessionData = {
        ...session,
        phase2: phase2Data
      };
      setSession(updatedSession);

      await updateSessionDoc(session.code, {
        phase2: phase2Data,
        updatedAt: new Date().toISOString()
      });

      // Finally show completion thank-you screen!
      setScreen('completion');
    } catch (err) {
      console.error('Error saving phase 2:', err);
      alert('Не вдалося зберегти відповіді. Спробуйте ще раз.');
    } finally {
      setIsSubmittingPhase2(false);
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
            onOpenResearcherModal={() => setIsResearcherModalOpen(true)}
          />
        )}

        {screen === 'survey' && (
          <SurveyScreen
            onComplete={handleSurveyComplete}
            isSubmitting={isSubmittingSurvey}
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

        {screen === 'phase2' && session && (
          <Phase2Screen
            onSubmit={handlePhase2Submit}
            isSubmitting={isSubmittingPhase2}
          />
        )}

        {screen === 'completion' && session && (
          <CompletionScreen
            session={session}
            onResetSession={handleResetSession}
          />
        )}
      </div>

      {/* Discreet Researcher Link in footer on non-fullscreen screens */}
      {screen !== 'feed' && (
        <footer className="py-3 px-4 text-center text-xs text-[#8A7E71] flex items-center justify-between max-w-2xl mx-auto w-full border-t border-[#EAE3D6]/70">
          <span className="text-[11px] text-[#A69B8E]">
            Шкільне наукове дослідження (МАН)
          </span>
          <button
            type="button"
            onClick={() => setIsResearcherModalOpen(true)}
            className="text-[11px] text-[#8F4F24] hover:text-[#5F3011] underline underline-offset-4 cursor-pointer"
          >
            Панель керівника (МАН)
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
