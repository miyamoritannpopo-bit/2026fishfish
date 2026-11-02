/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { LearningTerm, CaughtRecord, Subject } from './types/game';
import { INITIAL_TERMS } from './data/termsData';
import { FishingGame } from './components/FishingGame';
import { AquariumView } from './components/AquariumView';
import { EncyclopediaView } from './components/EncyclopediaView';
import { CustomTermModal } from './components/CustomTermModal';
import { sound } from './utils/audio';
import { Volume2, VolumeX, Plus, HelpCircle, Trophy, Waves, BookOpen, Fish } from 'lucide-react';

type NavView = 'game' | 'aquarium' | 'encyclopedia' | 'guide';

export default function App() {
  const [currentView, setCurrentView] = useState<NavView>('game');
  const [selectedSubject, setSelectedSubject] = useState<Subject | 'all'>('all');
  const [isMuted, setIsMuted] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Stored state: caught records, custom terms, total points
  const [caughtRecords, setCaughtRecords] = useState<CaughtRecord[]>(() => {
    try {
      const saved = localStorage.getItem('word_fishing_caught');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [customTerms, setCustomTerms] = useState<LearningTerm[]>(() => {
    try {
      const saved = localStorage.getItem('word_fishing_custom_terms');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [totalPoints, setTotalPoints] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('word_fishing_points');
      return saved ? Number(saved) : 0;
    } catch {
      return 0;
    }
  });

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('word_fishing_caught', JSON.stringify(caughtRecords));
    } catch {}
  }, [caughtRecords]);

  useEffect(() => {
    try {
      localStorage.setItem('word_fishing_custom_terms', JSON.stringify(customTerms));
    } catch {}
  }, [customTerms]);

  useEffect(() => {
    try {
      localStorage.setItem('word_fishing_points', totalPoints.toString());
    } catch {}
  }, [totalPoints]);

  const allTerms = [...INITIAL_TERMS, ...customTerms];

  // Handle fish caught
  const handleFishCaught = (termId: string, speciesId: string, points: number) => {
    setTotalPoints((prev) => prev + points);
    setCaughtRecords((prev) => {
      const existingIndex = prev.findIndex((r) => r.termId === termId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          count: updated[existingIndex].count + 1,
          caughtAt: new Date().toISOString(),
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            termId,
            fishSpeciesId: speciesId,
            caughtAt: new Date().toISOString(),
            count: 1,
          },
        ];
      }
    });
  };

  const handleAddTerm = (newTerm: LearningTerm) => {
    setCustomTerms((prev) => [newTerm, ...prev]);
    setCurrentView('game');
  };

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    sound.setMuted(next);
  };

  // Angler Title based on score
  const getAnglerRank = (pts: number) => {
    if (pts >= 8000) return '伝説の釣りマスター';
    if (pts >= 4000) return '大海原の釣り名人';
    if (pts >= 1500) return '一人前の釣り師';
    if (pts >= 500) return '新米アングラー';
    return '見習い釣り師';
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans selection:bg-sky-200">
      {/* Top Bar Contract (§2): Single-row, 3-zone */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-8 px-4 md:px-8 py-3">
          {/* Zone 1: Single text element wordmark */}
          <div
            onClick={() => setCurrentView('game')}
            className="text-lg md:text-xl font-black tracking-tight text-sky-900 whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-xs">
              <Fish className="w-5 h-5" />
            </div>
            <span>ことば釣りマスター</span>
          </div>

          {/* Zone 2: 4 concise single-line nav links */}
          <nav className="flex items-center gap-2 md:gap-6 text-xs md:text-sm font-semibold text-slate-600">
            <button
              onClick={() => setCurrentView('game')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 px-2 py-1 rounded-lg ${
                currentView === 'game' ? 'text-sky-700 bg-sky-50 font-bold' : ''
              }`}
            >
              釣りに出る
            </button>
            <button
              onClick={() => setCurrentView('aquarium')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 px-2 py-1 rounded-lg ${
                currentView === 'aquarium' ? 'text-sky-700 bg-sky-50 font-bold' : ''
              }`}
            >
              マイ水族館
            </button>
            <button
              onClick={() => setCurrentView('encyclopedia')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 px-2 py-1 rounded-lg ${
                currentView === 'encyclopedia' ? 'text-sky-700 bg-sky-50 font-bold' : ''
              }`}
            >
              用語図鑑
            </button>
            <button
              onClick={() => setCurrentView('guide')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 px-2 py-1 rounded-lg ${
                currentView === 'guide' ? 'text-sky-700 bg-sky-50 font-bold' : ''
              }`}
            >
              あそびかた
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleToggleMute}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title={isMuted ? 'サウンドをオン' : 'サウンドをミュート'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3 md:px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-xl transition-all shadow-xs flex items-center gap-1.5 whitespace-nowrap shrink-0 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>用語を追加</span>
            </button>
          </div>
        </div>
      </header>

      {/* Sub-header Score / Status Strip */}
      <div className="bg-white/80 border-b border-slate-200/60 px-4 md:px-8 py-2">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>
                称号: <strong className="text-slate-900">{getAnglerRank(totalPoints)}</strong>
              </span>
            </div>
            <span aria-hidden="true" className="text-slate-300">|</span>
            <div>
              釣りスコア: <strong className="text-sky-700 font-mono tabular-nums">{totalPoints.toLocaleString()}</strong> pt
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span>
              釣獲数: <strong className="text-slate-900 font-mono tabular-nums">{caughtRecords.length}</strong> / {allTerms.length}種
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 flex flex-col justify-center">
        {currentView === 'game' && (
          <FishingGame
            terms={allTerms}
            selectedSubject={selectedSubject}
            onSubjectChange={setSelectedSubject}
            onFishCaught={handleFishCaught}
            onNavigateToAquarium={() => setCurrentView('aquarium')}
            onNavigateToEncyclopedia={() => setCurrentView('encyclopedia')}
          />
        )}

        {currentView === 'aquarium' && (
          <AquariumView
            caughtRecords={caughtRecords}
            allTerms={allTerms}
            onStartFishing={() => setCurrentView('game')}
          />
        )}

        {currentView === 'encyclopedia' && (
          <EncyclopediaView
            terms={allTerms}
            caughtRecords={caughtRecords}
            onSelectTermToFish={() => {
              setCurrentView('game');
            }}
          />
        )}

        {currentView === 'guide' && (
          <div className="w-full max-w-3xl mx-auto bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm animate-fadeIn">
            <h2 className="text-2xl font-black text-slate-900 mb-4 flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-sky-600" />
              <span>ことば釣りマスターのあそびかた</span>
            </h2>

            <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
              <div className="p-4 rounded-2xl bg-sky-50 border border-sky-100">
                <h3 className="font-bold text-sky-900 mb-1 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-sky-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                  魚のヒント（問題・定義）を読む
                </h3>
                <p className="text-xs text-sky-800 ml-8">
                  画面上部に、社会科・算数・理科の学習用語に関する説明が表示されます。
                  「よみあげ」ボタンを押せば、解説を音声で確認することもできます。
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                <h3 className="font-bold text-amber-900 mb-1 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                  文字カードを釣り針にセットする
                </h3>
                <p className="text-xs text-amber-800 ml-8">
                  トレイにある文字カードをタップすると、釣り針のエサスロットにセットされます。
                  間違えた場合はスロットの文字をタップすると手元に戻ります。「漢字・語句モード」と「ひらがな読みモード」を切り替えて練習可能です。
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                <h3 className="font-bold text-emerald-900 mb-1 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">3</span>
                  HITしたらリールを巻いて釣り上げる！
                </h3>
                <p className="text-xs text-emerald-800 ml-8">
                  正しい用語ができると魚が食いつきます！リールを連打して大物を釣り上げよう。
                  釣り上げた魚は「マイ水族館」で泳ぎ回り、「用語図鑑」に記録されます。
                </p>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 flex justify-center">
              <button
                onClick={() => setCurrentView('game')}
                className="px-8 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-md transition-all active:scale-95"
              >
                さっそく釣りに出かける！
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white/70 py-4 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ことば釣りマスター · 社会・算数・理科 学習用語練習アプリ</span>
          <span>対象: 小学校3〜6年生・中学校1〜3年生</span>
        </div>
      </footer>

      {/* Custom Term Modal */}
      <CustomTermModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddTerm={handleAddTerm}
      />
    </div>
  );
}
