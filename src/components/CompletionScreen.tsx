import React, { useState } from 'react';
import { SessionData, Phase2Data } from '../types';
import { ARTWORKS } from '../data/artworks';
import {
  CheckCircle2,
  Copy,
  Check,
  Heart,
  Clock,
  Sparkles,
  BookOpen,
  Send,
  HelpCircle
} from 'lucide-react';

interface CompletionScreenProps {
  session: SessionData;
  onSavePhase2: (phase2: Phase2Data) => Promise<void>;
  onResetSession: () => void;
}

export const CompletionScreen: React.FC<CompletionScreenProps> = ({
  session,
  onSavePhase2,
  onResetSession
}) => {
  const [copied, setCopied] = useState(false);
  const [freeRecallText, setFreeRecallText] = useState('');
  const [recallQuestion1, setRecallQuestion1] = useState('');
  const [recallQuestion2, setRecallQuestion2] = useState('');
  const [phase2Saved, setPhase2Saved] = useState(!!session.phase2);
  const [isSavingPhase2, setIsSavingPhase2] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(session.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Compute interaction summary metrics
  const totalLikedCount = Object.values(session.items || {}).filter((it) => it?.liked).length;
  const totalDwellMs = Object.values(session.items || {}).reduce(
    (acc, it) => acc + (it?.dwellMs || 0),
    0
  );
  const totalDwellSec = Math.round(totalDwellMs / 1000);

  const handlePhase2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!freeRecallText.trim()) return;

    setIsSavingPhase2(true);
    try {
      const data: Phase2Data = {
        completedAt: new Date().toISOString(),
        freeRecall: freeRecallText.trim(),
        responses: {
          q_haywain_meaning: recallQuestion1.trim(),
          q_impression: recallQuestion2.trim()
        }
      };
      await onSavePhase2(data);
      setPhase2Saved(true);
    } catch (err) {
      console.error('Error saving phase 2:', err);
    } finally {
      setIsSavingPhase2(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#2B2724] py-8 px-4 sm:px-6 md:px-8 max-w-3xl mx-auto space-y-8">
      {/* Thank you card */}
      <div className="bg-white border border-[#E5DDD0] rounded-3xl p-6 sm:p-10 shadow-sm text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-[#F3EBE0] text-[#8F4F24] flex items-center justify-center mx-auto ring-8 ring-[#F9F5EF]">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div className="space-y-2">
          <span className="text-xs uppercase font-bold tracking-widest text-[#8F4F24] bg-[#FAF2EB] px-3 py-1 rounded-full">
            Перший етап успішно завершено
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1E1A17] pt-2">
            Щиро дякуємо за ваш внесок у науку!
          </h1>
          <p className="text-sm sm:text-base text-[#6E6254] max-w-lg mx-auto leading-relaxed">
            Ваші відповіді та метрики взаємодії з творами успішно зафіксовані в базі даних дослідження та будуть використані для шкільної наукової роботи (МАН).
          </p>
        </div>

        {/* Code Reminder */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF7F2] border border-[#EBE3D7] max-w-sm mx-auto flex flex-col items-center gap-2">
          <div className="text-xs text-[#8A7D6F] font-semibold uppercase tracking-wider">
            Ваш персональний код сесії
          </div>
          <div className="font-mono text-3xl font-extrabold text-[#8F4F24] tracking-widest">
            {session.code}
          </div>
          <button
            type="button"
            onClick={handleCopyCode}
            className="inline-flex items-center gap-1.5 text-xs text-[#5D5040] hover:text-[#2B2724] bg-white px-3 py-1.5 rounded-full border border-[#DCD3C5] shadow-xs cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Код скопійовано!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Скопіювати для звіту</span>
              </>
            )}
          </button>
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EFECE5]">
            <div className="text-[11px] uppercase font-bold text-[#8A7D6F]">Група</div>
            <div className="text-lg font-bold text-[#1F1C1A]">
              Група {session.group}
            </div>
            <div className="text-[11px] text-[#786D61]">
              {session.group === 'A' ? 'Музейний' : 'Reels-відео'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EFECE5]">
            <div className="text-[11px] uppercase font-bold text-[#8A7D6F]">Вподобано</div>
            <div className="text-lg font-bold text-rose-600 flex items-center justify-center gap-1">
              <Heart className="w-4 h-4 fill-rose-600" />
              <span>{totalLikedCount} з 4</span>
            </div>
            <div className="text-[11px] text-[#786D61]">твори</div>
          </div>

          <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EFECE5]">
            <div className="text-[11px] uppercase font-bold text-[#8A7D6F]">Час уваги</div>
            <div className="text-lg font-bold text-[#1F1C1A] flex items-center justify-center gap-1">
              <Clock className="w-4 h-4 text-[#8F4F24]" />
              <span>{totalDwellSec} с</span>
            </div>
            <div className="text-[11px] text-[#786D61]">загальний dwell time</div>
          </div>

          <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EFECE5]">
            <div className="text-[11px] uppercase font-bold text-[#8A7D6F]">Творів переглянуто</div>
            <div className="text-lg font-bold text-emerald-700">4 / 4</div>
            <div className="text-[11px] text-[#786D61]">100% експозиції</div>
          </div>
        </div>

        {/* Artwork summary pills */}
        <div className="text-left border-t border-[#EBE4D8] pt-4 space-y-2">
          <div className="text-xs uppercase font-bold text-[#8A7D6F]">
            Переглянуті картини у вашому порядку:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {session.order.map((id, idx) => {
              const art = ARTWORKS[id];
              const itemMetric = session.items?.[id];
              return (
                <div
                  key={id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-[#FAF8F5] border border-[#ECE5DA]"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-4 h-4 rounded-full bg-[#E5DCD0] text-[10px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="truncate font-medium">{art.title}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {itemMetric?.liked && <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />}
                    {itemMetric?.learnMoreClicked && (
                      <span className="text-[10px] bg-[#EAE2D5] px-1.5 py-0.5 rounded text-[#5D5040]">
                        Більше
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Phase 2: Memory & Free Recall (optional / instructions from teacher) */}
      <div className="bg-white border border-[#E5DDD0] rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-[#F3ECE1] text-[#8F4F24] flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1E1A17]">
              Другий етап: Перевірка сприйняття та пам&apos;яті
            </h2>
            <p className="text-xs sm:text-sm text-[#6F6354] leading-relaxed mt-0.5">
              Якщо керівник дослідження або вчитель доручив вам заповнити другий етап (відтворення з пам&apos;яті без повернення до картин), заповніть форму нижче:
            </p>
          </div>
        </div>

        {phase2Saved ? (
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <Check className="w-5 h-5 text-emerald-600" />
              <span>Відповіді другого етапу успішно збережено в протоколі!</span>
            </div>
            <p className="text-xs text-emerald-800">
              Ваші текстові відгуки додано до документу сесії. Дослідження завершено повністю.
            </p>
          </div>
        ) : (
          <form onSubmit={handlePhase2Submit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-semibold text-[#2B2724] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#8F4F24]" />
                1. Вільне пригадування: що найбільше запам&apos;яталося з побаченого?
              </label>
              <textarea
                value={freeRecallText}
                onChange={(e) => setFreeRecallText(e.target.value)}
                placeholder="Опишіть сюжети, кольори, окремі образи чи деталі картин, які ви запам'ятали..."
                rows={4}
                required
                className="w-full p-3.5 rounded-xl border border-[#D9CFC1] bg-[#FAF8F5] text-sm text-[#2B2724] focus:bg-white focus:ring-2 focus:ring-[#8F4F24]/30 focus:border-[#8F4F24] outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-semibold text-[#2B2724] flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-[#8F4F24]" />
                2. Що символізував віз сіна на картині Ієроніма Босха?
              </label>
              <input
                type="text"
                value={recallQuestion1}
                onChange={(e) => setRecallQuestion1(e.target.value)}
                placeholder="Ваша відповідь з пам'яті..."
                className="w-full p-3 rounded-xl border border-[#D9CFC1] bg-[#FAF8F5] text-sm text-[#2B2724] focus:bg-white focus:ring-2 focus:ring-[#8F4F24]/30 focus:border-[#8F4F24] outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-semibold text-[#2B2724] flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-[#8F4F24]" />
                3. Яке враження справив на вас формат перегляду (традиційний чи відео)?
              </label>
              <input
                type="text"
                value={recallQuestion2}
                onChange={(e) => setRecallQuestion2(e.target.value)}
                placeholder="Чи було зручно, що сподобалося, а що заважало..."
                className="w-full p-3 rounded-xl border border-[#D9CFC1] bg-[#FAF8F5] text-sm text-[#2B2724] focus:bg-white focus:ring-2 focus:ring-[#8F4F24]/30 focus:border-[#8F4F24] outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSavingPhase2 || !freeRecallText.trim()}
              className={`w-full py-3.5 px-6 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                freeRecallText.trim() && !isSavingPhase2
                  ? 'bg-[#8F4F24] hover:bg-[#783F1A] text-white active:scale-[0.99]'
                  : 'bg-[#E3DCD1] text-[#8C8072] cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>{isSavingPhase2 ? 'Збереження...' : 'Зберегти відповіді другого етапу'}</span>
            </button>
          </form>
        )}
      </div>

      {/* Start new participant button */}
      <div className="text-center pt-2 pb-8">
        <button
          type="button"
          onClick={onResetSession}
          className="text-xs sm:text-sm text-[#7F7466] hover:text-[#2B2724] underline underline-offset-4 cursor-pointer"
        >
          Розпочати нову сесію для іншого учасника
        </button>
      </div>
    </div>
  );
};
