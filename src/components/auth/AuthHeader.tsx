interface AuthHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
}

export function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <div className="mb-8 text-center lg:text-left">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">{title}</h1>
      {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
