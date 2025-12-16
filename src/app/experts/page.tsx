'use client';

import { useEffect, useState } from 'react';
import { ExpertCard } from '@/components/expert/ExpertCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExpertPanel } from '@/types';

export default function ExpertsPage() {
  const [panels, setPanels] = useState<ExpertPanel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPanels() {
      try {
        const response = await fetch('/api/panels');
        const data = await response.json();
        setPanels(data.panels || []);
        if (data.panels?.length > 0) {
          setSelectedPanelId(data.panels[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch panels:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPanels();
  }, []);

  const selectedPanel = panels.find((p) => p.id === selectedPanelId);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-48 bg-slate-200 dark:bg-slate-700 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Expert Panels
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            View and manage expert panels for your discussions.
          </p>
        </div>
        <Button disabled>Create Panel (Coming Soon)</Button>
      </div>

      {/* Panel Selector */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {panels.map((panel) => (
          <Button
            key={panel.id}
            variant={selectedPanelId === panel.id ? 'default' : 'outline'}
            onClick={() => setSelectedPanelId(panel.id)}
            className="whitespace-nowrap"
          >
            {panel.name}
            {panel.isDefault && (
              <span className="ml-2 text-xs opacity-70">(Default)</span>
            )}
          </Button>
        ))}
      </div>

      {/* Selected Panel */}
      {selectedPanel && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedPanel.name}</CardTitle>
            {selectedPanel.description && (
              <CardDescription>{selectedPanel.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {selectedPanel.experts.map((expert) => (
                <ExpertCard key={expert.id} expert={expert} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {panels.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-600 dark:text-slate-400">
              No expert panels found.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
