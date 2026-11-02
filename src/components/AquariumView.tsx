import React, { useState } from 'react';
import { CaughtRecord, LearningTerm, FishSpecies, Subject } from '../types/game';
import { FISH_SPECIES_LIST, SUBJECT_METADATA } from '../data/termsData';
import { FishSprite } from './FishSprite';
import { speakJapanese } from '../utils/audio';
import { Volume2, Sparkles, Compass } from 'lucide-react';

interface AquariumViewProps {
  caughtRecords: CaughtRecord[];
  allTerms: LearningTerm[];
  onStartFishing: () => void;
}

export const AquariumView: React.FC<AquariumViewProps> = ({
  caughtRecords,
  allTerms,
  onStartFishing,
}) => {
  const [selectedFishTerm, setSelectedFishTerm] = useState<{
    term: LearningTerm;
    species: FishSpecies;
    record: CaughtRecord;
  } | null>(null);

  const [activeFilter, setActiveFilter] = useState<Subject | 'all'>('all');

  // Map caught records to terms & species
  const aquariumFish = caughtRecords
    .map((record) => {
      const term = allTerms.find((t) => t.id === record.termId);
      const species = FISH_SPECIES_LIST.find((f) => f.id === record.fishSpeciesId);
      if (!term || !species) return null;
      return { term, species, record };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .filter((item) => activeFilter === 'all' || item.term.subject === activeFilter);

  return (
    <div className="relative w-full max-w-5xl mx-auto flex flex-col gap-6 select-none">
      {/* Top Controls & Stats */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-sky-500" />
            <span>マイ用語水族館</span>
          </h2>
          <p className="text-xs text-slate-500">
            釣り上げた魚たちが自由に泳いでいます。魚をタップすると学習用語を復習できます！
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeFilter === 'all'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            すべて ({caughtRecords.length})
          </button>
          {(['social', 'math', 'science'] as Subject[]).map((sub) => {
            const meta = SUBJECT_METADATA[sub];
            const count = caughtRecords.filter((r) => {
              const t = allTerms.find((term) => term.id === r.termId);
              return t?.subject === sub;
            }).length;

            return (
              <button
                key={sub}
                onClick={() => setActiveFilter(sub)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeFilter === sub
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {meta.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Aquarium Tank */}
      <div className="relative w-full h-[520px] rounded-3xl overflow-hidden border border-sky-300/40 shadow-2xl bg-sky-950">
        {/* Background Coral Reef Image */}
        <img
          src="/src/assets/images/aquarium_exhibit_backdrop_1793472834289.jpg"
          alt="Aquarium Coral Exhibit"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none brightness-90"
          referrerPolicy="no-referrer"
        />

        {/* Water caustics & depth lighting */}
        <div className="absolute inset-0 bg-gradient-to-t from-sky-950/80 via-transparent to-sky-900/30 pointer-events-none" />

        {/* Floating Bubble Particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[15, 30, 48, 65, 80, 92].map((leftPct, i) => (
            <div
              key={i}
              className="absolute -bottom-10 w-3 h-3 rounded-full bg-white/40 border border-white/60 animate-bounce"
              style={{
                left: `${leftPct}%`,
                animationDuration: `${3 + (i % 3) * 1.5}s`,
                animationIterationCount: 'infinite',
              }}
            />
          ))}
        </div>

        {/* Empty state when no fish yet */}
        {aquariumFish.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-slate-900/40 backdrop-blur-xs">
            <Compass className="w-12 h-12 text-sky-300 mb-3 animate-spin" style={{ animationDuration: '10s' }} />
            <h3 className="text-xl font-bold text-white mb-2">まだ魚がいません</h3>
            <p className="text-sm text-sky-100/90 max-w-md mb-5">
              文字カードを組み合わせて魚を釣ると、この水族館に集まります！
            </p>
            <button
              onClick={onStartFishing}
              className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm shadow-lg transition-transform active:scale-95"
            >
              釣りに出かける
            </button>
          </div>
        ) : (
          /* Swimming Fish */
          <div className="relative w-full h-full">
            {aquariumFish.map((item, index) => {
              // Distribute fish at different swimming depths and animation offsets
              const depthPct = 15 + ((index * 21) % 65);
              const animDuration = 14 + (index % 5) * 4;
              const delay = (index * 1.8) % 8;

              return (
                <div
                  key={`${item.term.id}-${index}`}
                  className="absolute cursor-pointer group transition-transform"
                  style={{
                    top: `${depthPct}%`,
                    animation: `swimAcross ${animDuration}s linear infinite`,
                    animationDelay: `-${delay}s`,
                  }}
                  onClick={() => {
                    setSelectedFishTerm(item);
                    speakJapanese(`${item.term.term}。${item.term.definition}`);
                  }}
                >
                  {/* Name tag above fish */}
                  <div className="opacity-80 group-hover:opacity-100 transition-opacity text-center mb-1">
                    <span className="px-2 py-0.5 rounded-full bg-slate-900/80 text-sky-200 text-[10px] font-bold border border-white/20 whitespace-nowrap shadow-sm">
                      {item.term.term}
                    </span>
                  </div>

                  <FishSprite
                    species={item.species}
                    size={item.species.rarity >= 4 ? 'lg' : 'md'}
                    isSwimming={true}
                    isFacingRight={false}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Selected Fish Detail Popover */}
        {selectedFishTerm && (
          <div className="absolute inset-x-4 bottom-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:bottom-6 md:w-[480px] z-30 p-5 rounded-2xl bg-white/95 backdrop-blur-md shadow-2xl border border-sky-200 animate-slideUp">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`px-2 py-0.5 text-[11px] font-bold rounded-md border ${
                      SUBJECT_METADATA[selectedFishTerm.term.subject].badgeClass
                    }`}
                  >
                    {SUBJECT_METADATA[selectedFishTerm.term.subject].label} ·{' '}
                    {selectedFishTerm.term.category}
                  </span>
                  <span className="text-xs text-amber-600 font-semibold">
                    {selectedFishTerm.species.name} (★{selectedFishTerm.species.rarity})
                  </span>
                </div>
                <h4 className="text-xl font-black text-slate-900">
                  {selectedFishTerm.term.term}{' '}
                  <span className="text-sm font-normal text-slate-500">
                    【{selectedFishTerm.term.reading}】
                  </span>
                </h4>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() =>
                    speakJapanese(
                      `${selectedFishTerm.term.term}。${selectedFishTerm.term.definition}`
                    )
                  }
                  className="p-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 transition-colors"
                  title="音声で聞く"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedFishTerm(null)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                >
                  閉じる
                </button>
              </div>
            </div>

            <p className="text-xs md:text-sm text-slate-700 leading-relaxed mb-2">
              {selectedFishTerm.term.definition}
            </p>

            {selectedFishTerm.term.example && (
              <p className="text-xs text-slate-500 mb-2">
                例: {selectedFishTerm.term.example}
              </p>
            )}

            <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-2">
              <span>釣獲回数: {selectedFishTerm.record.count}回</span>
              <span>最終釣獲: {new Date(selectedFishTerm.record.caughtAt).toLocaleDateString()}</span>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes swimAcross {
          0% {
            transform: translateX(-140px);
          }
          48% {
            transform: translateX(calc(1000px)) scaleX(1);
          }
          50% {
            transform: translateX(calc(1000px)) scaleX(-1);
          }
          98% {
            transform: translateX(-140px) scaleX(-1);
          }
          100% {
            transform: translateX(-140px) scaleX(1);
          }
        }
      `}</style>
    </div>
  );
};
