import { PageHeader } from '@/components/dashboard/DashboardKit';
import { Panel } from '@/components/admin/AdminKit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/sonner';

export default function AdminSettings() {
  return (
    <div>
      <PageHeader title="Platform settings" description="Control commissions, verification requirements and features." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Commission & fees" subtitle="Applied across new bookings">
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="New tutor commission (%)" defaultValue="20" />
            <Field label="Loyal tutor commission (%)" defaultValue="10" />
            <Field label="Verification fee (PKR)" defaultValue="750" />
            <Field label="Institute placement fee (%)" defaultValue="8" />
          </div>
        </Panel>

        <Panel title="Verification requirements" subtitle="Which steps are mandatory to get listed">
          <div className="p-5">
            {[
              ['Identity (CNIC + selfie)', true],
              ['Education credentials', true],
              ['Criminal background check', true],
              ['Teaching experience proof', false],
              ['Subject proficiency test', false],
              ['Video demo session', true],
            ].map(([label, on], i) => (
              <div key={label as string}>
                {i > 0 && <Separator className="my-3" />}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{label}</span>
                  <Switch defaultChecked={on as boolean} />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Feature flags" subtitle="Toggle platform capabilities">
          <div className="p-5">
            {[
              ['AI tutor matching', false],
              ['Urdu voice search', false],
              ['In-app messaging', true],
              ['Session recording', true],
            ].map(([label, on], i) => (
              <div key={label as string}>
                {i > 0 && <Separator className="my-3" />}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{label}</span>
                  <Switch defaultChecked={on as boolean} />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Launch cities" subtitle="Where tutors can currently list">
          <div className="flex flex-wrap gap-2 p-5">
            {['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta'].map((c) => (
              <span key={c} className="rounded-full border bg-secondary/40 px-3 py-1 text-sm">
                {c}
              </span>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-6 flex justify-end">
        <Button variant="gradient" size="lg" onClick={() => toast.success('Settings saved')}>
          Save changes
        </Button>
      </div>
    </div>
  );
}

function Field({ label, defaultValue }: { label: string; defaultValue: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input type="number" defaultValue={defaultValue} />
    </div>
  );
}
