import React, { useState } from 'react';
import { ARTWORKS, ARTWORK_IDS } from '../data/artworks';
import { SURVEY_QUESTIONS } from '../data/surveyQuestions';
import { BarChart3, PieChart, TrendingUp, Heart, Clock, Video } from 'lucide-react';

interface ResearchChartsProps {
  sessions: any[];
}

export const ResearchCharts: React.FC<ResearchChartsProps> = ({ sessions }) => {
  const [activeTab, setActiveTab] = useState<'dwell' | 'likes' | 'survey' | 'video'>('dwell');

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12 text-[#8A7D6F] text-xs">
        Недостатньо даних для побудови графіків. Зачекайте на перші відповіді учнів.
      </div>
    );
  }

  const groupA = sessions.filter((s) => s.group === 'A');
  const groupB = sessions.filter((s) => s.group === 'B');

  // Dwell times calculation per artwork
  const getAvgDwell = (artId: string, groupList: any[]) => {
    if (groupList.length === 0) return 0;
    const total = groupList.reduce(
      (sum, s) => sum + (s.items?.[artId]?.dwellMs || 0),
      0
    );
    return Math.round(total / groupList.length / 1000);
  };

  const dwellData = ARTWORK_IDS.map((id) => ({
    id,
    title: ARTWORKS[id].title,
    dwellA: getAvgDwell(id, groupA),
    dwellB: getAvgDwell(id, groupB)
  }));

  const maxDwell = Math.max(
    1,
    ...dwellData.map((d) => Math.max(d.dwellA, d.dwellB))
  );

  // Likes calculation per artwork
  const likesData = ARTWORK_IDS.map((id) => {
    const totalLikes = sessions.filter((s) => s.items?.[id]?.liked).length;
    const likesA = groupA.filter((s) => s.items?.[id]?.liked).length;
    const likesB = groupB.filter((s) => s.items?.[id]?.liked).length;
    const pct = Math.round((totalLikes / sessions.length) * 100);
    return {
      id,
      title: ARTWORKS[id].title,
      totalLikes,
      likesA,
      likesB,
      pct
    };
  });

  // Video watch completion for Group B
  const videoData = ARTWORK_IDS.map((id) => {
    if (groupB.length === 0) return { id, title: ARTWORKS[id].title, avgWatch: 0 };
    const totalWatch = groupB.reduce(
      (sum, s) => sum + (s.items?.[id]?.watchCompletion || 0),
      0
    );
    return {
      id,
      title: ARTWORKS[id].title,
      avgWatch: Math.round(totalWatch / groupB.length)
    };
  });

  // Survey distribution helper
  const getSurveyDistribution = (questionId: string) => {
    const question = SURVEY_QUESTIONS.find((q) => q.id === questionId);
    if (!question) return [];
    return question.options.map((opt) => {
      const count = sessions.filter((s) => {
        const val = s.survey?.[questionId];
        if (Array.isArray(val)) return val.includes(opt.value);
        return val === opt.value;
      }).length;
      const pct = sessions.length > 0 ? Math.round((count / sessions.length) * 100) : 0;
      return {
        label: opt.label,
        value: opt.value,
        count,
        pct
      };
    });
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-[#E8E1D5] pb-2 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('dwell')}
          className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 cursor-pointer transition-colors ${
            activeTab === 'dwell'
              ? 'bg-[#8F4F24] text-white shadow-2xs'
              : 'bg-[#FAF7F2] text-[#635546] hover:bg-[#F1EAE0]'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Час уваги (Dwell Time)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('likes')}
          className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 cursor-pointer transition-colors ${
            activeTab === 'likes'
              ? 'bg-[#8F4F24] text-white shadow-2xs'
              : 'bg-[#FAF7F2] text-[#635546] hover:bg-[#F1EAE0]'
          }`}
        >
          <Heart className="w-3.5 h-3.5" />
          <span>Вподобання картин</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('video')}
          className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 cursor-pointer transition-colors ${
            activeTab === 'video'
              ? 'bg-[#8F4F24] text-white shadow-2xs'
              : 'bg-[#FAF7F2] text-[#635546] hover:bg-[#F1EAE0]'
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          <span>Перегляд відео (% Group B)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('survey')}
          className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 cursor-pointer transition-colors ${
            activeTab === 'survey'
              ? 'bg-[#8F4F24] text-white shadow-2xs'
              : 'bg-[#FAF7F2] text-[#635546] hover:bg-[#F1EAE0]'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Результати опитування</span>
        </button>
      </div>

      {/* Tab 1: Dwell Time Comparison */}
      {activeTab === 'dwell' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5DDD0] space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-serif text-sm sm:text-base font-bold text-[#1E1A17]">
              Порівняння середнього часу перегляду картин (секунди)
            </h4>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-amber-800">
                <span className="w-3 h-3 rounded bg-amber-500 inline-block" />
                Група А (Музей)
              </span>
              <span className="flex items-center gap-1.5 text-indigo-800">
                <span className="w-3 h-3 rounded bg-indigo-500 inline-block" />
                Група B (Reels)
              </span>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {dwellData.map((d) => (
              <div key={d.id} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-[#2B2724]">
                  <span>{d.title}</span>
                  <span className="font-mono text-[#7B6E60]">
                    A: <strong className="text-amber-800">{d.dwellA}с</strong> | B: <strong className="text-indigo-800">{d.dwellB}с</strong>
                  </span>
                </div>
                {/* Dual bar */}
                <div className="space-y-1">
                  <div className="w-full bg-[#FAF3EC] h-3.5 rounded-full overflow-hidden flex items-center p-0.5">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(5, (d.dwellA / maxDwell) * 100)}%` }}
                    />
                  </div>
                  <div className="w-full bg-[#EEF2FF] h-3.5 rounded-full overflow-hidden flex items-center p-0.5">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(5, (d.dwellB / maxDwell) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-[11px] text-[#8C7E70] bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EDE5DA] leading-relaxed">
            Показник dwell time фіксує сумарний час знаходження твору у видимій зоні екрана. Дозволяє перевірити гіпотезу: чи схильні підлітки довше розглядати статичні музейні картки, чи динамічні Reels.
          </div>
        </div>
      )}

      {/* Tab 2: Likes per Artwork */}
      {activeTab === 'likes' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5DDD0] space-y-4">
          <h4 className="font-serif text-sm sm:text-base font-bold text-[#1E1A17]">
            Рейтинг вподобань серед учасників
          </h4>

          <div className="space-y-3.5 pt-1">
            {likesData.map((d) => (
              <div key={d.id} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-[#1E1A17]">
                    <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                    {d.title}
                  </span>
                  <span className="font-mono text-rose-700">
                    {d.totalLikes} вподобань ({d.pct}%)
                  </span>
                </div>
                <div className="w-full bg-[#FAF0F2] h-4 rounded-full overflow-hidden p-0.5">
                  <div
                    className="bg-rose-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(4, d.pct)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-[#8C7E70] px-1">
                  <span>Група А: {d.likesA} лайків</span>
                  <span>Група Б: {d.likesB} лайків</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Video Watch Completion */}
      {activeTab === 'video' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5DDD0] space-y-4">
          <h4 className="font-serif text-sm sm:text-base font-bold text-[#1E1A17]">
            Середній відсоток перегляду відео в Групі B (Reels)
          </h4>

          <div className="space-y-3.5 pt-1">
            {videoData.map((d) => (
              <div key={d.id} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[#1E1A17]">{d.title}</span>
                  <span className="font-mono text-indigo-700 font-bold">{d.avgWatch}%</span>
                </div>
                <div className="w-full bg-[#EEF2FF] h-4 rounded-full overflow-hidden p-0.5">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(4, d.avgWatch)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="text-[11px] text-[#8C7E70] bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EDE5DA]">
            Показує максимальну глибину доглядання короткого відеоролика для кожного твору в стрічці формату Б.
          </div>
        </div>
      )}

      {/* Tab 4: Survey Distribution */}
      {activeTab === 'survey' && (
        <div className="space-y-4">
          {/* Q1 */}
          <div className="p-4 rounded-2xl bg-white border border-[#E5DDD0] space-y-2">
            <h5 className="font-semibold text-xs text-[#1E1A17]">
              Питання 1. Як часто ви бачите мистецький контент у соціальних мережах?
            </h5>
            <div className="space-y-1.5 pt-1">
              {getSurveyDistribution('q1').map((item) => (
                <div key={item.value} className="space-y-0.5">
                  <div className="flex justify-between text-[11px] text-[#4E4338]">
                    <span>{item.label}</span>
                    <span className="font-mono font-bold text-[#8F4F24]">{item.count} ({item.pct}%)</span>
                  </div>
                  <div className="w-full bg-[#FAF7F2] h-2 rounded-full overflow-hidden">
                    <div className="bg-[#8F4F24] h-full rounded-full" style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Q7: Effectiveness */}
          <div className="p-4 rounded-2xl bg-white border border-[#E5DDD0] space-y-2">
            <h5 className="font-semibold text-xs text-[#1E1A17]">
              Питання 7. Ефективність соцмереж для популяризації мистецтва (1–5):
            </h5>
            <div className="grid grid-cols-5 gap-2 pt-1">
              {getSurveyDistribution('q7').map((item) => (
                <div key={item.value} className="p-2 rounded-xl bg-[#FAF8F5] border border-[#ECE5DA] text-center">
                  <div className="font-bold text-sm text-[#8F4F24]">{item.value}</div>
                  <div className="text-xs font-semibold text-[#1E1A17] mt-0.5">{item.count}</div>
                  <div className="text-[10px] text-[#8C7E70]">{item.pct}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Q10: Superficial perception */}
          <div className="p-4 rounded-2xl bg-white border border-[#E5DDD0] space-y-2">
            <h5 className="font-semibold text-xs text-[#1E1A17]">
              Питання 10. Чи погоджуєтеся, що мистецтво в соцмережах сприймається поверхово?
            </h5>
            <div className="space-y-1.5 pt-1">
              {getSurveyDistribution('q10').map((item) => (
                <div key={item.value} className="space-y-0.5">
                  <div className="flex justify-between text-[11px] text-[#4E4338]">
                    <span>{item.label}</span>
                    <span className="font-mono font-bold text-[#8F4F24]">{item.count} ({item.pct}%)</span>
                  </div>
                  <div className="w-full bg-[#FAF7F2] h-2 rounded-full overflow-hidden">
                    <div className="bg-[#8F4F24] h-full rounded-full" style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
