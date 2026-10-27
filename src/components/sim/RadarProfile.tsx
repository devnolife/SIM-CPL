'use client';

import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts';
import { STATUS_HEX, statusOf, type Thresholds } from '@/lib/status';
import { fmt1 } from '@/lib/format';

export type RadarPoint = { kode: string; nilai: number | null; deskripsi?: string };

/**
 * Jaring laba-laba CPL. Area = nilai mahasiswa, cincin putus-putus = batas
 * "tercapai". Sumbu tanpa nilai digambar di 0 dan labelnya diredupkan agar
 * tidak terbaca sebagai nilai nol yang sebenarnya.
 */
export function RadarProfile({
  points,
  thresholds,
  selected,
  onSelect,
  height = 300,
  className,
}: {
  points: RadarPoint[];
  thresholds: Thresholds;
  selected?: string | null;
  onSelect?: (kode: string) => void;
  height?: number;
  /** Bila diisi (mis. "h-[280px] sm:h-[340px]"), tinggi diatur lewat kelas, bukan `height`. */
  className?: string;
}) {
  const data = points.map((p) => ({ ...p, value: p.nilai ?? 0, batas: thresholds.tercapai }));

  return (
    <div style={className ? undefined : { height }} className={className ? `w-full ${className}` : 'w-full'}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%" margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
          <PolarGrid stroke="#dbe0dd" />
          <PolarRadiusAxis domain={[0, 100]} tickCount={5} tick={false} axisLine={false} />
          <PolarAngleAxis
            dataKey="kode"
            tick={(props: { x: number; y: number; payload: { value: string }; textAnchor: string }) => {
              const p = points.find((pt) => pt.kode === props.payload.value);
              const isSel = selected === props.payload.value;
              const status = statusOf(p?.nilai ?? null, thresholds);
              return (
                <g
                  transform={`translate(${props.x},${props.y})`}
                  onClick={onSelect ? () => onSelect(props.payload.value) : undefined}
                  style={{ cursor: onSelect ? 'pointer' : 'default' }}
                >
                  <text
                    textAnchor={props.textAnchor as 'start' | 'middle' | 'end'}
                    dy={4}
                    fontFamily="var(--font-plex-mono)"
                    fontSize={12}
                    fontWeight={isSel ? 600 : 500}
                    fill={status === 'kosong' ? '#9aa39f' : isSel ? '#0e1311' : '#39413d'}
                  >
                    {props.payload.value}
                  </text>
                </g>
              );
            }}
          />
          <Radar
            dataKey="batas"
            stroke="#39413d"
            strokeDasharray="3 4"
            strokeWidth={1}
            fill="none"
            isAnimationActive={false}
            dot={false}
            activeDot={false}
          />
          <Radar
            dataKey="value"
            stroke="#1d7a52"
            strokeWidth={2}
            fill="#1d7a52"
            fillOpacity={0.14}
            isAnimationActive={false}
            dot={(props: { cx: number; cy: number; index: number; payload: { payload?: RadarPoint } & Partial<RadarPoint> }) => {
              // Recharts 2.x: `payload` = titik radar; data asli ada di `payload.payload`.
              const d = (props.payload?.payload ?? props.payload) as RadarPoint;
              const status = statusOf(d.nilai ?? null, thresholds);
              const isSel = selected === d.kode;
              return (
                <circle
                  key={d.kode ?? props.index}
                  cx={props.cx}
                  cy={props.cy}
                  r={isSel ? 5.5 : 3.5}
                  fill={STATUS_HEX[status]}
                  stroke="#fff"
                  strokeWidth={isSel ? 2 : 1.5}
                  style={{ cursor: onSelect ? 'pointer' : 'default' }}
                  onClick={onSelect ? () => onSelect(d.kode) : undefined}
                />
              );
            }}
          />
          <Tooltip
            cursor={false}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const raw = payload.find((p) => p.dataKey === 'value') ?? payload[0];
              const p = raw.payload as RadarPoint;
              return (
                <div className="max-w-[260px] rounded-md border border-line bg-white px-3 py-2 text-[12.5px] shadow-pop">
                  <p className="code">{p.kode}</p>
                  {p.deskripsi && <p className="mt-0.5 text-ink-600">{p.deskripsi}</p>}
                  <p className="mt-1 font-medium text-ink-900">{p.nilai === null ? 'Belum ada nilai' : `Nilai ${fmt1(p.nilai)}`}</p>
                </div>
              );
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
