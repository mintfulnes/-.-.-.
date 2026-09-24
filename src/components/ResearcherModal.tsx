import React, { useState, useEffect } from 'react';
import { getAllSessionsDocs, getSessionDoc } from '../firebase';
import { ARTWORKS } from '../data/artworks';
import { SURVEY_QUESTIONS } from '../data/surveyQuestions';
import {
  X,
  Search,
  FileSpreadsheet,
  FileText,
  Database,
  Lock,
  Unlock,
  Users,
  RefreshCw,
  Eye,
  Heart,
  Clock,
  CheckCircle2,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

interface ResearcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSessionCode?: string;
}

// Passcode to unlock the research dashboard
const VALID_PASSCODES = ['MAN2026', 'RESEARCH2026', 'ART2026'];

export const ResearcherModal: React.FC<ResearcherModalProps> = ({
  isOpen,
  onClose,
  currentSessionCode = ''
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState(false);

  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [filterGroup, setFilterGroup] = useState<'all' | 'A' | 'B'>('all');
  const [searchQuery, setSearchQuery] = useState(currentSessionCode);

  const [selectedSession, setSelectedSession] = useState<any | null>(null);

  // Load all sessions from Firestore once authenticated
  const loadSessions = async () => {
    setIsLoadingList(true);
    try {
      const data = await getAllSessionsDocs();
      // Sort newest first
      const sorted = (data || []).sort((a: any, b: any) => {
        const timeA = new Date(a.startedAt || 0).getTime();
        const timeB = new Date(b.startedAt || 0).getTime();
        return timeB - timeA;
      });
      setSessions(sorted);
    } catch (err) {
      console.error('Failed to load all sessions from Firestore:', err);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadSessions();
    }
  }, [isOpen, isAuthenticated]);

  if (!isOpen) return null;

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (VALID_PASSCODES.includes(passcodeInput.trim().toUpperCase())) {
      setIsAuthenticated(true);
      setPasscodeError(false);
    } else {
      setPasscodeError(true);
    }
  };

  // Filtered sessions
  const filteredSessions = sessions.filter((s) => {
    const matchesGroup = filterGroup === 'all' || s.group === filterGroup;
    const matchesSearch =
      !searchQuery.trim() ||
      s.id?.toUpperCase().includes(searchQuery.trim().toUpperCase());
    return matchesGroup && matchesSearch;
  });

  // Calculate high-level research statistics
  const totalCount = sessions.length;
  const groupACount = sessions.filter((s) => s.group === 'A').length;
  const groupBCount = sessions.filter((s) => s.group === 'B').length;
  const completedCount = sessions.filter((s) => !!s.phase1CompletedAt).length;

  // Average dwell times
  const groupASessions = sessions.filter((s) => s.group === 'A');
  const groupBSessions = sessions.filter((s) => s.group === 'B');

  const calcAvgDwellSec = (sessionList: any[]) => {
    if (sessionList.length === 0) return 0;
    const totalDwellMs = sessionList.reduce((acc, s) => {
      const items = s.items || {};
      const sum = Object.values(items).reduce(
        (subAcc: number, it: any) => subAcc + (it?.dwellMs || 0),
        0
      );
      return acc + sum;
    }, 0);
    return Math.round(totalDwellMs / sessionList.length / 1000);
  };

  const avgDwellA = calcAvgDwellSec(groupASessions);
  const avgDwellB = calcAvgDwellSec(groupBSessions);

  // Average video completion for group B
  const avgCompletionB = () => {
    if (groupBSessions.length === 0) return 0;
    let totalPerc = 0;
    let count = 0;
    groupBSessions.forEach((s) => {
      const items = s.items || {};
      Object.values(items).forEach((it: any) => {
        if (typeof it?.watchCompletion === 'number') {
          totalPerc += it.watchCompletion;
          count++;
        }
      });
    });
    return count > 0 ? Math.round(totalPerc / count) : 0;
  };

  // Export all sessions to CSV for Excel / Google Sheets
  const handleExportCSV = () => {
    if (sessions.length === 0) return;

    // Header row
    const headers = [
      'Код сесії',
      'Група',
      'Дата початку',
      'Дата завершення 1 етапу',
      'Сумарний час уваги (сек)',
      'К-сть вподобань (лайків)',
      // Survey questions
      ...SURVEY_QUESTIONS.map((q) => `Анкета_П${q.number}`),
      // Artworks metrics
      'proverbs_dwell_s',
      'proverbs_liked',
      'proverbs_learnMore',
      'haywain_dwell_s',
      'haywain_liked',
      'haywain_learnMore',
      'anatomy_dwell_s',
      'anatomy_liked',
      'anatomy_learnMore',
      'sea_dwell_s',
      'sea_liked',
      'sea_learnMore',
      // Group B video completion
      'proverbs_watch_pct',
      'haywain_watch_pct',
      'anatomy_watch_pct',
      'sea_watch_pct',
      // Phase 2
      'Етап2_Вільне_відтворення',
      'Етап2_Питання_Босх',
      'Етап2_Питання_Враження',
      'Пристрій_userAgent'
    ];

    const rows = sessions.map((s) => {
      const items = s.items || {};
      const survey = s.survey || {};
      const phase2 = s.phase2 || {};
      const responses = phase2.responses || {};

      const totalDwellMs = Object.values(items).reduce(
        (sum: number, it: any) => sum + (it?.dwellMs || 0),
        0
      );
      const likedCount = Object.values(items).filter((it: any) => it?.liked).length;

      const formatCell = (val: any) => {
        if (val === undefined || val === null) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      return [
        formatCell(s.id),
        formatCell(s.group),
        formatCell(s.startedAt),
        formatCell(s.phase1CompletedAt || 'Не завершено'),
        formatCell(Math.round(totalDwellMs / 1000)),
        formatCell(likedCount),
        // Survey answers
        ...SURVEY_QUESTIONS.map((q) => formatCell(survey[q.id] || '')),
        // Proverbs
        formatCell(Math.round((items.proverbs?.dwellMs || 0) / 1000)),
        formatCell(items.proverbs?.liked ? 'ТАК' : 'НІ'),
        formatCell(items.proverbs?.learnMoreClicked ? 'ТАК' : 'НІ'),
        // Haywain
        formatCell(Math.round((items.haywain?.dwellMs || 0) / 1000)),
        formatCell(items.haywain?.liked ? 'ТАК' : 'НІ'),
        formatCell(items.haywain?.learnMoreClicked ? 'ТАК' : 'НІ'),
        // Anatomy
        formatCell(Math.round((items.anatomy?.dwellMs || 0) / 1000)),
        formatCell(items.anatomy?.liked ? 'ТАК' : 'НІ'),
        formatCell(items.anatomy?.learnMoreClicked ? 'ТАК' : 'НІ'),
        // Sea
        formatCell(Math.round((items.sea?.dwellMs || 0) / 1000)),
        formatCell(items.sea?.liked ? 'ТАК' : 'НІ'),
        formatCell(items.sea?.learnMoreClicked ? 'ТАК' : 'НІ'),
        // Watch pct
        formatCell(items.proverbs?.watchCompletion ?? ''),
        formatCell(items.haywain?.watchCompletion ?? ''),
        formatCell(items.anatomy?.watchCompletion ?? ''),
        formatCell(items.sea?.watchCompletion ?? ''),
        // Phase 2
        formatCell(phase2.freeRecall || ''),
        formatCell(responses.q_haywain_meaning || ''),
        formatCell(responses.q_impression || ''),
        formatCell(s.device || '')
      ].join(';');
    });

    // Add UTF-8 BOM so Excel opens Ukrainian text properly without broken encoding
    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `art_research_sessions_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export JSON
  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(sessions, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `art_research_all_data_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 select-text">
      <div className="bg-white rounded-3xl border border-[#E5DDD0] w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-[#EAE3D6] flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#8F4F24] text-white flex items-center justify-center shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#1E1A17] flex items-center gap-2">
                Панель дослідника (МАН)
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#EAE2D5] text-[#5C4F41] font-mono font-normal">
                  Firestore Database
                </span>
              </h3>
              <p className="text-xs text-[#7B6E60]">
                Збір та статистичний аналіз результатів експерименту в режимі реального часу
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-[#7B6E60] hover:text-[#1E1A17] hover:bg-[#EFE8DD] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* If not authenticated, show passcode screen */}
        {!isAuthenticated ? (
          <div className="flex-1 flex items-center justify-center p-6 bg-[#FAF8F5]">
            <form
              onSubmit={handlePasscodeSubmit}
              className="max-w-sm w-full bg-white border border-[#E5DDD0] rounded-3xl p-8 text-center space-y-5 shadow-sm"
            >
              <div className="w-14 h-14 rounded-full bg-[#FAF3EC] text-[#8F4F24] flex items-center justify-center mx-auto border border-[#EEDFCE]">
                <Lock className="w-7 h-7" />
              </div>

              <div className="space-y-1">
                <h4 className="font-serif text-xl font-bold text-[#1E1A17]">
                  Доступ для керівника дослідження
                </h4>
                <p className="text-xs text-[#736657] leading-relaxed">
                  Введіть пароль керівника або код доступу для перегляду зведеної таблиці учнівських результатів.
                </p>
              </div>

              <div className="space-y-2">
                <input
                  type="password"
                  value={passcodeInput}
                  onChange={(e) => {
                    setPasscodeInput(e.target.value);
                    if (passcodeError) setPasscodeError(false);
                  }}
                  placeholder="Введіть код доступу"
                  className="w-full px-4 py-3 rounded-xl border border-[#D5C9B8] bg-[#FAF8F5] text-center font-mono text-base tracking-widest text-[#1E1A17] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8F4F24]/30"
                  autoFocus
                />
                {passcodeError && (
                  <p className="text-xs text-rose-600 font-medium">
                    Неправильний код доступу. Спробуйте: MAN2026
                  </p>
                )}
                <div className="text-[11px] text-[#8C7E70] bg-[#FAF7F2] p-2 rounded-lg border border-[#EDE5DA]">
                  Стандартний код доступу: <strong className="font-mono text-[#8F4F24]">MAN2026</strong>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-[#8F4F24] hover:bg-[#783F1A] text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer shadow-xs"
              >
                Увійти до панелі
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Dashboard View */
          <div className="flex-1 flex flex-col overflow-hidden bg-[#FAF8F5]">
            {/* Top Stats Overview Row */}
            <div className="p-4 sm:p-6 border-b border-[#E8E1D5] bg-white grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#EFECE5]">
                <div className="flex items-center gap-1.5 text-xs text-[#8A7D6F] font-semibold uppercase">
                  <Users className="w-3.5 h-3.5 text-[#8F4F24]" />
                  <span>Всього анкет</span>
                </div>
                <div className="text-2xl font-serif font-bold text-[#1E1A17] mt-1">
                  {totalCount}
                </div>
                <div className="text-[11px] text-[#7A6D5E] mt-0.5">
                  Завершено 1 етап: <strong>{completedCount}</strong>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#EFECE5]">
                <div className="text-xs text-[#8A7D6F] font-semibold uppercase">
                  Група А (Музей)
                </div>
                <div className="text-2xl font-serif font-bold text-[#1E1A17] mt-1">
                  {groupACount}
                </div>
                <div className="text-[11px] text-[#7A6D5E] mt-0.5">
                  Сер. час: <strong>{avgDwellA} с</strong>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#EFECE5]">
                <div className="text-xs text-[#8A7D6F] font-semibold uppercase">
                  Група B (Reels)
                </div>
                <div className="text-2xl font-serif font-bold text-[#1E1A17] mt-1">
                  {groupBCount}
                </div>
                <div className="text-[11px] text-[#7A6D5E] mt-0.5">
                  Сер. час: <strong>{avgDwellB} с</strong> • Перегляд: <strong>{avgCompletionB()}%</strong>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#EFECE5] col-span-2 flex flex-col justify-between">
                <div className="text-xs text-[#8A7D6F] font-semibold uppercase flex items-center justify-between">
                  <span>Експорт для аналізу (МАН)</span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                    Excel ready
                  </span>
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    disabled={sessions.length === 0}
                    className="flex-1 py-2 px-3 bg-[#8F4F24] hover:bg-[#783F1A] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:bg-[#D5CBC0]"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Експорт у CSV (Excel)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportJSON}
                    disabled={sessions.length === 0}
                    className="py-2 px-3 bg-[#FAF7F2] border border-[#D5C9B8] hover:bg-[#EFE9DF] text-[#42372A] text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>JSON</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="px-6 py-3 border-b border-[#E8E1D5] bg-[#FAF8F5] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#7A6E61] font-semibold">Фільтр групи:</span>
                <div className="inline-flex rounded-lg border border-[#D8CEBF] bg-white p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setFilterGroup('all')}
                    className={`px-3 py-1 rounded-md font-medium cursor-pointer ${
                      filterGroup === 'all'
                        ? 'bg-[#8F4F24] text-white shadow-xs'
                        : 'text-[#645648] hover:text-[#2B2724]'
                    }`}
                  >
                    Усі ({sessions.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterGroup('A')}
                    className={`px-3 py-1 rounded-md font-medium cursor-pointer ${
                      filterGroup === 'A'
                        ? 'bg-[#8F4F24] text-white shadow-xs'
                        : 'text-[#645648] hover:text-[#2B2724]'
                    }`}
                  >
                    Група A ({groupACount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterGroup('B')}
                    className={`px-3 py-1 rounded-md font-medium cursor-pointer ${
                      filterGroup === 'B'
                        ? 'bg-[#8F4F24] text-white shadow-xs'
                        : 'text-[#645648] hover:text-[#2B2724]'
                    }`}
                  >
                    Група B ({groupBCount})
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-1 max-w-xs">
                <div className="relative w-full">
                  <Search className="w-3.5 h-3.5 text-[#8A7D6F] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                    placeholder="Пошук за кодом..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#D5C9B8] bg-white text-xs uppercase font-mono text-[#2B2724] focus:outline-none focus:ring-1 focus:ring-[#8F4F24]"
                  />
                </div>
                <button
                  type="button"
                  onClick={loadSessions}
                  disabled={isLoadingList}
                  className="p-2 rounded-lg bg-white border border-[#D5C9B8] text-[#5C4F41] hover:bg-[#F3ECE1] cursor-pointer"
                  title="Оновити список"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingList ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Main Sessions Table */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {filteredSessions.length === 0 ? (
                <div className="text-center py-16 text-[#8A7D6F] space-y-2">
                  <Users className="w-10 h-10 mx-auto text-[#D5CAB9]" />
                  <p className="text-sm font-medium">
                    {isLoadingList ? 'Завантаження сесій з Firestore...' : 'Не знайдено жодної сесії за цим фільтром.'}
                  </p>
                  <p className="text-xs text-[#9E9080]">
                    Коли учні відкриють застосунок та заповнять анкету, їхні результати з&apos;являться тут автоматично.
                  </p>
                </div>
              ) : (
                <div className="border border-[#E5DDD0] rounded-2xl bg-white overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs text-[#2B2724] border-collapse">
                    <thead className="bg-[#FAF7F2] border-b border-[#EAE3D6] text-[#7A6E61] uppercase font-semibold">
                      <tr>
                        <th className="py-3 px-4">Код учасника</th>
                        <th className="py-3 px-3">Група</th>
                        <th className="py-3 px-3">Статус</th>
                        <th className="py-3 px-3">Час початку</th>
                        <th className="py-3 px-3">Час уваги (dwell)</th>
                        <th className="py-3 px-3">Лайки</th>
                        <th className="py-3 px-3">Етап 2</th>
                        <th className="py-3 px-4 text-right">Дія</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0EBE1]">
                      {filteredSessions.map((sessionItem) => {
                        const items = sessionItem.items || {};
                        const totalDwellMs = Object.values(items).reduce(
                          (sum: number, it: any) => sum + (it?.dwellMs || 0),
                          0
                        );
                        const likedCount = Object.values(items).filter(
                          (it: any) => it?.liked
                        ).length;
                        const isFinished = !!sessionItem.phase1CompletedAt;
                        const hasPhase2 = !!sessionItem.phase2;

                        return (
                          <tr
                            key={sessionItem.id}
                            className="hover:bg-[#FCFAF7] transition-colors"
                          >
                            <td className="py-3 px-4 font-mono font-bold text-sm text-[#8F4F24]">
                              {sessionItem.id}
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                                  sessionItem.group === 'A'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-indigo-100 text-indigo-800'
                                }`}
                              >
                                Група {sessionItem.group}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              {isFinished ? (
                                <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px] font-medium">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Завершено
                                </span>
                              ) : (
                                <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
                                  У процесі
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-[#7B6E60]">
                              {sessionItem.startedAt
                                ? new Date(sessionItem.startedAt).toLocaleString('uk-UA', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : '—'}
                            </td>
                            <td className="py-3 px-3 font-mono">
                              {Math.round(totalDwellMs / 1000)} с
                            </td>
                            <td className="py-3 px-3">
                              <span className="flex items-center gap-1 font-semibold text-rose-600">
                                <Heart className="w-3.5 h-3.5 fill-rose-600" />
                                {likedCount}/4
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              {hasPhase2 ? (
                                <span className="text-emerald-700 font-semibold">Є відповіді</span>
                              ) : (
                                <span className="text-[#A49688]">Немає</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => setSelectedSession(sessionItem)}
                                className="px-3 py-1 bg-[#FAF7F2] hover:bg-[#EFE7DC] border border-[#DDD3C5] rounded-lg text-xs font-semibold text-[#544738] inline-flex items-center gap-1 cursor-pointer"
                              >
                                <span>Переглянути</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Detail Session Drawer/Modal */}
      {selectedSession && (
        <div
          className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedSession(null)}
        >
          <div
            className="bg-white rounded-3xl border border-[#E5DDD0] w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-[#EAE3D6] flex items-center justify-between bg-[#FAF7F2]">
              <div>
                <span className="text-xs uppercase font-semibold text-[#8C7D6E]">
                  Деталі сесії учасника
                </span>
                <div className="font-mono text-xl font-bold text-[#8F4F24] mt-0.5">
                  {selectedSession.id} • Група {selectedSession.group}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSession(null)}
                className="p-1 rounded-full text-[#7B6E60] hover:text-[#1E1A17] hover:bg-[#EFE8DD] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-[#2B2724]">
              {/* Interaction per Artwork */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase text-[#7E7061] tracking-wider">
                  Взаємодія з творами (в порядку показу {selectedSession.order?.join(' → ')}):
                </h4>
                <div className="space-y-2">
                  {selectedSession.order?.map((artId: string, idx: number) => {
                    const art = ARTWORKS[artId as keyof typeof ARTWORKS];
                    const item = selectedSession.items?.[artId] || {};
                    return (
                      <div
                        key={artId}
                        className="p-3 rounded-xl bg-[#FAF8F5] border border-[#ECE5DA] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div>
                          <span className="font-bold text-[#1E1A17]">
                            {idx + 1}. {art?.title || artId}
                          </span>
                          <span className="text-[#8A7D6F] ml-1">({art?.author})</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="bg-[#EAE2D5] px-2 py-0.5 rounded font-mono">
                            Dwell: {Math.round((item.dwellMs || 0) / 1000)}с
                          </span>
                          {selectedSession.group === 'B' && (
                            <span className="bg-[#EAE2D5] px-2 py-0.5 rounded font-mono">
                              Watch: {item.watchCompletion || 0}%
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded font-semibold ${
                              item.liked ? 'bg-rose-100 text-rose-800' : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {item.liked ? '♥ Лайк' : 'Без лайку'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded font-semibold ${
                              item.learnMoreClicked
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {item.learnMoreClicked ? 'Відкрив опис' : 'Не відкривав опис'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Survey Answers */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase text-[#7E7061] tracking-wider">
                  Відповіді вхідного опитування (10 питань):
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SURVEY_QUESTIONS.map((q) => {
                    const ans = selectedSession.survey?.[q.id];
                    const chosenOption = q.options.find((o) => o.value === ans);
                    return (
                      <div
                        key={q.id}
                        className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#ECE5DA] space-y-1"
                      >
                        <div className="text-[11px] text-[#786D61] font-medium">
                          №{q.number}. {q.text}
                        </div>
                        <div className="font-bold text-[#8F4F24]">
                          {ans ? `${ans}) ${chosenOption?.label || ''}` : '—'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Phase 2 Answers if any */}
              {selectedSession.phase2 && (
                <div className="space-y-2 border-t border-[#EAE3D6] pt-3">
                  <h4 className="font-bold text-xs uppercase text-[#7E7061] tracking-wider">
                    Відповіді другого етапу (відтворення з пам&apos;яті):
                  </h4>
                  <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#ECE5DA] space-y-2 text-xs">
                    <div>
                      <span className="font-semibold text-[#54493D]">Що запам&apos;яталося:</span>
                      <p className="mt-1 p-2 bg-white rounded-lg border border-[#E8E0D4] text-[#2B2724]">
                        {selectedSession.phase2.freeRecall}
                      </p>
                    </div>
                    {selectedSession.phase2.responses?.q_haywain_meaning && (
                      <div>
                        <span className="font-semibold text-[#54493D]">Символізм воза сіна:</span>
                        <p className="mt-1 p-2 bg-white rounded-lg border border-[#E8E0D4] text-[#2B2724]">
                          {selectedSession.phase2.responses.q_haywain_meaning}
                        </p>
                      </div>
                    )}
                    {selectedSession.phase2.responses?.q_impression && (
                      <div>
                        <span className="font-semibold text-[#54493D]">Враження від формату:</span>
                        <p className="mt-1 p-2 bg-white rounded-lg border border-[#E8E0D4] text-[#2B2724]">
                          {selectedSession.phase2.responses.q_impression}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
