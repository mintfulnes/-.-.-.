import React, { useState } from 'react';
import { getSessionDoc } from '../firebase';
import { ARTWORKS } from '../data/artworks';
import { SURVEY_QUESTIONS } from '../data/surveyQuestions';
import { X, Search, FileText, Database, CheckCircle2, AlertCircle } from 'lucide-react';

interface ResearcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSessionCode?: string;
}

export const ResearcherModal: React.FC<ResearcherModalProps> = ({
  isOpen,
  onClose,
  currentSessionCode = ''
}) => {
  const [searchCode, setSearchCode] = useState(currentSessionCode);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionDoc, setSessionDoc] = useState<Record<string, any> | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);
    setSessionDoc(null);

    try {
      const data = await getSessionDoc(searchCode.trim().toUpperCase());
      if (data) {
        setSessionDoc(data);
      } else {
        setErrorMessage(`Сесію з кодом "${searchCode.trim().toUpperCase()}" не знайдено у Firestore.`);
      }
    } catch (err: any) {
      setErrorMessage(`Помилка отримання даних: ${err?.message || 'Невідома помилка'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportJson = () => {
    if (!sessionDoc) return;
    const blob = new Blob([JSON.stringify(sessionDoc, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session_${searchCode.trim().toUpperCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-[#E5DDD0] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#EAE3D6] flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-[#8F4F24]" />
            <h3 className="font-serif text-lg font-bold text-[#1E1A17]">
              Панель дослідника (перевірка сесій у Firestore)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-[#7B6E60] hover:text-[#1E1A17] hover:bg-[#EFE8DD] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b border-[#EAE3D6] bg-white">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
              placeholder="Введіть код учасника (наприклад: K7P9XM)"
              maxLength={12}
              className="flex-1 px-4 py-2.5 rounded-xl border border-[#D5C9B8] bg-[#FAF8F5] text-sm uppercase tracking-widest font-mono text-[#1E1A17] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8F4F24]/30"
            />
            <button
              type="submit"
              disabled={isLoading || !searchCode.trim()}
              className="px-5 py-2.5 bg-[#8F4F24] hover:bg-[#783F1A] text-white rounded-xl text-sm font-medium flex items-center gap-2 disabled:bg-[#D8D0C5] cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>{isLoading ? 'Пошук...' : 'Знайти сесію'}</span>
            </button>
          </form>

          {errorMessage && (
            <div className="mt-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Content Details */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-[#2B2724]">
          {sessionDoc ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-[#8A7D6F] uppercase font-semibold">
                    Знайдено протокол сесії:
                  </span>
                  <div className="font-mono text-xl font-bold text-[#8F4F24]">
                    {searchCode.toUpperCase()}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="px-3 py-1.5 bg-[#FAF7F2] border border-[#DDD3C5] hover:bg-[#F2ECE1] rounded-lg text-xs font-semibold text-[#5D5040] flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Експорт JSON</span>
                </button>
              </div>

              {/* Meta summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#ECE5DA]">
                  <div className="text-[#8C7E70]">Група</div>
                  <div className="font-bold text-sm">Група {sessionDoc.group}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#ECE5DA]">
                  <div className="text-[#8C7E70]">Порядок творів</div>
                  <div className="font-mono font-bold text-xs">{sessionDoc.order?.join(', ')}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#ECE5DA]">
                  <div className="text-[#8C7E70]">Початок</div>
                  <div className="text-[11px] truncate">
                    {sessionDoc.startedAt ? new Date(sessionDoc.startedAt).toLocaleTimeString() : '—'}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#ECE5DA]">
                  <div className="text-[#8C7E70]">Завершення 1 етапу</div>
                  <div className="text-[11px] truncate">
                    {sessionDoc.phase1CompletedAt
                      ? new Date(sessionDoc.phase1CompletedAt).toLocaleTimeString()
                      : 'В процесі'}
                  </div>
                </div>
              </div>

              {/* Items Interaction Metrics */}
              <div className="space-y-2">
                <h4 className="text-xs uppercase font-bold text-[#7E7061] tracking-wider">
                  Метрики взаємодії з творами (items):
                </h4>
                <div className="space-y-2">
                  {sessionDoc.order?.map((artId: string) => {
                    const metric = sessionDoc.items?.[artId] || {};
                    const art = ARTWORKS[artId as keyof typeof ARTWORKS];
                    return (
                      <div
                        key={artId}
                        className="p-3 rounded-xl bg-[#FAF8F5] border border-[#ECE5DA] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <span className="font-bold text-[#1E1A17]">{art?.title || artId}</span>
                          <span className="text-[#8A7D6F] ml-2">({artId})</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="bg-[#EAE2D5] px-2 py-0.5 rounded font-mono">
                            dwell: {Math.round((metric.dwellMs || 0) / 1000)}с ({metric.dwellMs || 0}мс)
                          </span>
                          {sessionDoc.group === 'B' && (
                            <span className="bg-[#EAE2D5] px-2 py-0.5 rounded font-mono">
                              watch: {metric.watchCompletion || 0}%
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded font-medium ${
                              metric.liked ? 'bg-rose-100 text-rose-800' : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {metric.liked ? 'Лайк: ТАК' : 'Лайк: НІ'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded font-medium ${
                              metric.learnMoreClicked
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {metric.learnMoreClicked ? 'Більше: ТАК' : 'Більше: НІ'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Survey Answers */}
              <div className="space-y-2">
                <h4 className="text-xs uppercase font-bold text-[#7E7061] tracking-wider">
                  Відповіді вхідної анкети:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {SURVEY_QUESTIONS.map((q) => {
                    const ans = sessionDoc.survey?.[q.id];
                    return (
                      <div
                        key={q.id}
                        className="p-2 rounded-lg bg-[#FAF8F5] border border-[#EFE9DF] space-y-0.5"
                      >
                        <div className="text-[11px] text-[#7C6E5F] line-clamp-1">
                          №{q.number}. {q.text}
                        </div>
                        <div className="font-bold text-[#8F4F24]">Відповідь: {ans || '—'}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Phase 2 Data if exists */}
              {sessionDoc.phase2 && (
                <div className="space-y-2 border-t border-[#EAE3D6] pt-3">
                  <h4 className="text-xs uppercase font-bold text-[#7E7061] tracking-wider">
                    Дані другого етапу (Phase 2):
                  </h4>
                  <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#ECE5DA] text-xs space-y-2">
                    <div>
                      <span className="font-semibold text-[#54493D]">Вільне відтворення:</span>
                      <p className="mt-1 text-[#2B2724] bg-white p-2 rounded border border-[#ECE5DA]">
                        {sessionDoc.phase2.freeRecall}
                      </p>
                    </div>
                    {sessionDoc.phase2.responses && (
                      <div className="space-y-1">
                        <span className="font-semibold text-[#54493D]">Відповіді на запитання:</span>
                        <pre className="text-[11px] bg-white p-2 rounded border border-[#ECE5DA] overflow-x-auto">
                          {JSON.stringify(sessionDoc.phase2.responses, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-[#8A7D6F] space-y-2">
              <Database className="w-10 h-10 mx-auto text-[#C7BCAD]" />
              <p className="text-sm">
                Введіть 6-значний код сесії зверху для перегляду збережених даних дослідження з Firestore.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
