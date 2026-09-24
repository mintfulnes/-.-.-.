import React, { useState, useEffect } from 'react';
import { Phase2Data } from '../types';
import { BookOpen, Send, Sparkles, HelpCircle, CheckCircle2 } from 'lucide-react';

interface Phase2ScreenProps {
  onSubmit: (data: Phase2Data) => Promise<void>;
  isSubmitting?: boolean;
}

export const Phase2Screen: React.FC<Phase2ScreenProps> = ({ onSubmit, isSubmitting = false }) => {
  const [freeRecallText, setFreeRecallText] = useState('');
  const [recallQuestion1, setRecallQuestion1] = useState('');
  const [recallQuestion2, setRecallQuestion2] = useState('');

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  const isValid =
    freeRecallText.trim().length > 3 &&
    recallQuestion1.trim().length > 1 &&
    recallQuestion2.trim().length > 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    const data: Phase2Data = {
      completedAt: new Date().toISOString(),
      freeRecall: freeRecallText.trim(),
      responses: {
        q_haywain_meaning: recallQuestion1.trim(),
        q_impression: recallQuestion2.trim()
      }
    };

    await onSubmit(data);
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#2B2724] py-6 px-4 sm:px-6 md:px-8 max-w-2xl mx-auto flex flex-col justify-center">
      <div className="bg-white border border-[#E5DDD0] rounded-3xl p-6 sm:p-9 shadow-xs space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF3EC] text-[#8F4F24] text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>2-й етап</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1E1A17]">
            Відтворення з пам&apos;яті та враження
          </h1>
          <p className="text-xs sm:text-sm text-[#6C6053] leading-relaxed">
            Будь ласка, дайте відповіді на наступні 3 запитання з пам&apos;яті, не повертаючись до картин. Це допоможе дослідити особливості запам&apos;ятовування мистецького контенту.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-semibold text-[#1E1A17] flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-[#8F4F24] text-white text-xs font-bold flex items-center justify-center shrink-0">
                1
              </span>
              <span>Вільне пригадування: що вам запам&apos;яталося найбільше? *</span>
            </label>
            <textarea
              value={freeRecallText}
              onChange={(e) => setFreeRecallText(e.target.value)}
              placeholder="Опишіть сюжет, колір або образ, що спадає на думку..."
              rows={3}
              required
              className="w-full p-3 rounded-xl border border-[#D9CFC1] bg-[#FAF8F5] text-xs sm:text-sm text-[#2B2724] focus:bg-white focus:ring-2 focus:ring-[#8F4F24]/30 focus:border-[#8F4F24] outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-semibold text-[#1E1A17] flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-[#8F4F24] text-white text-xs font-bold flex items-center justify-center shrink-0">
                2
              </span>
              <span>Що символізував віз сіна на картині Ієроніма Босха? *</span>
            </label>
            <input
              type="text"
              value={recallQuestion1}
              onChange={(e) => setRecallQuestion1(e.target.value)}
              placeholder="Наприклад: марні земні блага, людську жадібність тощо..."
              required
              className="w-full p-2.5 sm:p-3 rounded-xl border border-[#D9CFC1] bg-[#FAF8F5] text-xs sm:text-sm text-[#2B2724] focus:bg-white focus:ring-2 focus:ring-[#8F4F24]/30 focus:border-[#8F4F24] outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-semibold text-[#1E1A17] flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-[#8F4F24] text-white text-xs font-bold flex items-center justify-center shrink-0">
                3
              </span>
              <span>Які враження справив на вас формат показу творів? *</span>
            </label>
            <input
              type="text"
              value={recallQuestion2}
              onChange={(e) => setRecallQuestion2(e.target.value)}
              placeholder="Чи було зручно, чи допомогло це сприйняти мистецтво..."
              required
              className="w-full p-2.5 sm:p-3 rounded-xl border border-[#D9CFC1] bg-[#FAF8F5] text-xs sm:text-sm text-[#2B2724] focus:bg-white focus:ring-2 focus:ring-[#8F4F24]/30 focus:border-[#8F4F24] outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className={`w-full py-4 px-6 rounded-xl font-medium text-base transition-all duration-200 flex items-center justify-center gap-2 shadow-sm ${
              isValid && !isSubmitting
                ? 'bg-[#8F4F24] hover:bg-[#783F1A] text-white cursor-pointer active:scale-[0.99]'
                : 'bg-[#E3DCD1] text-[#8C8072] cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>
              {isSubmitting
                ? 'Збереження результатів...'
                : isValid
                ? 'Завершити дослідження та надіслати'
                : 'Заповніть усі 3 поля для завершення'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};
