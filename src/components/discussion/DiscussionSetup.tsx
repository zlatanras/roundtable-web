'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ExpertCard } from '@/components/expert/ExpertCard';
import { AVAILABLE_MODELS, ExpertPanel, CreateDiscussionRequest } from '@/types';

export function DiscussionSetup() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [panels, setPanels] = useState<ExpertPanel[]>([]);
  const [selectedPanelId, setSelectedPanelId] = useState<string>('');
  const [formData, setFormData] = useState<CreateDiscussionRequest>({
    topic: '',
    title: '',
    panelId: '',
    model: 'anthropic/claude-sonnet-4.5',
    totalRounds: 4,
    moderatorMode: false,
    language: 'en',
  });

  // Fetch panels on mount
  useEffect(() => {
    async function fetchPanels() {
      try {
        const response = await fetch('/api/panels');
        const data = await response.json();
        setPanels(data.panels || []);
        if (data.panels?.length > 0) {
          const defaultPanel = data.panels.find((p: ExpertPanel) => p.isDefault) || data.panels[0];
          setSelectedPanelId(defaultPanel.id);
          setFormData(prev => ({ ...prev, panelId: defaultPanel.id }));
        }
      } catch (error) {
        console.error('Failed to fetch panels:', error);
      }
    }
    fetchPanels();
  }, []);

  const selectedPanel = panels.find(p => p.id === selectedPanelId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.topic.trim() || !formData.panelId) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/discussions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const discussion = await response.json();
        router.push(`/discussion/${discussion.id}`);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create discussion');
      }
    } catch (error) {
      console.error('Failed to create discussion:', error);
      alert('Failed to create discussion');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Topic */}
      <Card>
        <CardHeader>
          <CardTitle>Discussion Topic</CardTitle>
          <CardDescription>
            Describe what you want the experts to discuss. Be specific about your goals and constraints.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Discussion title (optional)"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          />
          <Textarea
            placeholder="Enter your discussion topic here... Include context, goals, and any specific questions you want the experts to address."
            value={formData.topic}
            onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
            className="min-h-[150px]"
            required
          />
        </CardContent>
      </Card>

      {/* Expert Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Expert Panel</CardTitle>
          <CardDescription>
            Choose the team of experts who will participate in the discussion.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedPanelId}
            onChange={(e) => {
              setSelectedPanelId(e.target.value);
              setFormData(prev => ({ ...prev, panelId: e.target.value }));
            }}
            options={panels.map(p => ({ value: p.id, label: p.name }))}
            className="mb-4"
          />

          {selectedPanel && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {selectedPanel.experts.map((expert) => (
                <ExpertCard key={expert.id} expert={expert} compact />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Discussion Settings</CardTitle>
          <CardDescription>
            Configure how the discussion should be conducted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Model */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                AI Model
              </label>
              <Select
                value={formData.model}
                onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                options={AVAILABLE_MODELS.map(m => ({ value: m.id, label: m.name }))}
              />
            </div>

            {/* Language */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Language
              </label>
              <Select
                value={formData.language}
                onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                options={[
                  { value: 'en', label: 'English' },
                  { value: 'de', label: 'German (Deutsch)' },
                ]}
              />
            </div>

            {/* Rounds */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Discussion Depth
              </label>
              <Select
                value={String(formData.totalRounds)}
                onChange={(e) => setFormData(prev => ({ ...prev, totalRounds: parseInt(e.target.value) }))}
                options={[
                  { value: '3', label: 'Quick (3 rounds)' },
                  { value: '4', label: 'Standard (4 rounds)' },
                  { value: '5', label: 'Deep (5 rounds)' },
                ]}
              />
            </div>

            {/* Moderator Mode */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Moderator Mode
              </label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="moderatorMode"
                    checked={!formData.moderatorMode}
                    onChange={() => setFormData(prev => ({ ...prev, moderatorMode: false }))}
                    className="text-indigo-600"
                  />
                  <span className="text-sm">Automatic</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="moderatorMode"
                    checked={formData.moderatorMode}
                    onChange={() => setFormData(prev => ({ ...prev, moderatorMode: true }))}
                    className="text-indigo-600"
                  />
                  <span className="text-sm">Interactive</span>
                </label>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {formData.moderatorMode
                  ? 'You can interject after each expert response'
                  : 'Experts will discuss automatically'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={isLoading || !formData.topic.trim()}>
          {isLoading ? 'Creating...' : 'Start Discussion'}
        </Button>
      </div>
    </form>
  );
}
