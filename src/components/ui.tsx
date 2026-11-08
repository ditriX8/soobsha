import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

/* ---------- Кнопка ---------- */

export type ButtonVariant = "primary" | "secondary" | "accent" | "ghost" | "danger" | "dangerSoft";
type ButtonSize = "sm" | "md" | "lg";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-colors duration-150 min-h-11 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-forest text-surface hover:bg-forest-700",
  secondary: "bg-surface text-ink border border-line hover:bg-sand/60",
  // На коралловом фоне — тёмный текст: белый не проходит по контрасту.
  accent: "bg-coral text-ink hover:brightness-95",
  ghost: "text-forest hover:bg-mint",
  danger: "bg-danger text-surface hover:brightness-95",
  dangerSoft: "bg-coral-soft text-danger hover:brightness-95",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm min-h-10",
  md: "px-5 py-2.5 text-[15px]",
  lg: "px-7 py-4 text-base",
};

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md") {
  return `${buttonBase} ${buttonVariants[variant]} ${buttonSizes[size]}`;
}

export function Button({
  variant,
  size,
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button type={type} className={`${buttonClass(variant, size)} ${className}`} {...props} />;
}

/** Ссылка, выглядящая как кнопка. Навигация — по якорю (#catalog и т. п.). */
export function ButtonLink({
  variant,
  size,
  className = "",
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <a className={`${buttonClass(variant, size)} ${className}`} {...props} />;
}

/** Круглая кнопка-иконка (назад, меню). */
export function IconButton({
  label,
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-line bg-surface text-ink hover:bg-sand/60 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
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
export const avatarToneList = Object.keys(avatarTones) as AvatarTone[];

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
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-display font-medium text-ink uppercase ring-[2.5px] ${ring} ${avatarTones[tone]}`}
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
        <span key={i} className={`h-2 flex-1 rounded-full ${i < done ? (tone === "dark" ? "bg-sun" : "bg-forest") : i === current ? (tone === "dark" ? "bg-surface" : "bg-sun") : empty}`} />
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

/* ---------- Переключатель ---------- */

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-[46px] shrink-0 cursor-pointer items-center rounded-full p-[3px] transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        checked ? "bg-forest" : "bg-line"
      }`}
    >
      <span
        className={`size-[22px] rounded-full bg-surface shadow-[0_1px_3px_rgb(0_0_0/0.18)] transition-transform ${checked ? "translate-x-[18px]" : ""}`}
      />
    </button>
  );
}

/* ---------- Карточка-контейнер ---------- */

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl border border-line bg-surface shadow-card ${className}`}>{children}</div>;
}

/* ---------- Пустое состояние ---------- */

export function EmptyState({
  title,
  text,
  children,
  icon,
}: {
  title: string;
  text?: string;
  children?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-line bg-surface/60 px-6 py-10 text-center">
      {icon && <span className="flex size-14 items-center justify-center rounded-full bg-mint text-forest">{icon}</span>}
      <h3 className="font-display text-lg font-medium tracking-[-0.01em]">{title}</h3>
      {text && <p className="max-w-[420px] text-[15px] leading-[1.55] text-ink-2">{text}</p>}
      {children && <div className="mt-1 flex flex-wrap justify-center gap-2">{children}</div>}
    </div>
  );
}
