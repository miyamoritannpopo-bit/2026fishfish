import React, { useState, useMemo } from 'react';
import { LearningTerm, FishSpecies, CaughtRecord, Subject } from '../types/game';
import { FISH_SPECIES_LIST, SUBJECT_METADATA } from '../data/termsData';
import { FishSprite } from './FishSprite';
import { speakJapanese } from '../utils/audio';
import { Search, Volume2, CheckCircle2, Lock, BookOpen, Fish } from 'lucide-react';

interface EncyclopediaViewProps {
  terms: LearningTerm[];
  caughtRecords: CaughtRecord[];
  onSelectTermToFish: (termId: string) => void;
}

export const EncyclopediaView: React.FC<EncyclopediaViewProps> = ({
  terms,
  caughtRecords,
  onSelectTermToFish,
}) => {
  const [tab, setTab] = useState<'terms' | 'fish'>('terms');
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<Subject | 'all'>('all');
  const [selectedTermDetail, setSelectedTermDetail] = useState<LearningTerm | null>(null);

  // Check if a term has been caught
  const caughtMap = useMemo(() => {
    const map = new Map<string, CaughtRecord>();
    caughtRecords.forEach((r) => map.set(r.termId, r));
    return map;
  }, [caughtRecords]);

  // Caught species ids
  const caughtSpeciesSet = useMemo(() => {
    return new Set(caughtRecords.map((r) => r.fishSpeciesId));
  }, [caughtRecords]);

  // Filtered terms
  const filteredTerms = useMemo(() => {
    return terms.filter((item) => {
      if (subjectFilter !== 'all' && item.subject !== subjectFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTerm = item.term.toLowerCase().includes(query);
        const matchReading = item.reading.includes(query);
        const matchDef = item.definition.toLowerCase().includes(query);
        const matchCat = item.category.toLowerCase().includes(query);
        if (!matchTerm && !matchReading && !matchDef && !matchCat) return false;
      }
      return true;
    });
  }, [terms, subjectFilter, searchQuery]);

  // Filtered fish species
  const filteredFish = useMemo(() => {
    return FISH_SPECIES_LIST.filter((species) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = species.name.toLowerCase().includes(query);
        const matchSci = species.scientificName.toLowerCase().includes(query);
        if (!matchName && !matchSci) return false;
      }
      return true;
    });
  }, [searchQuery]);

  const totalTermsCount = terms.length;
  const caughtTermsCount = caughtRecords.length;
  const termCompletionPct = Math.round((caughtTermsCount / Math.max(1, totalTermsCount)) * 100);

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 select-none">
      {/* Top Header & Search Strip */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-5 bg-white border border-slate-200 rounded-3xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-sky-600" />
            <span>魚＆学習用語 図鑑</span>
          </h2>
          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
            <span>
              用語収集率: <strong className="text-sky-700">{caughtTermsCount}</strong> / {totalTermsCount} ({termCompletionPct}%)
            </span>
            <span aria-hidden="true">·</span>
            <span>
              魚種発見数: <strong className="text-amber-700">{caughtSpeciesSet.size}</strong> / {FISH_SPECIES_LIST.length}
            </span>
          </div>
        </div>

        {/* Search & Switch Tabs */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Tab Selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setTab('terms')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                tab === 'terms'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>学習用語</span>
            </button>
            <button
              onClick={() => setTab('fish')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                tab === 'fish'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Fish className="w-3.5 h-3.5" />
              <span>魚種一覧</span>
            </button>
          </div>

          {/* Search box */}
          <div className="relative min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="用語や魚の名前で検索..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>
        </div>
      </div>

      {/* Subject Filter Bar (when on terms tab) */}
      {tab === 'terms' && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSubjectFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
              subjectFilter === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            すべての教科
          </button>
          {(['social', 'math', 'science'] as Subject[]).map((sub) => {
            const meta = SUBJECT_METADATA[sub];
            const isSelected = subjectFilter === sub;
            return (
              <button
                key={sub}
                onClick={() => setSubjectFilter(sub)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                  isSelected
                    ? `${meta.badgeClass} shadow-xs font-bold`
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {meta.label} ({meta.sublabel})
              </button>
            );
          })}
        </div>
      )}

      {/* Grid of Terms or Fish */}
      {tab === 'terms' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTerms.map((term) => {
            const record = caughtMap.get(term.id);
            const isCaught = !!record;
            const meta = SUBJECT_METADATA[term.subject];
            const species = FISH_SPECIES_LIST.find((f) => f.id === term.fishSpeciesId);

            return (
              <div
                key={term.id}
                onClick={() => setSelectedTermDetail(term)}
                className={`group relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                  isCaught
                    ? 'bg-white border-slate-200 hover:border-sky-400 hover:shadow-md'
                    : 'bg-slate-50/70 border-dashed border-slate-200 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${meta.badgeClass}`}>
                      {meta.label} · {term.category}
                    </span>
                    <span className="text-[10px] text-slate-400">{term.grade}</span>
                  </div>

                  {isCaught ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>釣獲済 ({record.count})</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                      <Lock className="w-3 h-3" />
                      <span>未釣獲</span>
                    </span>
                  )}
                </div>

                <div className="mb-2">
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                    {term.term}
                  </h3>
                  <div className="text-xs text-slate-400">【{term.reading}】</div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
                  {term.definition}
                </p>

                {species && (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                    <span className="truncate">対応魚: {species.name}</span>
                    <span className="text-amber-600 shrink-0 font-medium">★{species.rarity}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Fish Catalog Tab */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredFish.map((species) => {
            const isDiscovered = caughtSpeciesSet.has(species.id);

            return (
              <div
                key={species.id}
                className={`p-4 rounded-2xl border text-center transition-all ${
                  isDiscovered
                    ? 'bg-white border-slate-200 shadow-xs hover:shadow-md'
                    : 'bg-slate-100/80 border-dashed border-slate-200 opacity-60'
                }`}
              >
                <div className="h-24 flex items-center justify-center my-2">
                  {isDiscovered ? (
                    <FishSprite species={species} size="md" isSwimming={true} />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Lock className="w-8 h-8 mb-1" />
                      <span className="text-[11px]">未発見</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-center gap-1 text-xs text-amber-500 font-bold mb-1">
                  {'★'.repeat(species.rarity)}
                </div>

                <h4 className="text-sm font-bold text-slate-900">
                  {isDiscovered ? species.name : '？？？'}
                </h4>
                <div className="text-[10px] text-slate-400 italic mb-2">
                  {species.scientificName}
                </div>

                <p className="text-xs text-slate-600 leading-snug line-clamp-2">
                  {species.description}
                </p>

                <div className="mt-3 pt-2 border-t border-slate-100 text-xs font-bold text-sky-700">
                  {species.points} pt
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Term Detail Modal */}
      {selectedTermDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 md:p-7 shadow-2xl border border-sky-100 animate-scaleUp">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <span
                  className={`inline-block px-2.5 py-0.5 text-xs font-bold rounded-md border mb-2 ${
                    SUBJECT_METADATA[selectedTermDetail.subject].badgeClass
                  }`}
                >
                  {SUBJECT_METADATA[selectedTermDetail.subject].label} ·{' '}
                  {selectedTermDetail.category} · {selectedTermDetail.grade}
                </span>
                <h3 className="text-2xl font-black text-slate-900">
                  {selectedTermDetail.term}
                </h3>
                <div className="text-sm text-sky-700 font-semibold">
                  【{selectedTermDetail.reading}】
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    speakJapanese(
                      `${selectedTermDetail.term}。${selectedTermDetail.definition}`
                    )
                  }
                  className="p-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 transition-colors"
                  title="発音を聞く"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setSelectedTermDetail(null)}
                  className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
                >
                  閉じる
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 mb-4">
              <div className="text-xs font-bold text-slate-500 mb-1">【用語の解説】</div>
              <p className="text-sm text-slate-800 leading-relaxed">
                {selectedTermDetail.definition}
              </p>
              {selectedTermDetail.example && (
                <div className="text-xs text-slate-600 mt-2.5 pt-2 border-t border-slate-200">
                  <span className="font-semibold">例・ポイント: </span>
                  {selectedTermDetail.example}
                </div>
              )}
            </div>

            {/* Hint previews */}
            <div className="mb-5">
              <div className="text-xs font-bold text-slate-500 mb-1.5">【ヒント】</div>
              <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                {selectedTermDetail.hints.map((hint, idx) => (
                  <li key={idx}>{hint}</li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  const targetId = selectedTermDetail.id;
                  setSelectedTermDetail(null);
                  onSelectTermToFish(targetId);
                }}
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Fish className="w-4 h-4" />
                <span>この用語の魚を釣りに行く</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
