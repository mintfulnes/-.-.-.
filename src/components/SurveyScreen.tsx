import React, { useState, useEffect } from 'react';
import { SURVEY_QUESTIONS } from '../data/surveyQuestions';
import { SurveyAnswers } from '../types';
import { Check, ArrowRight, AlertCircle } from 'lucide-react';

interface SurveyScreenProps {
  onComplete: (answers: SurveyAnswers) => void;
  isSubmitting?: boolean;
}

export const SurveyScreen: React.FC<SurveyScreenProps> = ({ onComplete, isSubmitting = false }) => {
  const [answers, setAnswers] = useState<SurveyAnswers>({});
  const [validationError, setValidationError] = useState<string | null>(null);

  // Ensure scroll is strictly at the top when survey screen mounts so Question 1 is immediately visible!
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  const isQuestionAnswered = (qId: string) => {
    const val = answers[qId];
    if (Array.isArray(val)) return val.length > 0;
    return !!val;
  };

  const totalQuestions = SURVEY_QUESTIONS.length;
  const answeredCount = SURVEY_QUESTIONS.filter((q) => isQuestionAnswered(q.id)).length;
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

  const handleToggleMultipleOption = (questionId: string, value: string) => {
    setAnswers((prev) => {
      const current = prev[questionId];
      const arr = Array.isArray(current)
        ? [...current]
        : current
        ? [current]
        : [];
      const index = arr.indexOf(value);
      if (index >= 0) {
        arr.splice(index, 1);
      } else {
        arr.push(value);
      }
      return {
        ...prev,
        [questionId]: arr
      };
    });
    if (validationError) {
      setValidationError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const unanswered = SURVEY_QUESTIONS.filter((q) => !isQuestionAnswered(q.id));
    if (unanswered.length > 0) {
      setValidationError(
        `Будь ласка, дайте відповідь на всі запитання. Залишилось відповісти на: №${unanswered
          .map((q) => q.number)
          .join(', ')}`
      );
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
    <div className="min-h-screen bg-[#FBF9F5] text-[#2B2724] pt-2 pb-12 px-3 sm:px-6 md:px-8 max-w-3xl mx-auto">
      {/* Slim Sticky Header */}
      <div className="sticky top-0 z-20 bg-[#FBF9F5]/95 backdrop-blur-md pt-2 pb-3 border-b border-[#E8E2D8] mb-5">
        <div className="flex items-center justify-between text-xs sm:text-sm text-[#786D61] font-medium mb-1.5">
          <span className="font-bold text-[#1F1C1A]">
            Вхідна анкета
          </span>
          <span>
            Відповідей: <strong className="text-[#8F4F24]">{answeredCount}</strong> з {totalQuestions}
          </span>
        </div>
        <div className="w-full bg-[#EAE3D6] h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-[#8F4F24] h-full transition-all duration-300 ease-out rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        {SURVEY_QUESTIONS.map((question) => {
          const isAnswered = isQuestionAnswered(question.id);
          const selectedValue = answers[question.id];
          const isMultiple = question.type === 'multiple' || question.isMultiple;

          return (
            <div
              key={question.id}
              id={`question-${question.id}`}
              className={`p-4 sm:p-6 rounded-2xl bg-white border transition-all duration-150 shadow-xs ${
                isAnswered ? 'border-[#D9CFBF]' : 'border-[#EAE3D6]'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-3">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                      isAnswered ? 'bg-[#8F4F24] text-white' : 'bg-[#F0EAE1] text-[#7A6B5C]'
                    }`}
                  >
                    {isAnswered ? <Check className="w-3.5 h-3.5" /> : question.number}
                  </span>
                  <h3 className="text-sm sm:text-base font-serif font-bold text-[#1E1A17] pt-0.5 leading-snug">
                    {question.text}
                  </h3>
                </div>
                {isMultiple && (
                  <span className="shrink-0 text-[10px] sm:text-xs font-medium text-[#8F4F24] bg-[#FAF3EC] border border-[#EEDFCE] px-2 py-0.5 rounded-full">
                    декілька варіантів
                  </span>
                )}
              </div>

              {/* Options */}
              {question.type === 'scale' ? (
                /* 1 to 5 scale */
                <div className="space-y-2.5">
                  <div className="grid grid-cols-5 gap-2 sm:gap-3">
                    {[1, 2, 3, 4, 5].map((val) => {
                      const strVal = String(val);
                      const isSelected = selectedValue === strVal;
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleSelectOption(question.id, strVal)}
                          className={`py-2.5 sm:py-3.5 px-2 rounded-xl text-center font-bold text-sm sm:text-base transition-all duration-150 cursor-pointer ${
                            isSelected
                              ? 'bg-[#8F4F24] text-white shadow-xs ring-2 ring-[#8F4F24]/30 scale-[1.02]'
                              : 'bg-[#FAF7F2] text-[#42392F] border border-[#E6DFD3] hover:border-[#BFB19F] hover:bg-[#F3EDE2]'
                          }`}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[10px] sm:text-xs text-[#8A7E72] px-1 font-medium">
                    <span>1 — Неефективні</span>
                    <span>3 — Помірно</span>
                    <span>5 — Дуже ефективні</span>
                  </div>
                </div>
              ) : (
                /* Options list */
                <div className="space-y-1.5 sm:space-y-2">
                  {question.options.map((option) => {
                    const isSelected = isMultiple
                      ? Array.isArray(selectedValue) && selectedValue.includes(option.value)
                      : selectedValue === option.value;

                    const handleClick = () => {
                      if (isMultiple) {
                        handleToggleMultipleOption(question.id, option.value);
                      } else {
                        handleSelectOption(question.id, option.value);
                      }
                    };

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={handleClick}
                        className={`w-full text-left p-2.5 sm:p-3 rounded-xl border flex items-center justify-between text-xs sm:text-sm transition-all duration-150 cursor-pointer ${
                          isSelected
                            ? 'bg-[#F9F4EC] border-[#8F4F24] text-[#1E1A17] font-medium shadow-2xs'
                            : 'bg-[#FAF7F2] border-[#ECE6DC] text-[#4A4137] hover:bg-[#F4EFE6] hover:border-[#D9CFC1]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-semibold uppercase shrink-0 ${
                              isSelected ? 'bg-[#8F4F24] text-white' : 'bg-[#EAE3D6] text-[#786D61]'
                            }`}
                          >
                            {option.value}
                          </span>
                          <span>{option.label}</span>
                        </div>

                        {/* Checkbox indicator: square for multiple, circle for single */}
                        {isMultiple ? (
                          <div
                            className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? 'border-[#8F4F24] bg-[#8F4F24] text-white'
                                : 'border-[#CDC2B2] bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                          </div>
                        ) : (
                          <div
                            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                              isSelected ? 'border-[#8F4F24] bg-[#8F4F24]' : 'border-[#CDC2B2] bg-white'
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Validation error */}
        {validationError && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs sm:text-sm flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Submit */}
        <div className="pt-2 pb-8">
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
                ? 'Збереження...'
                : answeredCount === totalQuestions
                ? 'Перейти до перегляду картин'
                : `Дайте відповідь на всі запитання (${answeredCount}/${totalQuestions})`}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
