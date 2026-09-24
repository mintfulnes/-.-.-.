import React, { useState } from 'react';
import { SURVEY_QUESTIONS } from '../data/surveyQuestions';
import { SurveyAnswers } from '../types';
import { Check, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

interface SurveyScreenProps {
  onComplete: (answers: SurveyAnswers) => void;
  isSubmitting?: boolean;
}

export const SurveyScreen: React.FC<SurveyScreenProps> = ({ onComplete, isSubmitting = false }) => {
  const [answers, setAnswers] = useState<SurveyAnswers>({});
  const [validationError, setValidationError] = useState<string | null>(null);

  const totalQuestions = SURVEY_QUESTIONS.length;
  const answeredCount = Object.keys(answers).length;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  const handleSelectOption = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value
    }));
    if (validationError) {
      setValidationError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate that all 10 questions are answered
    const unanswered = SURVEY_QUESTIONS.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      setValidationError(
        `Будь ласка, дайте відповідь на всі запитання. Залишилось: №${unanswered.map((q) => q.number).join(', ')}`
      );
      // Scroll to the first unanswered question
      const firstMissingId = unanswered[0].id;
      const el = document.getElementById(`question-${firstMissingId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    onComplete(answers);
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#2B2724] py-8 px-4 sm:px-6 md:px-8 max-w-3xl mx-auto">
      {/* Sticky Progress Header */}
      <div className="sticky top-0 z-20 bg-[#FBF9F5]/95 backdrop-blur-md pb-4 pt-2 border-b border-[#E8E2D8] mb-8">
        <div className="flex items-center justify-between text-xs sm:text-sm text-[#786D61] font-medium mb-2">
          <span className="flex items-center gap-1.5 font-semibold text-[#1F1C1A]">
            <Sparkles className="w-4 h-4 text-[#A46338]" />
            Анкета учасника дослідження
          </span>
          <span>
            Заповнено: <strong className="text-[#8F4F24]">{answeredCount}</strong> з {totalQuestions}
          </span>
        </div>
        <div className="w-full bg-[#EAE3D6] h-2 rounded-full overflow-hidden">
          <div
            className="bg-[#8F4F24] h-full transition-all duration-300 ease-out rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Intro info banner */}
      <div className="mb-6 p-4 rounded-xl bg-white border border-[#E8E2D8] shadow-xs">
        <p className="text-xs sm:text-sm text-[#5F5448] leading-relaxed">
          Оберіть варіант відповіді, який найбільш точно відображає ваш власний досвід та думку. Усі запитання є обов&apos;язковими перед переходом до другого кроку.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {SURVEY_QUESTIONS.map((question) => {
          const isAnswered = !!answers[question.id];
          const selectedValue = answers[question.id];

          return (
            <div
              key={question.id}
              id={`question-${question.id}`}
              className={`p-5 sm:p-6 rounded-2xl bg-white border transition-all duration-200 shadow-xs ${
                isAnswered ? 'border-[#D9CFBF]' : 'border-[#EAE3D6]'
              }`}
            >
              <div className="flex items-start gap-3 mb-4">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                    isAnswered
                      ? 'bg-[#8F4F24] text-white'
                      : 'bg-[#F0EAE1] text-[#7A6B5C]'
                  }`}
                >
                  {isAnswered ? <Check className="w-3.5 h-3.5" /> : question.number}
                </span>
                <h3 className="text-base sm:text-lg font-serif font-bold text-[#1E1A17] pt-0.5 leading-snug">
                  {question.text}
                </h3>
              </div>

              {/* Options */}
              {question.type === 'scale' ? (
                /* 1 to 5 scale */
                <div className="space-y-3">
                  <div className="grid grid-cols-5 gap-2 sm:gap-3">
                    {[1, 2, 3, 4, 5].map((val) => {
                      const strVal = String(val);
                      const isSelected = selectedValue === strVal;
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleSelectOption(question.id, strVal)}
                          className={`py-3 sm:py-4 px-2 rounded-xl text-center font-bold text-base sm:text-lg transition-all duration-150 cursor-pointer ${
                            isSelected
                              ? 'bg-[#8F4F24] text-white shadow-sm ring-2 ring-[#8F4F24]/30 scale-[1.02]'
                              : 'bg-[#FAF7F2] text-[#42392F] border border-[#E6DFD3] hover:border-[#BFB19F] hover:bg-[#F3EDE2]'
                          }`}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[11px] sm:text-xs text-[#8A7E72] px-1 font-medium">
                    <span>1 — Зовсім неефективні</span>
                    <span>3 — Помірно</span>
                    <span>5 — Надзвичайно ефективні</span>
                  </div>
                </div>
              ) : (
                /* Radio list */
                <div className="space-y-2">
                  {question.options.map((option) => {
                    const isSelected = selectedValue === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleSelectOption(question.id, option.value)}
                        className={`w-full text-left p-3 sm:p-3.5 rounded-xl border flex items-center justify-between text-sm transition-all duration-150 cursor-pointer ${
                          isSelected
                            ? 'bg-[#F9F4EC] border-[#8F4F24] text-[#1E1A17] font-medium shadow-xs'
                            : 'bg-[#FAF7F2] border-[#ECE6DC] text-[#4A4137] hover:bg-[#F4EFE6] hover:border-[#D9CFC1]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-semibold uppercase ${
                              isSelected
                                ? 'bg-[#8F4F24] text-white'
                                : 'bg-[#EAE3D6] text-[#786D61]'
                            }`}
                          >
                            {option.value}
                          </span>
                          <span className="capitalize-first">{option.label}</span>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'border-[#8F4F24] bg-[#8F4F24]'
                              : 'border-[#CDC2B2] bg-white'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Validation error message */}
        {validationError && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Submit button */}
        <div className="pt-4 pb-12">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-4 px-6 rounded-xl font-medium text-base transition-all duration-200 flex items-center justify-center gap-2 shadow-sm ${
              answeredCount === totalQuestions && !isSubmitting
                ? 'bg-[#8F4F24] hover:bg-[#783F1A] text-white cursor-pointer active:scale-[0.99]'
                : 'bg-[#E3DCD1] text-[#8C8072] cursor-pointer'
            }`}
          >
            <span>
              {isSubmitting
                ? 'Збереження відповідей...'
                : answeredCount === totalQuestions
                ? 'Зберегти та згенерувати код учасника'
                : `Дайте відповідь на всі питання (${answeredCount}/${totalQuestions})`}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
