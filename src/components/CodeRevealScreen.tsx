import React, { useState } from 'react';
import { Copy, Check, ArrowRight, Eye, Sparkles } from 'lucide-react';

interface CodeRevealScreenProps {
  code: string;
  group: 'A' | 'B';
  onContinue: () => void;
}

export const CodeRevealScreen: React.FC<CodeRevealScreenProps> = ({ code, group, onContinue }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#2B2724] flex flex-col justify-center items-center p-4 sm:p-8 max-w-xl mx-auto text-center">
      <div className="w-full bg-white/90 backdrop-blur-sm border border-[#E8E2D8] rounded-3xl p-6 sm:p-10 shadow-sm space-y-6">
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFE9DF] text-[#6B5E51] text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-[#A46338]" />
          <span>Анкета збережена в базі даних</span>
        </div>

        <div className="space-y-2">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1E1A17]">
            Ваш персональний код учасника
          </h2>
          <p className="text-sm text-[#6F6456]">
            За цим анонімним кодом результати фіксуються в науковому протоколі.
          </p>
        </div>

        {/* Code Box */}
        <div className="relative bg-[#FAF6F0] border-2 border-dashed border-[#D5C7B5] rounded-2xl py-5 px-6 flex flex-col items-center justify-center gap-3">
          <span className="font-mono text-4xl sm:text-5xl font-black tracking-[0.25em] text-[#8F4F24] select-all pl-2">
            {code}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6F604E] hover:text-[#2B2724] bg-white px-3 py-1.5 rounded-full border border-[#DED5C8] shadow-xs cursor-pointer transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Скопійовано!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Скопіювати код</span>
              </>
            )}
          </button>
        </div>

        {/* Experimental Group assignment note */}
        <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#ECE5DA] text-left space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-semibold text-[#8C7D6E] tracking-wider">
              Експериментальна група
            </span>
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-[#8F4F24] text-white">
              Група {group}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#4A4136] leading-relaxed">
            {group === 'A' ? (
              <span>
                Вам призначено <strong>традиційний музейний формат</strong>: структуровані картки з текстом і репродукцією високої чіткості.
              </span>
            ) : (
              <span>
                Вам призначено <strong>формат динамічної відеострічки (Reels / Shorts)</strong>: повноекранні відео з інтерактивними елементами.
              </span>
            )}
          </p>
        </div>

        {/* Instructions */}
        <div className="text-xs text-[#7B6E60] leading-relaxed">
          <p className="flex items-center justify-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-[#8F4F24]" />
            Переглядайте твори у звичному для вас темпі. Після 4 творів з&apos;явиться кнопка завершення.
          </p>
        </div>

        {/* Proceed button */}
        <button
          type="button"
          onClick={onContinue}
          className="w-full py-4 px-6 rounded-xl font-medium text-base bg-[#8F4F24] hover:bg-[#783F1A] text-white transition-all duration-200 flex items-center justify-center gap-2 shadow-sm cursor-pointer active:scale-[0.99]"
        >
          <span>Перейти до перегляду творів</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
