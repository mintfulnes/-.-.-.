import React, { useState, useEffect } from 'react';
import { BookOpen, ShieldCheck, Clock, Users, Sparkles, CheckCircle2 } from 'lucide-react';

interface ConsentScreenProps {
  onStart: () => void;
  onOpenResearcherModal?: () => void;
}

export const ConsentScreen: React.FC<ConsentScreenProps> = ({
  onStart,
  onOpenResearcherModal
}) => {
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#2B2724] flex flex-col justify-between p-4 sm:p-8 md:p-12 max-w-3xl mx-auto">
      {/* Header */}
      <header className="pt-4 sm:pt-6 text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFE9DF] text-[#6B5E51] text-xs sm:text-sm font-medium tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-[#A46338]" />
          <span>наукове дослідження (МАН)</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#1E1A17] leading-tight font-bold tracking-tight">
          Мистецтво в соціальних мережах: трансформація способів сприйняття та популяризації
        </h1>
        <p className="text-sm sm:text-base text-[#6B6258] max-w-xl mx-auto leading-relaxed">
          Науково-дослідницька робота про те, як цифрові платформи та сучасні відеоформати змінюють сприйняття мистецтва.
        </p>
      </header>

      {/* Main Content Card */}
      <main className="my-6 bg-white/90 backdrop-blur-sm border border-[#E8E2D8] rounded-2xl p-5 sm:p-8 shadow-xs space-y-6">
        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#FAF7F2] border border-[#EFECE5]">
            <Clock className="w-5 h-5 text-[#A46338] shrink-0 mt-0.5" />
            <div>
              <div className="text-xs text-[#8A7E72] uppercase font-semibold tracking-wider">Тривалість</div>
              <div className="text-sm font-medium text-[#2B2724]">8–12 хвилин</div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#FAF7F2] border border-[#EFECE5]">
            <Users className="w-5 h-5 text-[#A46338] shrink-0 mt-0.5" />
            <div>
              <div className="text-xs text-[#8A7E72] uppercase font-semibold tracking-wider">Учасники</div>
              <div className="text-sm font-medium text-[#2B2724]">Учні 14–17 років</div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#FAF7F2] border border-[#EFECE5]">
            <ShieldCheck className="w-5 h-5 text-[#A46338] shrink-0 mt-0.5" />
            <div>
              <div className="text-xs text-[#8A7E72] uppercase font-semibold tracking-wider">Анонімність</div>
              <div className="text-sm font-medium text-[#2B2724]">Без реєстрації та пошти</div>
            </div>
          </div>
        </div>

        {/* Steps overview */}
        <div className="space-y-3 pt-1">
          <h2 className="text-sm sm:text-base font-semibold text-[#1F1C1A] flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#A46338]" />
            Етапи проходження:
          </h2>
          <ol className="space-y-2 text-xs sm:text-sm text-[#4E463E] list-none">
            <li className="flex items-start gap-2.5">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#EAE3D6] text-[#645344] text-xs font-bold shrink-0 mt-0.5">
                1
              </span>
              <span>
                <strong>Вхідне опитування (10 запитань)</strong> про ваш досвід перегляду мистецтва в соцмережах.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#EAE3D6] text-[#645344] text-xs font-bold shrink-0 mt-0.5">
                2
              </span>
              <span>
                <strong>Перегляд 4 картин</strong> у спеціальному форматі виставки.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#EAE3D6] text-[#645344] text-xs font-bold shrink-0 mt-0.5">
                3
              </span>
              <span>
                <strong>Короткий другий етап</strong> для фіксації ваших безпосередніх вражень.
              </span>
            </li>
          </ol>
        </div>

        {/* Privacy note */}
        <div className="p-3.5 rounded-xl bg-[#F6F2EB] border border-[#E9E1D4] text-xs text-[#5D5246] leading-relaxed">
          Усі відповіді анонімні й використовуються виключно в узагальненому вигляді для наукового аналізу.
        </div>

        {/* Consent Checkbox */}
        <label className="flex items-start gap-3 p-2 rounded-xl cursor-pointer select-none">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="w-5 h-5 mt-0.5 rounded border-[#C8BEB0] text-[#8F4F24] focus:ring-[#8F4F24] cursor-pointer"
          />
          <span className="text-xs sm:text-sm font-medium text-[#2B2724] leading-snug">
            Я погоджуюся взяти участь у дослідженні, підтверджую свій вік (14–17 років) та даю згоду на анонімну обробку моїх відповідей для наукової роботи.
          </span>
        </label>

        {/* Action Button */}
        <div>
          <button
            type="button"
            onClick={onStart}
            disabled={!agreed}
            className={`w-full py-4 px-6 rounded-xl font-medium text-base transition-all duration-200 flex items-center justify-center gap-2 shadow-sm ${
              agreed
                ? 'bg-[#8F4F24] hover:bg-[#783F1A] text-white active:scale-[0.99] cursor-pointer'
                : 'bg-[#E3DCD1] text-[#9A8F82] cursor-not-allowed'
            }`}
          >
            <span>Почати опитування</span>
            <CheckCircle2 className="w-4 h-4" />
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="pb-4 text-center">
        {onOpenResearcherModal && (
          <button
            type="button"
            onClick={onOpenResearcherModal}
            className="text-xs text-[#8F7F6E] hover:text-[#3B3227] underline underline-offset-4 cursor-pointer"
          >
            Панель керівника (МАН)
          </button>
        )}
      </footer>
    </div>
  );
};
