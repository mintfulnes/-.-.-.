import React, { useEffect } from 'react';
import { SessionData } from '../types';
import { CheckCircle2, Heart, Clock, Sparkles } from 'lucide-react';

interface CompletionScreenProps {
  session: SessionData;
  onResetSession: () => void;
}

export const CompletionScreen: React.FC<CompletionScreenProps> = ({
  session,
  onResetSession
}) => {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  const totalLikedCount = Object.values(session.items || {}).filter((it) => it?.liked).length;
  const totalDwellMs = Object.values(session.items || {}).reduce(
    (acc, it) => acc + (it?.dwellMs || 0),
    0
  );
  const totalDwellSec = Math.round(totalDwellMs / 1000);

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#2B2724] py-12 px-4 sm:px-6 md:px-8 max-w-xl mx-auto flex flex-col justify-center text-center space-y-6">
      <div className="bg-white border border-[#E5DDD0] rounded-3xl p-8 sm:p-10 shadow-sm space-y-6">
        <div className="w-16 h-16 rounded-full bg-[#F3EBE0] text-[#8F4F24] flex items-center justify-center mx-auto ring-8 ring-[#F9F5EF]">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF3EC] text-[#8F4F24] text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Дослідження успішно пройдено</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1E1A17] pt-1">
            Щиро дякуємо за вашу участь!
          </h1>
          <p className="text-sm sm:text-base text-[#6E6254] leading-relaxed max-w-md mx-auto">
            Ваш внесок є надзвичайно важливим для наукового дослідження (МАН) щодо трансформації сприйняття мистецтва.
          </p>
        </div>

        {/* Short Summary Cards without confusing codes */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#EFECE5]">
            <div className="text-[11px] uppercase font-bold text-[#8A7D6F]">Переглянуто картин</div>
            <div className="text-xl font-bold text-emerald-700 mt-0.5">4 з 4</div>
            <div className="text-[11px] text-[#786D61]">100% експозиції</div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#EFECE5]">
            <div className="text-[11px] uppercase font-bold text-[#8A7D6F]">Вподобано</div>
            <div className="text-xl font-bold text-rose-600 mt-0.5 flex items-center justify-center gap-1">
              <Heart className="w-4 h-4 fill-rose-600" />
              <span>{totalLikedCount}</span>
            </div>
            <div className="text-[11px] text-[#786D61]">творів</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#ECE5DA] text-xs text-[#5C5042] leading-relaxed">
          Усі етапи дослідження завершено: вхідне анкетування, перегляд творів та завдання на відтворення збережено. Ви можете закрити цю вкладку.
        </div>

        <button
          type="button"
          onClick={onResetSession}
          className="text-xs text-[#8F7F6E] hover:text-[#2B2724] underline underline-offset-4 cursor-pointer pt-2"
        >
          Пройти дослідження для іншого учасника
        </button>
      </div>
    </div>
  );
};
