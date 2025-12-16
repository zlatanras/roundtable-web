import { DiscussionSetup } from '@/components/discussion/DiscussionSetup';

export default function NewDiscussionPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Start New Discussion
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Configure your expert roundtable and start the discussion.
        </p>
      </div>

      <DiscussionSetup />
    </div>
  );
}
