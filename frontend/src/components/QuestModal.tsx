import React, { useState, useEffect } from 'react';
import { X, Sparkles, Dumbbell, Brain, Heart, Zap, Scroll, RefreshCw, Calendar, Flame } from 'lucide-react';
import { Quest, AttributeType, DifficultyType, QuestType } from '../types';

interface QuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (questData: {
    title: string;
    description: string;
    category: 'mind' | 'body' | 'craft' | 'discipline';
    attribute: AttributeType;
    difficulty: DifficultyType;
    quest_type: QuestType;
    recurrence: 'none' | 'daily' | 'weekly';
    due_date?: string | null;
  }) => Promise<void>;
  editingQuest: Quest | null;
}

export const QuestModal: React.FC<QuestModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingQuest
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'mind' | 'body' | 'craft' | 'discipline'>('mind');
  const [attribute, setAttribute] = useState<AttributeType>('INT');
  const [difficulty, setDifficulty] = useState<DifficultyType>('Medium');
  const [recurrence, setRecurrence] = useState<'none' | 'daily' | 'weekly'>('daily');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const skillTrees = [
    { id: 'mind', name: 'Mind', icon: '🧠', attr: 'INT' as AttributeType, desc: 'Studies, reading, focus, coding algorithms' },
    { id: 'body', name: 'Body', icon: '🏃', attr: 'VIT' as AttributeType, desc: 'Workouts, fitness, hydration, wellness' },
    { id: 'craft', name: 'Craft', icon: '⚒️', attr: 'STR' as AttributeType, desc: 'Project shipping, art, writing, building' },
    { id: 'discipline', name: 'Discipline', icon: '⚖️', attr: 'CHA' as AttributeType, desc: 'Habits, routines, meditation, cleanliness' }
  ];

  const difficultyTiers: Record<DifficultyType, { xp: number; gold: number; label: string }> = {
    Trivial: { xp: 15, gold: 5, label: 'Trivial (+15 XP, +5 Gold)' },
    Easy: { xp: 30, gold: 10, label: 'Easy (+30 XP, +10 Gold)' },
    Medium: { xp: 60, gold: 20, label: 'Medium (+60 XP, +20 Gold)' },
    Hard: { xp: 120, gold: 45, label: 'Hard (+120 XP, +45 Gold)' },
    Legendary: { xp: 250, gold: 100, label: 'Legendary (+250 XP, +100 Gold)' }
  };

  useEffect(() => {
    if (editingQuest) {
      setTitle(editingQuest.title);
      setDescription(editingQuest.description || '');
      const cat = (editingQuest.category || 'mind') as 'mind' | 'body' | 'craft' | 'discipline';
      setCategory(cat);
      setAttribute(editingQuest.attribute || 'INT');
      setDifficulty(editingQuest.difficulty);
      const rec = (editingQuest.recurrence || 'daily') as 'none' | 'daily' | 'weekly';
      setRecurrence(rec);
      setDueDate(editingQuest.due_date || '');
    } else {
      setTitle('');
      setDescription('');
      setCategory('mind');
      setAttribute('INT');
      setDifficulty('Medium');
      setRecurrence('daily');
      setDueDate('');
    }
    setError('');
  }, [editingQuest, isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelectCategory = (cat: 'mind' | 'body' | 'craft' | 'discipline') => {
    setCategory(cat);
    const tree = skillTrees.find(t => t.id === cat);
    if (tree) {
      setAttribute(tree.attr);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide an honorable title for your quest.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        category,
        attribute,
        difficulty,
        quest_type: recurrence === 'none' ? 'Milestone' : 'Daily',
        recurrence,
        due_date: dueDate || null
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'The Guild was unable to register your deed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content max-h-[90vh] overflow-y-auto" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Scroll className="text-amber-400" size={20} />
            <h2 className="font-rpg text-lg font-bold text-white">
              {editingQuest ? 'Revise Guild Deed' : 'Summon New Quest'}
            </h2>
          </div>
          <button onClick={onClose} className="icon-btn w-8 h-8" aria-label="Close modal">
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="form-group">
            <label className="form-label" htmlFor="quest-title">
              Quest Title <span className="text-amber-400">*</span>
            </label>
            <input
              id="quest-title"
              type="text"
              required
              placeholder="e.g. 45m Focused Research or Coding Grind"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label" htmlFor="quest-desc">
              Parchment of Objectives (Optional)
            </label>
            <textarea
              id="quest-desc"
              rows={2}
              placeholder="Key notes, learning checklist, or constraints..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-input resize-none"
            />
          </div>

          {/* Skill Tree Selection */}
          <div className="form-group">
            <label className="form-label">Skill Tree Domain</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {skillTrees.map((tree) => (
                <button
                  type="button"
                  key={tree.id}
                  onClick={() => handleSelectCategory(tree.id as any)}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    category === tree.id
                      ? 'border-amber-400 bg-amber-500/15 shadow-sm'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="text-base mb-1">{tree.icon}</div>
                  <div className="text-xs font-bold text-white">{tree.name}</div>
                  <div className="text-[10px] text-slate-400 leading-tight mt-0.5">{tree.desc.split(',')[0]}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Tier */}
          <div className="form-group">
            <label className="form-label">Difficulty Tier</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {(['Trivial', 'Easy', 'Medium', 'Hard', 'Legendary'] as DifficultyType[]).map((diff) => (
                <button
                  type="button"
                  key={diff}
                  onClick={() => setDifficulty(diff)}
                  className={`p-2 rounded-lg border text-center transition ${
                    difficulty === diff
                      ? 'border-amber-400 bg-amber-500/20 text-amber-300 font-bold'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="text-xs">{diff}</div>
                  <div className="text-[10px] text-slate-400">+{difficultyTiers[diff].xp} XP</div>
                </button>
              ))}
            </div>
          </div>

          {/* Recurrence Period */}
          <div className="form-group">
            <label className="form-label">Recurrence Cadence</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'daily', label: '🔄 Daily', desc: 'Resets each day' },
                { id: 'weekly', label: '📅 Weekly', desc: 'Once per week' },
                { id: 'none', label: '🎯 One-Time', desc: 'Milestone deed' }
              ].map((rec) => (
                <button
                  type="button"
                  key={rec.id}
                  onClick={() => setRecurrence(rec.id as any)}
                  className={`p-2 rounded-lg border text-center transition ${
                    recurrence === rec.id
                      ? 'border-amber-400 bg-amber-500/20 text-amber-300 font-bold'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="text-xs">{rec.label}</div>
                  <div className="text-[10px] text-slate-500">{rec.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Reward Summary Pill */}
          <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/30 flex items-center justify-between text-xs">
            <span className="text-slate-400">Yield upon completion:</span>
            <div className="flex items-center gap-3">
              <span className="text-amber-400 font-bold font-mono">+{difficultyTiers[difficulty].xp} XP</span>
              <span className="text-yellow-400 font-bold font-mono">+{difficultyTiers[difficulty].gold} Gold</span>
              <span className="text-purple-300 font-bold text-[11px] font-mono">+{attribute} Boost</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rpg-btn rpg-btn-secondary text-xs"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rpg-btn rpg-btn-gold text-xs min-w-[120px]"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span>Registering...</span>
              ) : (
                <span>{editingQuest ? 'Save Deed' : 'Inscribe Quest'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
