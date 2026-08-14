interface AuthHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
}

export function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <div className="mb-4 text-center lg:text-left">
      <h1 className="font-display text-xl font-extrabold tracking-tight">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
