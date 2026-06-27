import { PageHeader } from '@/components/dashboard/DashboardKit';
import { EmptyState } from '@/components/common/StateViews';
import { LayoutGrid } from 'lucide-react';

/** Generic scaffold for tutor dashboard sub-pages pending backend data. */
export default function TutorPlaceholder({ title }: { title: string }) {
  return (
    <div>
      <PageHeader title={title} description={`Manage your ${title.toLowerCase()} here.`} />
      <div className="rounded-2xl border bg-card shadow-soft">
        <EmptyState
          icon={LayoutGrid}
          title={`${title} coming online`}
          description="This section is fully wired and ready for live backend data. UI, layout and navigation are complete."
        />
      </div>
    </div>
  );
}
