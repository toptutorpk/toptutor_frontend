import { Camera, Bell, Lock, Globe, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/DashboardKit';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/authStore';
import { getInitials } from '@/lib/utils';
import { toast } from '@/components/ui/sonner';

export default function ProfileSettings() {
  const user = useAuthStore((s) => s.user);

  return (
    <div>
      <PageHeader title="Profile & Settings" description="Manage your account, notifications and security." />
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="rounded-2xl border bg-card p-6 shadow-soft">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user?.avatarUrl} alt={user?.name} />
                  <AvatarFallback className="text-xl">{getInitials(user?.name ?? 'TT')}</AvatarFallback>
                </Avatar>
                <button className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white shadow-md">
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <div>
                <h3 className="font-display text-lg font-bold">{user?.name ?? 'Your Name'}</h3>
                <p className="text-sm capitalize text-muted-foreground">{user?.role ?? 'student'} account</p>
              </div>
            </div>
            <Separator className="my-6" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Full name</Label>
                <Input defaultValue={user?.name} />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input defaultValue={user?.phone} />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input defaultValue={user?.email} placeholder="you@email.com" />
              </div>
              <div className="space-y-1.5">
                <Label>City</Label>
                <Input defaultValue={user?.city ?? 'Karachi'} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Bio</Label>
                <Textarea placeholder="Tell us a bit about yourself…" />
              </div>
            </div>
            <Button variant="gradient" className="mt-6" onClick={() => toast.success('Profile saved')}>
              Save changes
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <div className="rounded-2xl border bg-card p-6 shadow-soft">
            {[
              { icon: Bell, label: 'Session reminders', desc: 'SMS & push 24h and 1h before sessions', on: true },
              { icon: Globe, label: 'New tutor matches', desc: 'When a tutor matches your requirement', on: true },
              { icon: Bell, label: 'Promotions & tips', desc: 'Occasional product updates and offers', on: false },
            ].map((n, i) => (
              <div key={n.label}>
                {i > 0 && <Separator className="my-4" />}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                      <n.icon className="h-4 w-4 text-muted-foreground" />
                    </span>
                    <div>
                      <div className="font-medium">{n.label}</div>
                      <div className="text-sm text-muted-foreground">{n.desc}</div>
                    </div>
                  </div>
                  <Switch defaultChecked={n.on} />
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="security">
          <div className="space-y-6">
            <div className="rounded-2xl border bg-card p-6 shadow-soft">
              <h3 className="flex items-center gap-2 font-display font-bold">
                <Lock className="h-4 w-4" /> Change password
              </h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Current password</Label>
                  <Input type="password" placeholder="••••••••" />
                </div>
                <div />
                <div className="space-y-1.5">
                  <Label>New password</Label>
                  <Input type="password" placeholder="••••••••" />
                </div>
                <div className="space-y-1.5">
                  <Label>Confirm password</Label>
                  <Input type="password" placeholder="••••••••" />
                </div>
              </div>
              <Button variant="gradient" className="mt-4" onClick={() => toast.success('Password updated')}>
                Update password
              </Button>
            </div>

            <div className="flex items-center justify-between rounded-2xl border bg-card p-6 shadow-soft">
              <div>
                <h3 className="font-display font-bold">Two-factor authentication</h3>
                <p className="text-sm text-muted-foreground">Add an extra layer of security to your account.</p>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-500/20 dark:bg-red-500/10">
              <div>
                <h3 className="font-display font-bold text-red-700 dark:text-red-400">Delete account</h3>
                <p className="text-sm text-red-600/80 dark:text-red-400/70">
                  Permanently delete your account and all data.
                </p>
              </div>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
