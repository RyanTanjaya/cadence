import type { ReactNode } from 'react';

function BrandMark() {
  return (
    <svg width="34" height="34" viewBox="0 0 36 36" fill="none" aria-hidden>
      <circle cx="18" cy="18" r="13" stroke="var(--ring-track)" strokeWidth="4" />
      <path d="M18 5a13 13 0 0 1 12.26 8.68" stroke="#F4A261" strokeWidth="4" strokeLinecap="round" />
      <path d="M30.26 13.68A13 13 0 1 1 8.7 9.2" stroke="#2A9D8F" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

interface Props {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

export default function AuthShell({ title, subtitle, children, footer }: Props) {
  return (
    <div className="grid min-h-screen place-items-center p-6">
      <div className="w-full max-w-[400px] animate-fade-up">
        <div className="mb-7 flex items-center justify-center gap-2.5">
          <BrandMark />
          <span className="font-display text-2xl font-semibold tracking-tight text-ink">Cadence</span>
        </div>
        <div className="rounded-xl border border-line bg-card p-7 shadow-cd-md">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">{title}</h1>
          <p className="mb-6 mt-1 text-sm text-ink-3">{subtitle}</p>
          {children}
        </div>
        <div className="mt-5 text-center text-sm text-ink-3">{footer}</div>
      </div>
    </div>
  );
}
