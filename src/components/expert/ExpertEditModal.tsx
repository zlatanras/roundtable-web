'use client';

import { useState } from 'react';
import { Expert, AVAILABLE_MODELS } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ExpertAvatar } from '@/components/discussion/ExpertAvatar';

interface ExpertEditModalProps {
  expert: Expert;
  onSave: (expert: Expert) => void;
  onClose: () => void;
}

export function ExpertEditModal({ expert, onSave, onClose }: ExpertEditModalProps) {
  const [editedExpert, setEditedExpert] = useState<Expert>({ ...expert });
  const [useCustomModel, setUseCustomModel] = useState(
    !AVAILABLE_MODELS.some(m => m.id === expert.aiModel) && !!expert.aiModel
  );
  const [customModelId, setCustomModelId] = useState(
    !AVAILABLE_MODELS.some(m => m.id === expert.aiModel) ? (expert.aiModel || '') : ''
  );

  const handleSave = () => {
    const finalExpert = {
      ...editedExpert,
      aiModel: useCustomModel ? customModelId : editedExpert.aiModel,
    };
    onSave(finalExpert);
  };

  const handleModelChange = (modelId: string) => {
    setEditedExpert({ ...editedExpert, aiModel: modelId });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4">
            <ExpertAvatar name={editedExpert.name} color={editedExpert.color} size="lg" />
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                {editedExpert.name}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {editedExpert.role}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Name
            </label>
            <Input
              value={editedExpert.name}
              onChange={(e) => setEditedExpert({ ...editedExpert, name: e.target.value })}
            />
          </div>

          {/* Role */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Rolle
            </label>
            <Input
              value={editedExpert.role}
              onChange={(e) => setEditedExpert({ ...editedExpert, role: e.target.value })}
            />
          </div>

          {/* AI Model Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              KI-Modell
            </label>

            {/* Toggle between preset and custom */}
            <div className="flex gap-2">
              <button
                type="button"
                className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                  !useCustomModel
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950 dark:border-indigo-700 dark:text-indigo-300'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
                onClick={() => setUseCustomModel(false)}
              >
                Aus Liste wählen
              </button>
              <button
                type="button"
                className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                  useCustomModel
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950 dark:border-indigo-700 dark:text-indigo-300'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
                onClick={() => setUseCustomModel(true)}
              >
                Eigene ID eingeben
              </button>
            </div>

            {!useCustomModel ? (
              /* Preset Models */
              <div className="space-y-2">
                {AVAILABLE_MODELS.map((model) => (
                  <label
                    key={model.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      editedExpert.aiModel === model.id
                        ? 'bg-indigo-50 border-indigo-300 dark:bg-indigo-950 dark:border-indigo-700'
                        : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="aiModel"
                      value={model.id}
                      checked={editedExpert.aiModel === model.id}
                      onChange={() => handleModelChange(model.id)}
                      className="text-indigo-600"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {model.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {model.id}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              /* Custom Model ID */
              <div className="space-y-2">
                <Input
                  value={customModelId}
                  onChange={(e) => setCustomModelId(e.target.value)}
                  placeholder="z.B. anthropic/claude-sonnet-4.5"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Gib die OpenRouter Model-ID ein. Du findest sie auf{' '}
                  <a
                    href="https://openrouter.ai/models"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline"
                  >
                    openrouter.ai/models
                  </a>
                </p>
              </div>
            )}
          </div>

          {/* Color */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Farbe
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={editedExpert.color}
                onChange={(e) => setEditedExpert({ ...editedExpert, color: e.target.value })}
                className="w-10 h-10 rounded cursor-pointer"
              />
              <Input
                value={editedExpert.color}
                onChange={(e) => setEditedExpert({ ...editedExpert, color: e.target.value })}
                className="font-mono flex-1"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          <Button onClick={handleSave}>
            Speichern
          </Button>
        </div>
      </div>
    </div>
  );
}
