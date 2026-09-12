import React, { useState, useEffect } from 'react';
import { X, Sparkles, Dumbbell, Brain, Heart, Zap, Scroll } from 'lucide-react';
import { Quest, AttributeType, DifficultyType, QuestType } from '../types';

interface QuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (questData: {
    title: string;
    description: string;
    attribute: AttributeType;
    difficulty: DifficultyType;
    quest_type: QuestType;
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
  const [attribute, setAttribute] = useState<AttributeType>('INT');
  const [difficulty, setDifficulty] = useState<DifficultyType>('Medium');
  const [questType, setQuestType] = useState<QuestType>('Daily');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingQuest) {
      setTitle(editingQuest.title);
      setDescription(editingQuest.description || '');
      setAttribute(editingQuest.attribute);
      setDifficulty(editingQuest.difficulty);
      setQuestType(editingQuest.quest_type);
      setDueDate(editingQuest.due_date || '');
    } else {
      setTitle('');
      setDescription('');
      setAttribute('INT');
      setDifficulty('Medium');
      setQuestType('Daily');
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
        attribute,
        difficulty,
        quest_type: questType,
        due_date: dueDate || null
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save quest');
    } finally {
      setIsSubmitting(false);
    }
  };

  const attributeDescriptions: Record<AttributeType, { name: string; desc: string }> = {
    STR: { name: 'Strength', desc: 'Fitness, gym, body conditioning' },
    INT: { name: 'Intellect', desc: 'Coding, studying, reading, deep work' },
    VIT: { name: 'Vitality', desc: 'Sleep, nutrition, hydration, wellness' },
    AGI: { name: 'Agility', desc: 'Errands, swift chores, inbox zero' },
    CHA: { name: 'Charisma', desc: 'Networking, communication, leadership' }
  };

  const difficultyRewards: Record<DifficultyType, { xp: number; gold: number }> = {
    Trivial: { xp: 15, gold: 8 },
    Easy: { xp: 30, gold: 18 },
    Medium: { xp: 65, gold: 38 },
    Hard: { xp: 130, gold: 80 },
    Legendary: { xp: 320, gold: 200 }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content max-h-[88vh] overflow-y-auto" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Scroll className="text-amber-400" size={20} />
            <h2 className="font-rpg text-lg font-bold text-white">
              {editingQuest ? 'Revise Ancient Deed' : 'Summon New Quest'}
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
              placeholder="e.g. Conquer 45-Min LeetCode Grind"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label" htmlFor="quest-desc">
              Scroll of Details (Optional)
            </label>
            <textarea
              id="quest-desc"
              rows={2}
              placeholder="Brief tactical notes or objectives..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-input resize-none"
            />
          </div>

          {/* Attribute Selection */}
          <div className="form-group">
            <label className="form-label">Trained Hero Attribute</label>
            <div className="grid grid-cols-5 gap-1.5">
              {(['STR', 'INT', 'VIT', 'AGI', 'CHA'] as AttributeType[]).map((attr) => (
                <button
                  type="button"
                  key={attr}
                  onClick={() => setAttribute(attr)}
                  className={`p-2 rounded border text-center transition ${
                    attribute === attr
                      ? 'bg-amber-400 text-slate-950 border-amber-400 font-bold shadow-md'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-bold">{attr}</div>
                  <div className="text-[10px] opacity-75 capitalize">{attributeDescriptions[attr].name.slice(0, 4)}</div>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 italic">
              {attributeDescriptions[attribute].desc}
            </p>
          </div>

          {/* Difficulty Selection */}
          <div className="form-group">
            <div className="flex items-center justify-between mb-1">
              <label className="form-label mb-0">Difficulty & Yield</label>
              <span className="text-[11px] font-mono text-amber-300">
                +{difficultyRewards[difficulty].xp} XP / +{difficultyRewards[difficulty].gold} Gold
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {(['Trivial', 'Easy', 'Medium', 'Hard', 'Legendary'] as DifficultyType[]).map((diff) => (
                <button
                  type="button"
                  key={diff}
                  onClick={() => setDifficulty(diff)}
                  className={`py-1.5 px-1 rounded text-[11px] font-semibold border transition ${
                    difficulty === diff
                      ? 'bg-slate-800 border-amber-400 text-amber-300 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Quest Type & Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label" htmlFor="quest-type">Quest Frequency</label>
              <select
                id="quest-type"
                value={questType}
                onChange={(e) => setQuestType(e.target.value as QuestType)}
                className="form-input text-xs"
              >
                <option value="Daily">Daily Ritual</option>
                <option value="Habit">Repeatable Habit</option>
                <option value="Milestone">Epic Milestone</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="quest-due">Due Date (Optional)</label>
              <input
                id="quest-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="form-input text-xs"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rpg-btn rpg-btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rpg-btn rpg-btn-gold text-xs"
            >
              <Sparkles size={14} />
              <span>{isSubmitting ? 'Inscribing...' : editingQuest ? 'Save Changes' : 'Seal & Dispatch'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
