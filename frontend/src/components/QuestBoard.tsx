import React, { useState } from 'react';
import { 
  Check, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  Scroll, 
  Calendar, 
  Dumbbell, 
  Brain, 
  Heart, 
  Zap, 
  Sparkles,
  Filter
} from 'lucide-react';
import { Quest, AttributeType, DifficultyType, QuestType } from '../types';
import { soundEngine } from '../services/soundEngine';
import { triggerQuestCompleteSparks } from '../services/particleEngine';

interface QuestBoardProps {
  quests: Quest[];
  onCompleteQuest: (questId: string, event?: React.MouseEvent) => void;
  onOpenNewQuest: () => void;
  onEditQuest: (quest: Quest) => void;
  onDeleteQuest: (questId: string) => void;
}

export const QuestBoard: React.FC<QuestBoardProps> = ({
  quests,
  onCompleteQuest,
  onOpenNewQuest,
  onEditQuest,
  onDeleteQuest
}) => {
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedAttr, setSelectedAttr] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showCompleted, setShowCompleted] = useState<boolean>(false);

  const getAttributeIcon = (attr: AttributeType) => {
    switch (attr) {
      case 'STR': return <Dumbbell size={13} className="text-amber-400" />;
      case 'INT': return <Brain size={13} className="text-purple-400" />;
      case 'VIT': return <Heart size={13} className="text-red-400" />;
      case 'AGI': return <Zap size={13} className="text-emerald-400" />;
      case 'CHA': return <Sparkles size={13} className="text-pink-400" />;
    }
  };

  const getDifficultyClass = (diff: DifficultyType) => {
    switch (diff) {
      case 'Trivial': return 'diff-trivial';
      case 'Easy': return 'diff-easy';
      case 'Medium': return 'diff-medium';
      case 'Hard': return 'diff-hard';
      case 'Legendary': return 'diff-legendary';
    }
  };

  const filteredQuests = quests.filter((q) => {
    if (!showCompleted && q.is_completed) return false;
    if (showCompleted && !q.is_completed) return false;
    if (selectedType !== 'All' && q.quest_type !== selectedType) return false;
    if (selectedAttr !== 'All' && q.attribute !== selectedAttr) return false;
    if (searchQuery.trim() !== '') {
      const matchTitle = q.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDesc = q.description.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchTitle && !matchDesc) return false;
    }
    return true;
  });

  const handleCheckClick = (e: React.MouseEvent, q: Quest) => {
    if (q.is_completed) return;
    soundEngine.playQuestComplete();
    triggerQuestCompleteSparks(e.clientX, e.clientY);
    onCompleteQuest(q.id, e);
  };

  return (
    <section className="rpg-panel">
      {/* Board Header */}
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <Scroll size={20} className="text-amber-400" />
          <h2 className="panel-title text-base font-bold">The Quest Board</h2>
          <span className="text-xs text-slate-400 font-mono">
            ({quests.filter(q => !q.is_completed).length} active)
          </span>
        </div>

        <button onClick={onOpenNewQuest} className="rpg-btn rpg-btn-gold text-xs">
          <Plus size={15} />
          <span>Summon Quest</span>
        </button>
      </div>

      {/* Controls / Search & Filters */}
      <div className="space-y-3 mb-4">
        {/* Search Bar */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search active quests or ancient deeds..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input pl-9 text-xs"
          />
        </div>

        {/* Quest Type Filter Tabs */}
        <div className="quest-tabs">
          {['All', 'Daily', 'Habit', 'Milestone'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`quest-tab-btn ${selectedType === type ? 'quest-tab-btn-active' : ''}`}
            >
              {type === 'All' ? 'All Deeds' : `${type}s`}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className={`text-xs px-2.5 py-1 rounded border transition ${
                showCompleted
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {showCompleted ? 'Showing Archived' : 'Show Archived'}
            </button>
          </div>
        </div>

        {/* Attribute Pills Filter */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <span className="text-slate-500 text-[11px] font-semibold flex items-center gap-1 mr-1">
            <Filter size={12} /> Attribute:
          </span>
          {['All', 'STR', 'INT', 'VIT', 'AGI', 'CHA'].map((attr) => (
            <button
              key={attr}
              onClick={() => setSelectedAttr(attr)}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                selectedAttr === attr
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {attr}
            </button>
          ))}
        </div>
      </div>

      {/* Quest Cards List */}
      <div className="space-y-2.5">
        {filteredQuests.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-800 bg-slate-900/30">
            <Scroll size={36} className="mx-auto text-slate-600 mb-2" />
            <h3 className="font-rpg text-sm font-semibold text-slate-400">
              {showCompleted ? 'No completed deeds found' : 'The Realm is Quiet... No Quests Found'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {showCompleted
                ? 'Complete active quests to etch them into your personal history.'
                : 'Summon a new quest to train your attributes, earn gold, and strike at the boss!'}
            </p>
            {!showCompleted && (
              <button onClick={onOpenNewQuest} className="rpg-btn rpg-btn-gold text-xs mt-4">
                <Plus size={14} />
                <span>Create Your First Quest</span>
              </button>
            )}
          </div>
        ) : (
          filteredQuests.map((quest) => (
            <div
              key={quest.id}
              className={`quest-card ${quest.is_completed ? 'quest-card-completed' : ''}`}
            >
              {/* Checkmark Completion Button */}
              <button
                onClick={(e) => handleCheckClick(e, quest)}
                disabled={Boolean(quest.is_completed)}
                className={`quest-check ${quest.is_completed ? 'quest-check-done' : ''}`}
                title={quest.is_completed ? 'Deed Completed' : 'Complete Quest & Claim Rewards'}
                aria-label={`Mark quest "${quest.title}" as complete`}
              >
                {quest.is_completed && <Check size={16} strokeWidth={3} />}
              </button>

              {/* Quest Details */}
              <div className="flex-1 min-w-0">
                <h3 className="quest-title">{quest.title}</h3>
                {quest.description && (
                  <p className="quest-desc">{quest.description}</p>
                )}

                <div className="quest-meta">
                  {/* Attribute Badge */}
                  <span className="badge-tag bg-slate-900 border border-slate-800 flex items-center gap-1">
                    {getAttributeIcon(quest.attribute)}
                    <span className="text-slate-300">{quest.attribute}</span>
                  </span>

                  {/* Difficulty Tag */}
                  <span className={`badge-tag bg-slate-900/80 border border-slate-800 font-bold ${getDifficultyClass(quest.difficulty)}`}>
                    {quest.difficulty}
                  </span>

                  {/* Type Tag */}
                  <span className="badge-tag bg-slate-900/60 text-slate-400 border border-slate-800/80">
                    {quest.quest_type}
                  </span>

                  {/* Due Date if any */}
                  {quest.due_date && (
                    <span className="badge-tag bg-slate-900/60 text-slate-400 border border-slate-800/80 flex items-center gap-1">
                      <Calendar size={11} />
                      <span>{quest.due_date}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Edit / Delete Buttons */}
              <div className="flex items-center gap-1">
                {!quest.is_completed && (
                  <button
                    onClick={() => onEditQuest(quest)}
                    className="icon-btn w-7 h-7"
                    title="Edit Quest"
                    aria-label="Edit Quest"
                  >
                    <Edit3 size={13} />
                  </button>
                )}
                <button
                  onClick={() => onDeleteQuest(quest.id)}
                  className="icon-btn w-7 h-7 hover:text-red-400 hover:border-red-500/30"
                  title="Abandon Quest"
                  aria-label="Abandon Quest"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};
