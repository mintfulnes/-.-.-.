import React, { useState } from 'react';
import { BookOpen, ShieldCheck, Clock, Users, Sparkles, CheckCircle2 } from 'lucide-react';

interface ConsentScreenProps {
  onStart: () => void;
  onResumeCode: (code: string) => void;
}

export const ConsentScreen: React.FC<ConsentScreenProps> = ({ onStart, onResumeCode }) => {
  const [agreed, setAgreed] = useState(false);
  const [showResumeInput, setShowResumeInput] = useState(false);
  const [resumeCode, setResumeCode] = useState('');

  const handleResumeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (resumeCode.trim().length >= 4) {
      onResumeCode(resumeCode.trim().toUpperCase());
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#2B2724] flex flex-col justify-between p-4 sm:p-8 md:p-12 max-w-3xl mx-auto">
      {/* Header */}
      <header className="pt-4 sm:pt-8 text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFE9DF] text-[#6B5E51] text-xs sm:text-sm font-medium tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-[#A46338]" />
          <span>Шкільне наукове дослідження (МАН)</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#1E1A17] leading-tight font-bold tracking-tight">
          Мистецтво в соціальних мережах: трансформація способів сприйняття та популяризації
        </h1>
        <p className="text-sm sm:text-base text-[#6B6258] max-w-xl mx-auto leading-relaxed">
          Науково-дослідницька робота про те, як цифрові платформи та сучасні відеоформати змінюють сприйняття класичного мистецтва сучасними підлітками.
        </p>
      </header>

      {/* Main Content Card */}
      <main className="my-6 sm:my-8 bg-white/80 backdrop-blur-sm border border-[#E8E2D8] rounded-2xl p-5 sm:p-8 shadow-sm space-y-6">
        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#FAF7F2] border border-[#EFECE5]">
            <Clock className="w-5 h-5 text-[#A46338] shrink-0 mt-0.5" />
            <div>
              <div className="text-xs text-[#8A7E72] uppercase font-semibold tracking-wider">Тривалість</div>
              <div className="text-sm font-medium text-[#2B2724]">10–12 хвилин</div>
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
              <div className="text-sm font-medium text-[#2B2724]">Без логіну й пошти</div>
            </div>
          </div>
        </div>

        {/* What to expect */}
        <div className="space-y-3 pt-2">
          <h2 className="text-base font-semibold text-[#1F1C1A] flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#A46338]" />
            Що відбуватиметься під час дослідження:
          </h2>
          <ol className="space-y-2.5 text-sm text-[#4E463E] list-none">
            <li className="flex items-start gap-2.5">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#EAE3D6] text-[#645344] text-xs font-bold shrink-0 mt-0.5">
                1
              </span>
              <span>
                <strong>Вхідне анкетування (10 запитань)</strong> про ваші щоденні звички споживання контенту та мистецтва в Instagram, TikTok, Pinterest тощо.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#EAE3D6] text-[#645344] text-xs font-bold shrink-0 mt-0.5">
                2
              </span>
              <span>
                <strong>Генерація персонального коду</strong> та випадковий розподіл в один із двох експериментальних форматів показу картин.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#EAE3D6] text-[#645344] text-xs font-bold shrink-0 mt-0.5">
                3
              </span>
              <span>
                <strong>Перегляд 4 видатних творів мистецтва</strong> у призначеному форматі так, як ви зазвичай переглядаєте стрічку.
              </span>
            </li>
          </ol>
        </div>

        {/* Anonymity note */}
        <div className="p-3.5 rounded-xl bg-[#F6F2EB] border border-[#E9E1D4] text-xs sm:text-sm text-[#5D5246] leading-relaxed">
          <p>
            Усі отримані дані є суворо конфіденційними, використовуються виключно в узагальненому вигляді для наукових цілей і зберігаються у захищеній хмарній базі даних під випадковим кодом сесії.
          </p>
        </div>

        {/* Consent Checkbox */}
        <label className="flex items-start gap-3 p-3 rounded-xl border border-transparent hover:border-[#D6CCC0] cursor-pointer transition-colors select-none">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="w-5 h-5 mt-0.5 rounded border-[#C8BEB0] text-[#A46338] focus:ring-[#A46338] cursor-pointer"
          />
          <span className="text-sm font-medium text-[#2B2724]">
            Я погоджуюся взяти участь у дослідженні, підтверджую свій вік (14–17 років) та даю згоду на анонімну обробку моїх відповідей для наукової роботи.
          </span>
        </label>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onStart}
            disabled={!agreed}
            className={`w-full py-3.5 px-6 rounded-xl font-medium text-base transition-all duration-200 flex items-center justify-center gap-2 shadow-sm ${
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

      {/* Footer / Resume link */}
      <footer className="pb-4 text-center space-y-3">
        {!showResumeInput ? (
          <button
            type="button"
            onClick={() => setShowResumeInput(true)}
            className="text-xs sm:text-sm text-[#7F7466] hover:text-[#423A30] underline underline-offset-4 cursor-pointer"
          >
            У мене вже є код учасника
          </button>
        ) : (
          <form onSubmit={handleResumeSubmit} className="flex items-center justify-center gap-2 max-w-xs mx-auto">
            <input
              type="text"
              value={resumeCode}
              onChange={(e) => setResumeCode(e.target.value.toUpperCase())}
              placeholder="Код (6 знаків)"
              maxLength={8}
              className="px-3 py-1.5 text-sm bg-white border border-[#D5CCC0] rounded-lg text-center uppercase tracking-widest font-mono text-[#2B2724]"
            />
            <button
              type="submit"
              className="px-3 py-1.5 text-xs bg-[#5F5244] text-white rounded-lg hover:bg-[#4A3F34]"
            >
              Знайти
            </button>
            <button
              type="button"
              onClick={() => setShowResumeInput(false)}
              className="px-2 py-1.5 text-xs text-[#8A7E72] hover:text-[#423A30]"
            >
              Скасувати
            </button>
          </form>
        )}
      </footer>
    </div>
  );
};
