'use client';

import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STATUS_HEX, STATUS_LABEL, statusOf, type CplStatus, type Thresholds } from '@/lib/status';
import { fmt1 } from '@/lib/format';

/* ── Kepala halaman ────────────────────────────────────────────────────── */

export function PageHeader({
  title,
  description,
  context,
  actions,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** baris konteks kecil di atas judul, mis. "S1 Teknik Informatika · Semester 3" */
  context?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {context && <p className="mb-1 text-[13px] text-ink-500">{context}</p>}
        <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.01em] sm:text-[26px]">{title}</h1>
        {description && <p className="mt-1.5 max-w-[68ch] text-[14px] text-ink-600">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/* ── Field & kontrol ───────────────────────────────────────────────────── */

export function Field({
  label,
  htmlFor,
  hint,
  error,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: React.ReactNode;
  error?: string | null;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="label">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="mt-1.5 text-[12.5px] text-bad-fg">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="mt-1.5 text-[12.5px] text-ink-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Select({
  id,
  value,
  onChange,
  disabled,
  children,
  className,
}: {
  id: string;
  value: string | number;
  onChange: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <select id={id} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} className={cn('control', className)}>
      {children}
    </select>
  );
}

export const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

/* ── Status capaian ────────────────────────────────────────────────────── */

const TAG_CLASS: Record<CplStatus, string> = {
  tercapai: 'bg-ok-bg text-ok-fg',
  cukup: 'bg-warn-bg text-warn-fg',
  belum: 'bg-bad-bg text-bad-fg',
  kosong: 'bg-ink-100 text-ink-600',
};

export function StatusTag({ status, className }: { status: CplStatus; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded px-1.5 py-0.5 text-[12px] font-medium', TAG_CLASS[status], className)}>
      <span className="size-1.5 rounded-full" style={{ background: STATUS_HEX[status] }} aria-hidden />
      {STATUS_LABEL[status]}
    </span>
  );
}

/**
 * Bar skor 0–100 dengan tanda ambang. Lebar = nilai, warna = status, garis
 * tipis vertikal = batas "tercapai" — jadi jarak ke target terbaca tanpa angka.
 */
export function ScoreBar({
  value,
  thresholds,
  className,
  showThreshold = true,
}: {
  value: number | null | undefined;
  thresholds: Thresholds;
  className?: string;
  showThreshold?: boolean;
}) {
  const status = statusOf(value, thresholds);
  const width = value === null || value === undefined ? 0 : Math.max(0, Math.min(100, value));
  return (
    <div className={cn('relative h-1.5 w-full rounded-full bg-ink-100', className)} aria-hidden>
      <div className="h-full rounded-full" style={{ width: `${width}%`, background: STATUS_HEX[status] }} />
      {showThreshold && (
        <div className="absolute -top-1 h-3.5 w-px bg-ink-700" style={{ left: `${thresholds.tercapai}%` }} title={`Batas tercapai ${thresholds.tercapai}`} />
      )}
    </div>
  );
}

export function Score({ value, className }: { value: number | null | undefined; className?: string }) {
  return <span className={cn('num font-semibold text-ink-900', className)}>{fmt1(value ?? null)}</span>;
}

/* ── Pemberitahuan ─────────────────────────────────────────────────────── */

const NOTICE = {
  info: { box: 'border-line bg-white text-ink-800', icon: Info, iconClass: 'text-ink-500' },
  success: { box: 'border-ok/30 bg-ok-bg text-ok-fg', icon: CheckCircle2, iconClass: 'text-ok' },
  warning: { box: 'border-warn/40 bg-warn-bg text-warn-fg', icon: AlertTriangle, iconClass: 'text-warn' },
  error: { box: 'border-bad/30 bg-bad-bg text-bad-fg', icon: XCircle, iconClass: 'text-bad' },
} as const;

export function Notice({
  tone = 'info',
  title,
  children,
  action,
  className,
}: {
  tone?: keyof typeof NOTICE;
  title?: React.ReactNode;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  const t = NOTICE[tone];
  const Icon = t.icon;
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={cn('flex items-start gap-3 rounded-lg border px-4 py-3 text-[13.5px]', t.box, className)}>
      <Icon className={cn('mt-0.5 size-4 shrink-0', t.iconClass)} aria-hidden />
      <div className="min-w-0 flex-1">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className={cn(title && 'mt-0.5', 'opacity-90')}>{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ── Keadaan kosong & memuat ───────────────────────────────────────────── */

export function EmptyState({
  title,
  children,
  action,
  className,
}: {
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-lg border border-dashed border-line-strong bg-white/60 px-6 py-10 text-center', className)}>
      <p className="font-medium text-ink-800">{title}</p>
      {children && <div className="mx-auto mt-1 max-w-[52ch] text-[13.5px] text-ink-600">{children}</div>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-ink-100', className)} aria-hidden />;
}

export function SectionTitle({ children, meta, className }: { children: React.ReactNode; meta?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('mb-3 flex items-baseline justify-between gap-3', className)}>
      <h2 className="text-[15px] font-semibold">{children}</h2>
      {meta && <div className="text-[13px] text-ink-500">{meta}</div>}
    </div>
  );
}

/* ── Tab tersegmentasi ─────────────────────────────────────────────────── */

export function SegmentedTabs<T extends string>({
  label,
  items,
  value,
  onChange,
  className,
}: {
  label: string;
  items: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
}) {
  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next = (index + (e.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length;
    onChange(items[next].id);
    (e.currentTarget.parentElement?.children[next] as HTMLElement | undefined)?.focus();
  };
  return (
    <div role="tablist" aria-label={label} className={cn('inline-flex max-w-full overflow-x-auto rounded-md border border-line-strong bg-ink-50 p-0.5', className)}>
      {items.map((item, i) => {
        const selected = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              'h-8 shrink-0 rounded-[5px] px-3 text-[13.5px] transition-colors',
              selected ? 'bg-white font-medium text-ink-950 shadow-[0_1px_2px_rgba(14,19,17,.12)]' : 'text-ink-600 hover:text-ink-900',
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
