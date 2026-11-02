import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LearningTerm, FishSpecies, Subject, PlayMode } from '../types/game';
import { FISH_SPECIES_LIST, SUBJECT_METADATA } from '../data/termsData';
import { FishSprite } from './FishSprite';
import { sound, speakJapanese } from '../utils/audio';
import { Volume2, Sparkles, RefreshCw, HelpCircle, ArrowRight, RotateCcw, Award } from 'lucide-react';

interface FishingGameProps {
  terms: LearningTerm[];
  selectedSubject: Subject | 'all';
  onSubjectChange: (sub: Subject | 'all') => void;
  onFishCaught: (termId: string, speciesId: string, points: number) => void;
  onNavigateToAquarium: () => void;
  onNavigateToEncyclopedia: () => void;
}

export const FishingGame: React.FC<FishingGameProps> = ({
  terms,
  selectedSubject,
  onSubjectChange,
  onFishCaught,
  onNavigateToAquarium,
  onNavigateToEncyclopedia,
}) => {
  // Current active term to catch
  const [currentTermIndex, setCurrentTermIndex] = useState<number>(0);
  const [playMode, setPlayMode] = useState<PlayMode>('kanji'); // 'kanji' or 'hiragana'
  const [hintLevel, setHintLevel] = useState<number>(0);
  
  // Placed cards in hook slots
  const [placedCards, setPlacedCards] = useState<(string | null)[]>([]);
  // Shuffled candidate cards tray (contains answers + decoys)
  const [trayCards, setTrayCards] = useState<{ id: string; char: string; used: boolean }[]>([]);

  // Fishing state machine: 'waiting' | 'hooked' | 'reeling' | 'caught'
  const [fishingState, setFishingState] = useState<'waiting' | 'hooked' | 'reeling' | 'caught'>('waiting');
  const [reelProgress, setReelProgress] = useState<number>(0);
  const [caughtResult, setCaughtResult] = useState<{
    term: LearningTerm;
    species: FishSpecies;
    earnedPoints: number;
  } | null>(null);

  // Filter terms by selected subject
  const filteredTerms = useMemo(() => {
    if (selectedSubject === 'all') return terms;
    return terms.filter((t) => t.subject === selectedSubject);
  }, [terms, selectedSubject]);

  const activeTerm = filteredTerms[currentTermIndex % Math.max(1, filteredTerms.length)];

  const activeSpecies = useMemo(() => {
    if (!activeTerm) return FISH_SPECIES_LIST[0];
    return FISH_SPECIES_LIST.find((f) => f.id === activeTerm.fishSpeciesId) || FISH_SPECIES_LIST[0];
  }, [activeTerm]);

  // Target character tokens based on mode
  const targetChars = useMemo(() => {
    if (!activeTerm) return [];
    if (playMode === 'kanji') {
      return activeTerm.term.split('');
    } else {
      return activeTerm.reading.split('');
    }
  }, [activeTerm, playMode]);

  // Setup problem & cards
  const setupCardsForTerm = useCallback((term: LearningTerm, mode: PlayMode) => {
    const chars = mode === 'kanji' ? term.term.split('') : term.reading.split('');
    setPlacedCards(new Array(chars.length).fill(null));
    setHintLevel(0);
    setFishingState('waiting');
    setReelProgress(0);
    setCaughtResult(null);

    // Generate decoys
    const decoyKanjiPool = ['法', '地', '度', '線', '率', '積', '原', '化', '体', '生', '物', '政', '権', '形', '力', '点'];
    const decoyKanaPool = ['か', 'い', 'ん', 'う', 'き', 'ょ', 'う', 'せ', 'い', 'つ', 'り', 'し', 'へ', 'す', 'ち', 'お'];

    const pool = mode === 'kanji' ? decoyKanjiPool : decoyKanaPool;
    const neededDecoys = Math.min(3, Math.max(2, 6 - chars.length));
    const decoys: string[] = [];

    for (let i = 0; i < neededDecoys; i++) {
      const candidate = pool[Math.floor(Math.random() * pool.length)];
      if (!chars.includes(candidate) && !decoys.includes(candidate)) {
        decoys.push(candidate);
      }
    }

    const allCards = [...chars, ...decoys].map((char, index) => ({
      id: `${char}-${index}-${Date.now()}-${Math.random()}`,
      char,
      used: false,
    }));

    // Shuffle tray cards
    for (let i = allCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allCards[i], allCards[j]] = [allCards[j], allCards[i]];
    }

    setTrayCards(allCards);
  }, []);

  // Initialize or re-setup when activeTerm or playMode changes
  useEffect(() => {
    if (activeTerm) {
      setupCardsForTerm(activeTerm, playMode);
    }
  }, [activeTerm, playMode, setupCardsForTerm]);

  // Handle card click from tray into slots
  const handleSelectTrayCard = (cardId: string, char: string) => {
    if (fishingState !== 'waiting') return;

    // Find first empty slot
    const emptyIndex = placedCards.findIndex((c) => c === null);
    if (emptyIndex === -1) return;

    sound.playCardClick();

    // Mark card as used in tray
    setTrayCards((prev) =>
      prev.map((card) => (card.id === cardId ? { ...card, used: true } : card))
    );

    // Place in slot
    const newPlaced = [...placedCards];
    newPlaced[emptyIndex] = char;
    setPlacedCards(newPlaced);

    // Check if fully filled
    if (newPlaced.every((c) => c !== null)) {
      validateAnswer(newPlaced as string[]);
    }
  };

  // Handle removing a placed card back to tray
  const handleRemovePlacedCard = (slotIndex: number) => {
    if (fishingState !== 'waiting') return;
    const char = placedCards[slotIndex];
    if (!char) return;

    sound.playCardReturn();

    // Find the used card in tray and unmark it
    setTrayCards((prev) => {
      let unmarked = false;
      return prev.map((card) => {
        if (!unmarked && card.char === char && card.used) {
          unmarked = true;
          return { ...card, used: false };
        }
        return card;
      });
    });

    const newPlaced = [...placedCards];
    newPlaced[slotIndex] = null;
    setPlacedCards(newPlaced);
  };

  // Clear all slots
  const handleResetSlots = () => {
    sound.playCardReturn();
    setPlacedCards(new Array(targetChars.length).fill(null));
    setTrayCards((prev) => prev.map((c) => ({ ...c, used: false })));
  };

  // Validate answer
  const validateAnswer = (attempt: string[]) => {
    const isCorrect = attempt.join('') === targetChars.join('');
    if (isCorrect) {
      // HIT! Fish bites
      sound.playHit();
      setFishingState('hooked');
      setTimeout(() => {
        setFishingState('reeling');
      }, 700);
    } else {
      // Incorrect buzz
      sound.playError();
      setTimeout(() => {
        handleResetSlots();
      }, 500);
    }
  };

  // Reel-in action
  const handleReelClick = () => {
    if (fishingState !== 'reeling') return;
    sound.playReel();
    setReelProgress((prev) => {
      const next = prev + 25;
      if (next >= 100) {
        completeCatch();
        return 100;
      }
      return next;
    });
  };

  const completeCatch = () => {
    sound.playSplash();
    setTimeout(() => {
      sound.playCatchFanfare();
      setFishingState('caught');
      const earned = activeSpecies.points + (hintLevel === 0 ? 50 : 0);
      setCaughtResult({
        term: activeTerm,
        species: activeSpecies,
        earnedPoints: earned,
      });
      onFishCaught(activeTerm.id, activeSpecies.id, earned);
    }, 250);
  };

  // Next fish
  const handleNextFish = () => {
    setCurrentTermIndex((prev) => prev + 1);
  };

  // Hint button
  const handleUseHint = () => {
    if (hintLevel < 2) {
      sound.playCardClick();
      setHintLevel((prev) => prev + 1);
    }
  };

  if (!activeTerm) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500">
        対象の用語がありません。
      </div>
    );
  }

  const subjectMeta = SUBJECT_METADATA[activeTerm.subject];

  return (
    <div className="relative w-full max-w-5xl mx-auto flex flex-col gap-6 select-none">
      {/* Subject Filter Bar & Play Mode Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-sm">
        {/* Subject Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => onSubjectChange('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              selectedSubject === 'all'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            全教科
          </button>
          {(['social', 'math', 'science'] as Subject[]).map((sub) => {
            const meta = SUBJECT_METADATA[sub];
            const isActive = selectedSubject === sub;
            return (
              <button
                key={sub}
                onClick={() => onSubjectChange(sub)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {meta.label}
              </button>
            );
          })}
        </div>

        {/* Kanji / Hiragana Mode Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">カード形式:</span>
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setPlayMode('kanji')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                playMode === 'kanji'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              漢字・語句
            </button>
            <button
              onClick={() => setPlayMode('hiragana')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                playMode === 'hiragana'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ひらがな読み
            </button>
          </div>
        </div>
      </div>

      {/* Main Fishing Stage Viewport */}
      <div className="relative w-full h-[400px] md:h-[440px] rounded-3xl overflow-hidden border border-sky-300/40 shadow-xl bg-slate-900">
        {/* Background Pier & Ocean Artwork */}
        <img
          src="/src/assets/images/fishing_ocean_backdrop_1793472834154.jpg"
          alt="Ocean fishing dock"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none brightness-95"
          referrerPolicy="no-referrer"
        />

        {/* Translucent water gradient overlay to ensure UI legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-950/20 via-sky-900/40 to-sky-950/70 pointer-events-none" />

        {/* Floating animated water ripples & caustics */}
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-sky-900/60 to-transparent pointer-events-none" />

        {/* Top Info Bar (Clue & Target Term Clue Box) */}
        <div className="absolute top-4 inset-x-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 p-4 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-white/80">
          <div className="flex-1 pr-2">
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 text-xs font-bold rounded-md border ${subjectMeta.badgeClass}`}>
                {subjectMeta.label} · {activeTerm.category}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {activeTerm.grade}
              </span>
              <span className="text-xs text-amber-600 font-medium">
                {activeSpecies.name} (★{activeSpecies.rarity})
              </span>
            </div>

            <p className="text-sm md:text-base font-semibold text-slate-800 leading-snug">
              「{activeTerm.definition}」
            </p>
          </div>

          {/* Audio speech and Hint buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => speakJapanese(`${activeTerm.definition}。ヒントは${activeTerm.category}です。`)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              title="解説を音声で聞く"
            >
              <Volume2 className="w-4 h-4 text-sky-600" />
              <span>よみあげ</span>
            </button>

            <button
              onClick={handleUseHint}
              disabled={hintLevel >= 2}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors ${
                hintLevel >= 2
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
              }`}
            >
              <HelpCircle className="w-4 h-4 text-amber-600" />
              <span>ヒント {hintLevel > 0 ? `(${hintLevel}/2)` : ''}</span>
            </button>
          </div>
        </div>

        {/* Revealed Hint Banner */}
        {hintLevel > 0 && (
          <div className="absolute top-28 left-4 right-4 md:left-6 md:right-auto md:max-w-md p-2.5 bg-amber-50/95 border border-amber-200/90 rounded-xl text-xs text-amber-900 shadow-md flex items-center gap-2 animate-fadeIn">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">ヒント: </span>
              {hintLevel === 1 && activeTerm.hints[0]}
              {hintLevel === 2 && `${activeTerm.hints[0]} / 最初の文字は「${targetChars[0]}」`}
            </div>
          </div>
        )}

        {/* Fishing Line & Hook hanging from top dock */}
        <div className="absolute top-0 right-1/4 md:right-1/3 w-0.5 h-[160px] md:h-[180px] bg-slate-200/80 shadow-xs z-10">
          {/* Bobber / Float */}
          <div className="absolute top-24 -left-2.5 w-6 h-6 rounded-full bg-gradient-to-b from-red-500 to-white border-2 border-red-700 shadow-md animate-bounce" />

          {/* Fishing Hook & Bait Card Slots at bottom of line */}
          <div className="absolute bottom-0 -left-24 md:-left-28 w-52 md:w-60 flex flex-col items-center">
            {/* Hook icon */}
            <div className="w-5 h-7 border-b-4 border-r-4 border-slate-300 rounded-br-2xl mb-1 shadow-sm" />

            {/* Bait/Hook Character Slots */}
            <div className="flex items-center justify-center gap-1.5 p-2 bg-slate-900/80 backdrop-blur-md rounded-2xl border-2 border-amber-400/90 shadow-2xl">
              {placedCards.map((char, index) => (
                <button
                  key={index}
                  onClick={() => handleRemovePlacedCard(index)}
                  disabled={fishingState !== 'waiting' || char === null}
                  className={`w-10 h-12 md:w-12 md:h-14 rounded-xl flex items-center justify-center font-bold text-lg md:text-xl transition-all ${
                    char
                      ? 'bg-gradient-to-b from-amber-200 to-amber-400 text-slate-950 border-2 border-amber-500 shadow-md active:scale-95 hover:brightness-105'
                      : 'bg-white/20 border-2 border-dashed border-white/50 text-white/40'
                  }`}
                  title={char ? 'クリックで戻す' : '文字カードをセット'}
                >
                  {char || '？'}
                </button>
              ))}
            </div>
            <div className="text-[11px] font-bold text-amber-200 mt-1 drop-shadow-md">
              ▲ エサ（文字カードをセット）
            </div>
          </div>
        </div>

        {/* Swimming Target Fish */}
        <div
          className={`absolute bottom-6 transition-all duration-700 z-10 ${
            fishingState === 'waiting'
              ? 'left-10 md:left-24 animate-[float_4s_ease-in-out_infinite]'
              : fishingState === 'hooked'
              ? 'left-1/3 -translate-y-8 scale-110'
              : 'left-1/3 -translate-y-24 scale-125'
          }`}
        >
          <div className="relative group cursor-pointer" onClick={() => speakJapanese(activeSpecies.name)}>
            {/* Bubble above fish */}
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-0.5 rounded-full bg-slate-900/85 text-white text-[11px] font-semibold border border-white/30 backdrop-blur-xs shadow-md">
              {activeSpecies.name} · {activeSpecies.points}pt
            </div>

            <FishSprite
              species={activeSpecies}
              size="lg"
              isSwimming={true}
              isFacingRight={fishingState === 'waiting'}
            />
          </div>
        </div>

        {/* "HIT!" Alert Overlay */}
        {fishingState === 'hooked' && (
          <div className="absolute inset-0 flex items-center justify-center bg-sky-900/40 backdrop-blur-xs z-30 animate-fadeIn">
            <div className="px-6 py-4 bg-gradient-to-r from-red-600 via-amber-500 to-red-600 text-white rounded-3xl shadow-2xl border-4 border-white transform animate-bounce">
              <span className="text-3xl md:text-4xl font-black tracking-wider drop-shadow-lg">
                HIT!! 魚がかかった！
              </span>
            </div>
          </div>
        )}

        {/* Reeling In Mini-game Overlay */}
        {fishingState === 'reeling' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/70 backdrop-blur-md z-30 p-6 animate-fadeIn">
            <div className="text-center max-w-sm w-full bg-white rounded-3xl p-6 shadow-2xl border border-sky-200">
              <div className="text-xs font-bold text-sky-600 mb-1">大物を引き上げろ！</div>
              <h3 className="text-xl font-black text-slate-900 mb-4">
                リールを連続タップ！
              </h3>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 rounded-full h-4 mb-5 overflow-hidden p-0.5 border border-slate-300">
                <div
                  className="bg-gradient-to-r from-amber-400 to-emerald-500 h-full rounded-full transition-all duration-150"
                  style={{ width: `${reelProgress}%` }}
                />
              </div>

              {/* Big Reel Button */}
              <button
                onClick={handleReelClick}
                className="w-24 h-24 mx-auto rounded-full bg-gradient-to-b from-sky-500 to-blue-700 hover:from-sky-400 hover:to-blue-600 text-white font-black text-lg shadow-xl active:scale-90 transition-transform flex flex-col items-center justify-center border-4 border-white cursor-pointer"
              >
                <RotateCcw className="w-8 h-8 animate-spin" style={{ animationDuration: '3s' }} />
                <span className="text-xs mt-1">まく！</span>
              </button>

              <p className="text-xs text-slate-500 mt-4">
                スペースキーまたはボタンを連打しよう！
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Letter Card Tray (文字カードトレイ) */}
      <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-800">
              文字カードを選んでエサにしよう
            </span>
            <span className="text-xs text-slate-500">
              （タップで釣り針にセット）
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetSlots}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>やり直す</span>
            </button>
          </div>
        </div>

        {/* Card Buttons Grid */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 md:gap-3 py-2 min-h-[72px]">
          {trayCards.map((card) => (
            <button
              key={card.id}
              onClick={() => handleSelectTrayCard(card.id, card.char)}
              disabled={card.used || fishingState !== 'waiting'}
              className={`w-12 h-14 md:w-14 md:h-16 rounded-2xl font-black text-xl md:text-2xl transition-all shadow-md ${
                card.used
                  ? 'bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed scale-95 opacity-40'
                  : 'bg-gradient-to-b from-white to-slate-50 hover:to-sky-50 text-slate-900 border-2 border-slate-300 hover:border-sky-500 active:scale-95 hover:shadow-lg cursor-pointer'
              }`}
            >
              {card.char}
            </button>
          ))}
        </div>
      </div>

      {/* Catch Victory Modal */}
      {fishingState === 'caught' && caughtResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 md:p-8 shadow-2xl border border-sky-100 text-center animate-scaleUp">
            {/* Header / Confetti styling */}
            <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold mb-4">
              <Award className="w-4 h-4 text-amber-600" />
              <span>釣獲成功！+{caughtResult.earnedPoints} pt</span>
            </div>

            {/* Fish Sprite Leaping */}
            <div className="flex justify-center my-2">
              <FishSprite species={caughtResult.species} size="xl" isSwimming={true} />
            </div>

            <h3 className="text-xl font-bold text-slate-700">
              {caughtResult.species.name} を釣り上げた！
            </h3>

            {/* Target Term Card Box */}
            <div className="my-5 p-4 rounded-2xl bg-sky-50 border border-sky-200 text-left">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-2xl md:text-3xl font-black text-sky-950">
                    {caughtResult.term.term}
                  </span>
                  <span className="text-sm text-sky-700 font-semibold">
                    【{caughtResult.term.reading}】
                  </span>
                </div>
                <button
                  onClick={() =>
                    speakJapanese(
                      `${caughtResult.term.term}。${caughtResult.term.definition}`
                    )
                  }
                  className="p-2 rounded-xl bg-white hover:bg-sky-100 text-sky-700 shadow-xs transition-colors"
                  title="発音を聞く"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>

              <div className="text-xs font-bold text-sky-800 mb-2">
                {subjectMeta.label} · {caughtResult.term.category} · {caughtResult.term.grade}
              </div>

              <p className="text-sm text-slate-700 leading-relaxed">
                {caughtResult.term.definition}
              </p>
              {caughtResult.term.example && (
                <p className="text-xs text-slate-500 mt-2 border-t border-sky-200/80 pt-2">
                  例: {caughtResult.term.example}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={handleNextFish}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <span>次の魚を釣る</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onNavigateToAquarium}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm transition-all"
              >
                マイ水族館で見る
              </button>

              <button
                onClick={onNavigateToEncyclopedia}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm transition-all"
              >
                図鑑を確認
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
