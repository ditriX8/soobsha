import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/* ---------- Кнопка ---------- */

type ButtonVariant = "primary" | "secondary" | "accent" | "ghost";
type ButtonSize = "md" | "lg";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-colors duration-150 min-h-11 disabled:opacity-50";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-forest text-surface hover:bg-forest-700",
  secondary: "bg-surface text-ink border border-line hover:bg-sand/50",
  // На коралловом фоне — тёмный текст: белый не проходит по контрасту.
  accent: "bg-coral text-ink hover:brightness-95",
  ghost: "text-forest hover:bg-mint",
};

const buttonSizes: Record<ButtonSize, string> = {
  md: "px-5 py-2.5 text-[15px]",
  lg: "px-7 py-4 text-base",
};

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md") {
  return `${buttonBase} ${buttonVariants[variant]} ${buttonSizes[size]}`;
}

export function ButtonLink({
  variant,
  size,
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <Link className={`${buttonClass(variant, size)} ${className}`} {...props} />;
}

/* ---------- Тег (чип) ---------- */

export type Tone = "mint" | "lilac" | "coral" | "sun" | "ink" | "outline";

const toneClass: Record<Tone, string> = {
  mint: "bg-mint text-forest-700",
  lilac: "bg-lilac-soft text-ink",
  coral: "bg-coral-soft text-ink",
  sun: "bg-sun-soft text-ink",
  ink: "bg-ink text-surface",
  outline: "border border-line text-ink-2 bg-surface",
};

export function Chip({ tone = "mint", children, className = "" }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap ${toneClass[tone]} ${className}`}>
      {children}
    </span>
  );
}

/* ---------- Аватар ---------- */

const avatarTones = {
  coral: "bg-coral-soft",
  sun: "bg-sun-soft",
  lilac: "bg-lilac-soft",
  mint: "bg-mint",
  surface: "bg-surface",
} as const;
export type AvatarTone = keyof typeof avatarTones;

export function Avatar({
  letter,
  tone = "coral",
  size = 40,
  ring = "ring-surface",
}: {
  letter: string;
  tone?: AvatarTone;
  size?: number;
  ring?: string;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-display font-medium text-ink ring-[2.5px] ${ring} ${avatarTones[tone]}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
      aria-hidden="true"
    >
      {letter}
    </span>
  );
}

export function AvatarStack({
  people,
  size = 36,
  ring,
}: {
  people: { letter: string; tone: AvatarTone }[];
  size?: number;
  ring?: string;
}) {
  return (
    <span className="flex">
      {people.map((p, i) => (
        <span key={i} className={i === 0 ? "" : "-ml-2.5"}>
          <Avatar letter={p.letter} tone={p.tone} size={size} ring={ring} />
        </span>
      ))}
    </span>
  );
}

/* ---------- Полоса недель ---------- */

/** Срок круга по неделям. Сегменты делят фиксированную ширину, поэтому 4 и 12 недель занимают одинаково места. */
export function WeekBar({
  total,
  done,
  current = done,
  className = "w-24",
  tone = "light",
}: {
  total: number;
  done: number;
  current?: number;
  className?: string;
  tone?: "light" | "dark";
}) {
  const empty = tone === "dark" ? "bg-forest-700" : "bg-line";
  return (
    <span className={`flex shrink-0 gap-1 ${className}`} role="img" aria-label={`Пройдено недель: ${done} из ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`h-2 flex-1 rounded-full ${i < done ? "bg-forest" : i === current ? "bg-sun" : empty}`} />
      ))}
    </span>
  );
}

/* ---------- Логотип ---------- */

export function Logo({ size = 34 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden="true">
        <circle cx="13" cy="18" r="11" fill="#1E5C4A" />
        <circle cx="23" cy="18" r="11" fill="#EF7556" fillOpacity="0.85" />
      </svg>
      <span className="font-display text-[21px] font-semibold tracking-[-0.04em]">сообща</span>
    </span>
  );
}
