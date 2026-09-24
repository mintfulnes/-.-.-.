import React, { useState, useEffect } from 'react';
import { getAllSessionsDocs } from '../firebase';
import { ARTWORKS } from '../data/artworks';
import { SURVEY_QUESTIONS } from '../data/surveyQuestions';
import { ResearchCharts } from './ResearchCharts';
import {
  X,
  Search,
  FileSpreadsheet,
  FileText,
  Database,
  Lock,
  Users,
  RefreshCw,
  Heart,
  CheckCircle2,
  ChevronRight,
  BarChart2,
  Table as TableIcon
} from 'lucide-react';

interface ResearcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSessionCode?: string;
}

// Passcode strictly updated to JAS2627 as requested
const PASSCODE = 'JAS2627';

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
  const [viewMode, setViewMode] = useState<'table' | 'charts'>('charts');

  const [selectedSession, setSelectedSession] = useState<any | null>(null);

  const loadSessions = async () => {
    setIsLoadingList(true);
    try {
      const data = await getAllSessionsDocs();
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
    if (passcodeInput.trim() === PASSCODE) {
      setIsAuthenticated(true);
      setPasscodeError(false);
    } else {
      setPasscodeError(true);
    }
  };

  const filteredSessions = sessions.filter((s) => {
    const matchesGroup = filterGroup === 'all' || s.group === filterGroup;
    const matchesSearch =
      !searchQuery.trim() ||
      s.id?.toUpperCase().includes(searchQuery.trim().toUpperCase());
    return matchesGroup && matchesSearch;
  });

  const totalCount = sessions.length;
  const groupACount = sessions.filter((s) => s.group === 'A').length;
  const groupBCount = sessions.filter((s) => s.group === 'B').length;
  const completedCount = sessions.filter((s) => !!s.phase1CompletedAt).length;

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

  const handleExportCSV = () => {
    if (sessions.length === 0) return;

    const headers = [
      'Код сесії',
      'Група',
      'Дата початку',
      'Дата завершення 1 етапу',
      'Сумарний час уваги (сек)',
      'К-сть вподобань (лайків)',
      ...SURVEY_QUESTIONS.map((q) => `Анкета_П${q.number}`),
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
      'proverbs_watch_pct',
      'haywain_watch_pct',
      'anatomy_watch_pct',
      'sea_watch_pct',
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
        ...SURVEY_QUESTIONS.map((q) => {
          const val = survey[q.id];
          return formatCell(Array.isArray(val) ? val.join(', ') : (val || ''));
        }),
        formatCell(Math.round((items.proverbs?.dwellMs || 0) / 1000)),
        formatCell(items.proverbs?.liked ? 'ТАК' : 'НІ'),
        formatCell(items.proverbs?.learnMoreClicked ? 'ТАК' : 'НІ'),
        formatCell(Math.round((items.haywain?.dwellMs || 0) / 1000)),
        formatCell(items.haywain?.liked ? 'ТАК' : 'НІ'),
        formatCell(items.haywain?.learnMoreClicked ? 'ТАК' : 'НІ'),
        formatCell(Math.round((items.anatomy?.dwellMs || 0) / 1000)),
        formatCell(items.anatomy?.liked ? 'ТАК' : 'НІ'),
        formatCell(items.anatomy?.learnMoreClicked ? 'ТАК' : 'НІ'),
        formatCell(Math.round((items.sea?.dwellMs || 0) / 1000)),
        formatCell(items.sea?.liked ? 'ТАК' : 'НІ'),
        formatCell(items.sea?.learnMoreClicked ? 'ТАК' : 'НІ'),
        formatCell(items.proverbs?.watchCompletion ?? ''),
        formatCell(items.haywain?.watchCompletion ?? ''),
        formatCell(items.anatomy?.watchCompletion ?? ''),
        formatCell(items.sea?.watchCompletion ?? ''),
        formatCell(phase2.freeRecall || ''),
        formatCell(responses.q_haywain_meaning || ''),
        formatCell(responses.q_impression || ''),
        formatCell(s.device || '')
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `art_research_sessions_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 select-text">
      <div className="bg-white rounded-3xl border border-[#E5DDD0] w-full max-w-5xl h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-3.5 border-b border-[#EAE3D6] flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#8F4F24] text-white flex items-center justify-center shadow-xs">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-base sm:text-lg font-bold text-[#1E1A17]">
                Панель дослідника (МАН)
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[#7B6E60] hover:text-[#1E1A17] hover:bg-[#EFE8DD] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Passcode Login Screen */}
        {!isAuthenticated ? (
          <div className="flex-1 flex items-center justify-center p-6 bg-[#FAF8F5]">
            <form
              onSubmit={handlePasscodeSubmit}
              className="max-w-sm w-full bg-white border border-[#E5DDD0] rounded-3xl p-8 text-center space-y-4 shadow-sm"
            >
              <div className="w-12 h-12 rounded-full bg-[#FAF3EC] text-[#8F4F24] flex items-center justify-center mx-auto border border-[#EEDFCE]">
                <Lock className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h4 className="font-serif text-lg font-bold text-[#1E1A17]">
                  Вхід для керівника
                </h4>
                <p className="text-xs text-[#736657]">
                  Введіть пароль доступу для перегляду наукових результатів.
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
                  placeholder="Пароль"
                  className="w-full px-4 py-3 rounded-xl border border-[#D5C9B8] bg-[#FAF8F5] text-center font-mono text-base tracking-widest text-[#1E1A17] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8F4F24]/30"
                  autoFocus
                />
                {passcodeError && (
                  <p className="text-xs text-rose-600 font-medium">
                    Неправильний пароль доступу.
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#8F4F24] hover:bg-[#783F1A] text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer shadow-xs"
              >
                Увійти
              </button>
            </form>
          </div>
        ) : (
          /* Dashboard Content */
          <div className="flex-1 flex flex-col overflow-hidden bg-[#FAF8F5]">
            {/* Top Quick Stats */}
            <div className="p-3 sm:p-4 border-b border-[#E8E1D5] bg-white grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFECE5]">
                <div className="flex items-center gap-1.5 text-[11px] text-[#8A7D6F] font-semibold uppercase">
                  <Users className="w-3 h-3 text-[#8F4F24]" />
                  <span>Всього анкет</span>
                </div>
                <div className="text-xl font-serif font-bold text-[#1E1A17] mt-0.5">
                  {totalCount}
                </div>
                <div className="text-[10px] text-[#7A6D5E]">
                  Завершено: <strong>{completedCount}</strong>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFECE5]">
                <div className="text-[11px] text-[#8A7D6F] font-semibold uppercase">
                  Група А (Музей)
                </div>
                <div className="text-xl font-serif font-bold text-[#1E1A17] mt-0.5">
                  {groupACount}
                </div>
                <div className="text-[10px] text-[#7A6D5E]">
                  Сер. час: <strong>{avgDwellA} с</strong>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFECE5]">
                <div className="text-[11px] text-[#8A7D6F] font-semibold uppercase">
                  Група B (Reels)
                </div>
                <div className="text-xl font-serif font-bold text-[#1E1A17] mt-0.5">
                  {groupBCount}
                </div>
                <div className="text-[10px] text-[#7A6D5E]">
                  Сер. час: <strong>{avgDwellB} с</strong> • Перегляд: <strong>{avgCompletionB()}%</strong>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFECE5] col-span-2 flex flex-col justify-between">
                <div className="text-[11px] text-[#8A7D6F] font-semibold uppercase flex items-center justify-between">
                  <span>Експорт даних</span>
                  <span className="text-[9px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                    Excel UTF-8
                  </span>
                </div>
                <div className="flex gap-2 mt-1.5">
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    disabled={sessions.length === 0}
                    className="flex-1 py-1.5 px-2.5 bg-[#8F4F24] hover:bg-[#783F1A] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:bg-[#D5CBC0]"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>CSV (Excel)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportJSON}
                    disabled={sessions.length === 0}
                    className="py-1.5 px-2.5 bg-[#FAF7F2] border border-[#D5C9B8] hover:bg-[#EFE9DF] text-[#42372A] text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>JSON</span>
                  </button>
                </div>
              </div>
            </div>

            {/* View Mode Toggle Bar */}
            <div className="px-4 sm:px-6 py-2 border-b border-[#E8E1D5] bg-[#FAF8F5] flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="inline-flex rounded-lg border border-[#D8CEBF] bg-white p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('charts')}
                  className={`px-3 py-1 rounded-md font-semibold flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'charts'
                      ? 'bg-[#8F4F24] text-white shadow-2xs'
                      : 'text-[#645648] hover:text-[#2B2724]'
                  }`}
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span>Графіки та аналітика</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1 rounded-md font-semibold flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-[#8F4F24] text-white shadow-2xs'
                      : 'text-[#645648] hover:text-[#2B2724]'
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>Таблиця сесій ({sessions.length})</span>
                </button>
              </div>

              {viewMode === 'table' && (
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3 h-3 text-[#8A7D6F] absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                      placeholder="Пошук..."
                      className="pl-7 pr-2.5 py-1 rounded-lg border border-[#D5C9B8] bg-white text-xs font-mono text-[#2B2724] focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={loadSessions}
                    disabled={isLoadingList}
                    className="p-1.5 rounded-lg bg-white border border-[#D5C9B8] text-[#5C4F41] hover:bg-[#F3ECE1] cursor-pointer"
                    title="Оновити"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingList ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              )}
            </div>

            {/* Main Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {viewMode === 'charts' ? (
                <ResearchCharts sessions={sessions} />
              ) : (
                <div className="border border-[#E5DDD0] rounded-2xl bg-white overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs text-[#2B2724] border-collapse">
                    <thead className="bg-[#FAF7F2] border-b border-[#EAE3D6] text-[#7A6E61] uppercase font-semibold text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Код</th>
                        <th className="py-2.5 px-2.5">Група</th>
                        <th className="py-2.5 px-2.5">Статус</th>
                        <th className="py-2.5 px-2.5">Час</th>
                        <th className="py-2.5 px-2.5">Dwell</th>
                        <th className="py-2.5 px-2.5">Лайки</th>
                        <th className="py-2.5 px-2.5">Етап 2</th>
                        <th className="py-2.5 px-3 text-right">Дія</th>
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
                          <tr key={sessionItem.id} className="hover:bg-[#FCFAF7] transition-colors">
                            <td className="py-2.5 px-3 font-mono font-bold text-xs text-[#8F4F24]">
                              {sessionItem.id}
                            </td>
                            <td className="py-2.5 px-2.5">
                              <span
                                className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                  sessionItem.group === 'A'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-indigo-100 text-indigo-800'
                                }`}
                              >
                                {sessionItem.group}
                              </span>
                            </td>
                            <td className="py-2.5 px-2.5">
                              {isFinished ? (
                                <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full text-[10px] font-medium">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Готово
                                </span>
                              ) : (
                                <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full font-medium">
                                  У процесі
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-2.5 text-[#7B6E60] text-[11px]">
                              {sessionItem.startedAt
                                ? new Date(sessionItem.startedAt).toLocaleTimeString('uk-UA', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : '—'}
                            </td>
                            <td className="py-2.5 px-2.5 font-mono text-[11px]">
                              {Math.round(totalDwellMs / 1000)}с
                            </td>
                            <td className="py-2.5 px-2.5 text-[11px]">
                              <span className="flex items-center gap-1 font-semibold text-rose-600">
                                <Heart className="w-3 h-3 fill-rose-600" />
                                {likedCount}/4
                              </span>
                            </td>
                            <td className="py-2.5 px-2.5 text-[11px]">
                              {hasPhase2 ? (
                                <span className="text-emerald-700 font-semibold">Є</span>
                              ) : (
                                <span className="text-[#A49688]">—</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => setSelectedSession(sessionItem)}
                                className="px-2.5 py-0.5 bg-[#FAF7F2] hover:bg-[#EFE7DC] border border-[#DDD3C5] rounded text-[11px] font-semibold text-[#544738] inline-flex items-center gap-0.5 cursor-pointer"
                              >
                                <span>Анкета</span>
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

      {/* Detail Session Drawer */}
      {selectedSession && (
        <div
          className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3"
          onClick={() => setSelectedSession(null)}
        >
          <div
            className="bg-white rounded-3xl border border-[#E5DDD0] w-full max-w-2xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3 border-b border-[#EAE3D6] flex items-center justify-between bg-[#FAF7F2]">
              <div>
                <span className="text-[10px] uppercase font-semibold text-[#8C7D6E]">
                  Анкета учасника
                </span>
                <div className="font-mono text-base font-bold text-[#8F4F24]">
                  {selectedSession.id} • Група {selectedSession.group}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSession(null)}
                className="p-1 rounded-full text-[#7B6E60] hover:text-[#1E1A17] hover:bg-[#EFE8DD] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-5 text-xs text-[#2B2724]">
              {/* Artworks breakdown */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-[11px] uppercase text-[#7E7061] tracking-wider">
                  Взаємодія з творами:
                </h4>
                <div className="space-y-1.5">
                  {selectedSession.order?.map((artId: string, idx: number) => {
                    const art = ARTWORKS[artId as keyof typeof ARTWORKS];
                    const item = selectedSession.items?.[artId] || {};
                    return (
                      <div
                        key={artId}
                        className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#ECE5DA] flex items-center justify-between"
                      >
                        <div>
                          <span className="font-bold text-[#1E1A17]">
                            {idx + 1}. {art?.title || artId}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px]">
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
                            {item.liked ? '♥ Лайк' : '—'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Survey Answers */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-[11px] uppercase text-[#7E7061] tracking-wider">
                  Вхідна анкета (10 питань):
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {SURVEY_QUESTIONS.map((q) => {
                    const ans = selectedSession.survey?.[q.id];
                    let displayAns = '—';
                    if (ans) {
                      if (Array.isArray(ans)) {
                        displayAns = ans
                          .map((val) => {
                            const opt = q.options.find((o) => o.value === val);
                            return `${val}) ${opt?.label || val}`;
                          })
                          .join('; ');
                      } else {
                        const chosenOption = q.options.find((o) => o.value === ans);
                        displayAns = `${ans}) ${chosenOption?.label || ''}`;
                      }
                    }
                    return (
                      <div
                        key={q.id}
                        className="p-2 rounded-lg bg-[#FAF8F5] border border-[#ECE5DA] space-y-0.5"
                      >
                        <div className="text-[10px] text-[#786D61] font-medium line-clamp-1">
                          №{q.number}. {q.text}
                        </div>
                        <div className="font-bold text-[#8F4F24] text-[11px]">
                          {displayAns}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Phase 2 Answers */}
              {selectedSession.phase2 && (
                <div className="space-y-1.5 border-t border-[#EAE3D6] pt-2.5">
                  <h4 className="font-bold text-[11px] uppercase text-[#7E7061] tracking-wider">
                    Відповіді 2-го етапу (пам&apos;ять):
                  </h4>
                  <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#ECE5DA] space-y-2 text-xs">
                    <div>
                      <span className="font-semibold text-[#54493D]">Що запам&apos;яталося:</span>
                      <p className="mt-0.5 p-2 bg-white rounded border border-[#E8E0D4]">
                        {selectedSession.phase2.freeRecall}
                      </p>
                    </div>
                    {selectedSession.phase2.responses?.q_haywain_meaning && (
                      <div>
                        <span className="font-semibold text-[#54493D]">Символізм воза сіна:</span>
                        <p className="mt-0.5 p-2 bg-white rounded border border-[#E8E0D4]">
                          {selectedSession.phase2.responses.q_haywain_meaning}
                        </p>
                      </div>
                    )}
                    {selectedSession.phase2.responses?.q_impression && (
                      <div>
                        <span className="font-semibold text-[#54493D]">Враження від показу:</span>
                        <p className="mt-0.5 p-2 bg-white rounded border border-[#E8E0D4]">
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
