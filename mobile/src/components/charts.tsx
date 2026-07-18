import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Rect, G } from 'react-native-svg';
import { colors, space } from '../lib/theme';

/** Horizontal labelled bars (topics, languages, per-platform). */
export function BarList({
  data,
  color = colors.brand,
}: {
  data: { label: string; value: number; color?: string }[];
  color?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <View style={{ gap: space(2) }}>
      {data.map((d) => (
        <View key={d.label} style={c.barRow}>
          <Text style={c.barLabel} numberOfLines={1}>
            {d.label}
          </Text>
          <View style={c.barTrack}>
            <View
              style={[
                c.barFill,
                { width: `${(d.value / max) * 100}%`, backgroundColor: d.color ?? color },
              ]}
            />
          </View>
          <Text style={c.barValue}>{d.value}</Text>
        </View>
      ))}
    </View>
  );
}

/** Donut showing a segmented breakdown (e.g. easy/medium/hard). */
export function Donut({
  segments,
  size = 150,
  thickness = 22,
  centerLabel,
  centerSub,
}: {
  segments: { value: number; color: string }[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerSub?: string;
}) {
  const total = segments.reduce((a, b) => a + b.value, 0) || 1;
  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={colors.border}
            strokeWidth={thickness}
            fill="none"
          />
          {segments.map((seg, i) => {
            const frac = seg.value / total;
            const dash = frac * circ;
            const el = (
              <Circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke={seg.color}
                strokeWidth={thickness}
                strokeDasharray={`${dash} ${circ - dash}`}
                strokeDashoffset={-offset}
                fill="none"
                strokeLinecap="butt"
              />
            );
            offset += dash;
            return el;
          })}
        </G>
      </Svg>
      {centerLabel != null ? (
        <View style={c.donutCenter}>
          <Text style={c.donutLabel}>{centerLabel}</Text>
          {centerSub ? <Text style={c.donutSub}>{centerSub}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

/**
 * GitHub-style contribution heatmap.
 * `counts` maps a day key (any string) → count; we lay them out in week columns.
 */
export function Heatmap({ days }: { days: { count: number }[] }) {
  const cell = 12;
  const gap = 3;
  const cols = Math.ceil(days.length / 7);
  const max = Math.max(1, ...days.filter((d) => d.count > 0).map((d) => d.count));
  const shade = (n: number) => {
    if (n === 0) return colors.cardAlt; // no activity
    const t = Math.min(1, n / max);
    if (t < 0.25) return '#f7d7cf';
    if (t < 0.5) return '#f0a996';
    if (t < 0.75) return '#ea7c62';
    return colors.brand;
  };
  const width = cols * (cell + gap);
  const height = 7 * (cell + gap);
  return (
    <Svg width={width} height={height}>
      {days.map((d, i) => {
        if (d.count < 0) return null; // leading weekday padding
        const col = Math.floor(i / 7);
        const row = i % 7;
        return (
          <Rect
            key={i}
            x={col * (cell + gap)}
            y={row * (cell + gap)}
            width={cell}
            height={cell}
            rx={2}
            fill={shade(d.count)}
          />
        );
      })}
    </Svg>
  );
}

const c = StyleSheet.create({
  barRow: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
  barLabel: { width: 96, fontSize: 12, color: colors.muted },
  barTrack: {
    flex: 1,
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.cardAlt,
    overflow: 'hidden',
  },
  barFill: { height: 10, borderRadius: 999 },
  barValue: { width: 40, textAlign: 'right', fontSize: 12, fontWeight: '700', color: colors.ink },
  donutCenter: { position: 'absolute', alignItems: 'center' },
  donutLabel: { fontSize: 22, fontWeight: '800', color: colors.ink },
  donutSub: { fontSize: 11, color: colors.muted },
});
