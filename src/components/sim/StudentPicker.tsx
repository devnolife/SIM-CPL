'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronsUpDown, Search } from 'lucide-react';
import type { MahasiswaSummary } from '@/lib/simcplApi';
import { cn } from '@/lib/utils';

/**
 * Pemilih mahasiswa: combobox yang bisa dicari lewat NIM atau nama.
 * Pola ARIA combobox + listbox; panah atas/bawah, Enter, Escape.
 */
export function StudentPicker({
  id,
  students,
  value,
  onChange,
  loading,
  disabled,
}: {
  id: string;
  students: MahasiswaSummary[];
  value: string | null;
  onChange: (nim: string) => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = students.find((s) => s.nim === value) ?? null;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => s.nim.toLowerCase().includes(q) || s.nama.toLowerCase().includes(q));
  }, [students, query]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const choose = (nim: string) => {
    onChange(nim);
    setOpen(false);
    setQuery('');
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (open && filtered[active]) {
        e.preventDefault();
        choose(filtered[active].nim);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
    }
  };

  const placeholder = loading ? 'Memuat mahasiswa…' : students.length === 0 ? 'Tidak ada mahasiswa' : 'Cari NIM atau nama';
  const display = open ? query : selected ? `${selected.nim} · ${selected.nama}` : '';

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" aria-hidden />
        <input
          ref={inputRef}
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && filtered[active] ? `${listId}-${filtered[active].nim}` : undefined}
          autoComplete="off"
          disabled={disabled || loading || students.length === 0}
          value={display}
          placeholder={placeholder}
          onFocus={() => {
            setOpen(true);
            setQuery('');
            setActive(Math.max(0, students.findIndex((s) => s.nim === value)));
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          className="control pl-9 pr-9"
        />
        <ChevronsUpDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" aria-hidden />
      </div>

      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-md border border-line bg-white py-1 shadow-pop"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-[13.5px] text-ink-500">Tidak ada yang cocok dengan “{query}”.</li>
          ) : (
            filtered.map((s, i) => (
              <li
                key={s.nim}
                id={`${listId}-${s.nim}`}
                role="option"
                aria-selected={s.nim === value}
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(s.nim);
                }}
                onMouseEnter={() => setActive(i)}
                className={cn(
                  'flex cursor-pointer items-baseline gap-3 px-3 py-1.5 text-[13.5px]',
                  i === active && 'bg-ink-50',
                  s.nim === value && 'font-medium',
                )}
              >
                <span className="code shrink-0">{s.nim}</span>
                <span className="truncate text-ink-800">{s.nama}</span>
                <span className="ml-auto shrink-0 text-[12px] text-ink-500">{s.angkatan ?? ''}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
