import { ArrowRightIcon } from "./icons";
import { plural } from "@/lib/format";
import { AvatarStack, Chip, WeekBar, type AvatarTone, type Tone } from "./ui";

export type CircleSummary = {
  id: string;
  title: string;
  description: string;
  topic: string;
  topicTone: Tone;
  weeks: number;
  startLabel: string;
  joinMode: "open" | "approval";
  members: { letter: string; tone: AvatarTone }[];
  capacity: number;
};

export function CircleCard({ circle }: { circle: CircleSummary }) {
  const free = circle.capacity - circle.members.length;
  return (
    <article className="group relative flex flex-col gap-4 rounded-[28px] border border-line bg-surface p-6 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <Chip tone={circle.topicTone}>{circle.topic}</Chip>
        <span className="text-[13px] font-medium text-ink-3">
          {circle.joinMode === "approval" ? "по заявке" : "открытый"}
        </span>
      </div>

      <h3 className="font-display text-xl leading-[1.3] font-medium tracking-[-0.01em]">
        {/* Страница круга появится на этапе разработки — пока без ссылки, чтобы не вести в пустоту. */}
        {circle.title}
      </h3>
      <p className="text-[15px] leading-[1.55] text-ink-2">{circle.description}</p>

      <div className="flex items-center gap-3">
        <WeekBar total={circle.weeks} done={0} current={-1} className="w-20" />
        <span className="text-[13px] font-medium whitespace-nowrap text-ink-2">
          {circle.weeks} нед. · старт {circle.startLabel}
        </span>
      </div>

      <div className="mt-auto flex items-center gap-3 border-t border-line pt-4">
        <AvatarStack people={circle.members.slice(0, 4)} size={36} />
        <span className="text-sm font-medium">
          {circle.members.length} из {circle.capacity}
          {free > 0 ? ` · ${free} ${plural(free, "место", "места", "мест")}` : " · мест нет"}
        </span>
        <span className="ml-auto flex size-10 items-center justify-center rounded-full bg-mint text-forest">
          <ArrowRightIcon size={18} />
        </span>
      </div>
    </article>
  );
}
