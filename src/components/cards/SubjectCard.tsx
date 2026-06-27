import { Link } from 'react-router-dom';
import { ArrowUpRight, BookOpen } from 'lucide-react';
import { cn, formatCompact } from '@/lib/utils';
import { DynamicIcon } from '@/lib/icons';
import type { Subject } from '@/types';

export function SubjectCard({ subject }: { subject: Subject }) {
  return (
    <Link
      to={`/subjects/${subject.slug}`}
      className="group relative flex flex-col items-start gap-3 overflow-hidden rounded-2xl border bg-card p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-[0.06]',
          subject.gradient,
        )}
      />
      <span
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3',
          subject.gradient,
        )}
      >
        <DynamicIcon name={subject.icon} fallback={BookOpen} className="h-6 w-6" />
      </span>
      <div>
        <h3 className="font-display font-bold transition-colors group-hover:text-primary">
          {subject.name}
        </h3>
        <p className="text-sm text-muted-foreground">
          {formatCompact(subject.tutorCount)} tutors
        </p>
      </div>
      <ArrowUpRight className="absolute right-4 top-4 h-4 w-4 text-muted-foreground opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </Link>
  );
}
