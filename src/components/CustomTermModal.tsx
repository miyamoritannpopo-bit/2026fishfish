import React, { useState } from 'react';
import { LearningTerm, Subject, SubCategory } from '../types/game';
import { FISH_SPECIES_LIST, SUBJECT_METADATA } from '../data/termsData';
import { Plus, X } from 'lucide-react';

interface CustomTermModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTerm: (term: LearningTerm) => void;
}

export const CustomTermModal: React.FC<CustomTermModalProps> = ({
  isOpen,
  onClose,
  onAddTerm,
}) => {
  const [term, setTerm] = useState('');
  const [reading, setReading] = useState('');
  const [subject, setSubject] = useState<Subject>('social');
  const [category, setCategory] = useState<SubCategory>('歴史');
  const [grade, setGrade] = useState('小5');
  const [definition, setDefinition] = useState('');
  const [example, setExample] = useState('');
  const [hint1, setHint1] = useState('');
  const [hint2, setHint2] = useState('');
  const [fishSpeciesId, setFishSpeciesId] = useState(FISH_SPECIES_LIST[0].id);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!term.trim() || !reading.trim() || !definition.trim()) return;

    const newTerm: LearningTerm = {
      id: `custom-${Date.now()}`,
      term: term.trim(),
      reading: reading.trim(),
      subject,
      category,
      grade,
      definition: definition.trim(),
      example: example.trim() || undefined,
      hints: [hint1.trim() || 'よく思い出してみよう', hint2.trim() || '教科書をチェック！'],
      fishSpeciesId,
      isCustom: true,
    };

    onAddTerm(newTerm);
    onClose();
  };

  const categoriesBySubject: Record<Subject, SubCategory[]> = {
    social: ['歴史', '地理', '公民'],
    math: ['図形', '数・計算', '割合・比'],
    science: ['生物', '地学', '化学', '物理'],
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 animate-scaleUp max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-sky-600" />
            <h3 className="text-lg font-bold text-slate-900">オリジナルの学習用語を追加</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Subject & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">教科</label>
              <select
                value={subject}
                onChange={(e) => {
                  const newSub = e.target.value as Subject;
                  setSubject(newSub);
                  setCategory(categoriesBySubject[newSub][0]);
                }}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-sky-500/20"
              >
                {(['social', 'math', 'science'] as Subject[]).map((s) => (
                  <option key={s} value={s}>
                    {SUBJECT_METADATA[s].label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">分野</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as SubCategory)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-sky-500/20"
              >
                {categoriesBySubject[subject].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Term Name & Reading */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                用語（カードになる文字） <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="例: 三角州, 光合成"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                よみがな（ひらがな） <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={reading}
                onChange={(e) => setReading(e.target.value)}
                placeholder="例: さんかくす, こうごうせい"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
          </div>

          {/* Definition */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              問題・意味の解説 <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              placeholder="魚を釣るときのヒントになる問題文を入力してください"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-sky-500/20"
            />
          </div>

          {/* Target Fish */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">つりたい魚</label>
            <select
              value={fishSpeciesId}
              onChange={(e) => setFishSpeciesId(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-sky-500/20"
            >
              {FISH_SPECIES_LIST.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} (★{f.rarity} · {f.points}pt)
                </option>
              ))}
            </select>
          </div>

          {/* Submit buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 font-semibold"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-white bg-sky-600 hover:bg-sky-500 font-bold shadow-sm"
            >
              追加して保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
