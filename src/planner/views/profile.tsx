"use client";

import { useEffect, useState } from "react";
import { BanIcon, DotsIcon, EditIcon, FlagIcon, LockIcon, SettingsIcon, UsersIcon } from "@/components/icons";
import { Avatar, Button, ButtonLink, Chip, EmptyState, IconButton, avatarToneList, type AvatarTone } from "@/components/ui";
import { useAccount } from "../auth";
import { api } from "../data";
import { useFeedback } from "../feedback";
import { looksLikeContacts } from "../logic";
import { ActionMenu, ContactWarning, Field, ReportDialog, TagInput, TextArea, TextInput } from "../parts";
import { go } from "../router";
import { Page, PageTitle } from "../shell";
import type { MyProfile, PublicProfile, Visibility } from "../types";

type FieldKey = "avatar" | "about" | "city" | "interests" | "skills";
const VIS: { value: Visibility; label: string; icon: typeof LockIcon }[] = [
  { value: "private", label: "Только я", icon: LockIcon },
  { value: "circles", label: "Участники моих кругов", icon: UsersIcon },
];
const LABEL: Record<FieldKey, string> = { avatar: "Цвет аватара", about: "О себе", city: "Город", interests: "Интересы", skills: "Навыки" };

function Card({ p, show }: { p: { nickname: string; tone: AvatarTone; about: string; city: string; interests: string[]; skills: string[] }; show: (f: FieldKey) => boolean }) {
  const any = (show("about") && p.about) || (show("city") && p.city) || (show("interests") && p.interests.length) || (show("skills") && p.skills.length);
  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col items-center gap-3 rounded-[28px] border border-line bg-surface p-6 text-center shadow-card">
        <Avatar letter={p.nickname[0]} tone={show("avatar") ? p.tone : "surface"} size={88} />
        <h2 className="font-display text-2xl font-medium tracking-[-0.03em]">@{p.nickname}</h2>
        {show("city") && p.city && <p className="text-sm font-medium text-ink-3">{p.city}</p>}
        {show("about") && p.about && <p className="max-w-[460px] text-[15px] leading-[1.55] text-ink-2">{p.about}</p>}
      </section>
      {show("interests") && p.interests.length > 0 && (
        <section className="rounded-3xl border border-line bg-surface p-5">
          <h3 className="mb-3 text-xs font-semibold tracking-[0.06em] text-ink-3 uppercase">Интересы</h3>
          <div className="flex flex-wrap gap-2">
            {p.interests.map((t) => (
              <Chip key={t} tone="lilac">
                {t}
              </Chip>
            ))}
          </div>
        </section>
      )}
      {show("skills") && p.skills.length > 0 && (
        <section className="rounded-3xl border border-line bg-surface p-5">
          <h3 className="mb-3 text-xs font-semibold tracking-[0.06em] text-ink-3 uppercase">Умею и помогу</h3>
          <div className="flex flex-wrap gap-2">
            {p.skills.map((t) => (
              <Chip key={t} tone="coral">
                {t}
              </Chip>
            ))}
          </div>
        </section>
      )}
      {!any && <p className="rounded-3xl border border-dashed border-line bg-surface/60 p-5 text-center text-[15px] text-ink-2">Больше ничего не открыто для просмотра.</p>}
    </div>
  );
}

const visOf = (me: MyProfile, f: FieldKey) => me[`vis_${f}` as const];

export function MyProfileView() {
  const { me } = useAccount();
  const [as, setAs] = useState<"me" | "circles">("me");
  const show = (f: FieldKey) => (as === "me" ? true : visOf(me!, f) !== "private");
  const empty = !me!.about && !me!.city && !me!.interests.length && !me!.skills.length;
  return (
    <Page narrow>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="font-display text-[30px] leading-[1.1] font-medium tracking-[-0.045em] md:text-[40px]">Мой профиль</h1>
        <div className="flex gap-2">
          <ButtonLink href="#settings" variant="secondary" size="sm" aria-label="Настройки">
            <SettingsIcon size={18} />
            <span className="hidden sm:inline">Настройки</span>
          </ButtonLink>
          <ButtonLink href="#profile-edit" size="sm">
            <EditIcon size={18} /> Редактировать
          </ButtonLink>
        </div>
      </div>
      <fieldset className="mb-5">
        <legend className="mb-2 text-sm font-semibold text-ink-2">Посмотреть, как видят профиль</legend>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["me", "Я сам"],
              ["circles", "Участник моего круга"],
            ] as const
          ).map(([v, l]) => (
            <button key={v} type="button" aria-pressed={as === v} className="cursor-pointer rounded-full" onClick={() => setAs(v)}>
              <Chip tone={as === v ? "ink" : "outline"}>{l}</Chip>
            </button>
          ))}
        </div>
      </fieldset>
      {empty && as === "me" ? (
        <EmptyState title="Профиль пока пустой" text="Пара слов о себе помогает участникам кругов. Всё закрыто, пока вы сами не откроете." icon={<EditIcon />}>
          <ButtonLink href="#profile-edit">Заполнить профиль</ButtonLink>
        </EmptyState>
      ) : (
        <Card p={me!} show={show} />
      )}
      <p className="mt-4 text-center text-sm text-ink-3">Люди без общего круга с вами ваш профиль не видят вообще.</p>
    </Page>
  );
}

type VisState = Record<FieldKey, Visibility>;

function VisPicker({ field, vis, setVis }: { field: FieldKey; vis: VisState; setVis: (f: (x: VisState) => VisState) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label={`Кто видит: ${LABEL[field]}`}>
      {VIS.map((v) => (
        <button
          key={v.value}
          type="button"
          role="radio"
          aria-checked={vis[field] === v.value}
          onClick={() => setVis((x) => ({ ...x, [field]: v.value }))}
          className={`flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold ${
            vis[field] === v.value ? (v.value === "private" ? "bg-ink text-surface" : "bg-mint text-forest-700 ring-1 ring-forest/40") : "bg-paper text-ink-2"
          }`}
        >
          <v.icon size={14} />
          {v.label}
        </button>
      ))}
    </div>
  );
}

function Block({ field, vis, setVis, children }: { field: FieldKey; vis: VisState; setVis: (f: (x: VisState) => VisState) => void; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-5" data-testid={`block-${field}`}>
      {children}
      <div className="flex flex-col gap-1.5 border-t border-line pt-3">
        <span className="text-xs font-semibold tracking-[0.04em] text-ink-3 uppercase">Кто видит</span>
        <VisPicker field={field} vis={vis} setVis={setVis} />
      </div>
    </section>
  );
}

export function ProfileEditView() {
  const { me, saveProfile } = useAccount();
  const { toast } = useFeedback();
  const [about, setAbout] = useState(me!.about);
  const [city, setCity] = useState(me!.city);
  const [interests, setInterests] = useState(me!.interests);
  const [skills, setSkills] = useState(me!.skills);
  const [tone, setTone] = useState<AvatarTone>(me!.tone);
  const [vis, setVis] = useState<VisState>({ avatar: me!.vis_avatar, about: me!.vis_about, city: me!.vis_city, interests: me!.vis_interests, skills: me!.vis_skills });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (about.length > 300) return setError("«О себе» — не больше 300 символов");
    if (looksLikeContacts(about)) {
      setError("Уберите контакты из «О себе»: общение — только внутри круга");
      return toast("Уберите контакты из «О себе»", "error");
    }
    setBusy(true);
    const r = await saveProfile({
      about: about.trim(),
      city: city.trim(),
      interests,
      skills,
      tone,
      vis_avatar: vis.avatar,
      vis_about: vis.about,
      vis_city: vis.city,
      vis_interests: vis.interests,
      vis_skills: vis.skills,
    });
    setBusy(false);
    if (!r.ok) {
      setError(r.error);
      return toast(r.error, "error");
    }
    toast("Профиль сохранён", "success");
    go("#profile");
  };

  return (
    <Page narrow>
      <PageTitle title="Редактировать профиль" fallback="#profile" />
      <div className="mb-5 flex items-start gap-3 rounded-3xl bg-mint p-4 text-sm text-forest-700">
        <LockIcon size={18} className="mt-0.5 shrink-0" />
        По умолчанию каждое поле видите только вы. Откройте нужные поля для участников ваших кругов — посторонние профиль не видят никогда.
      </div>
      <div className="flex flex-col gap-4">
        <section className="flex items-center gap-4 rounded-3xl border border-line bg-surface p-5">
          <Avatar letter={me!.nickname[0]} tone={tone} size={64} />
          <div>
            <p className="font-display text-lg font-medium">@{me!.nickname}</p>
            <p className="text-[13px] text-ink-3">Никнейм видят участники ваших кругов</p>
          </div>
        </section>
        <Block vis={vis} setVis={setVis} field="avatar">
          <span className="text-[15px] font-semibold">Цвет аватара</span>
          <div className="flex gap-2.5" role="radiogroup" aria-label="Цвет аватара">
            {avatarToneList.map((t) => (
              <button key={t} type="button" role="radio" aria-checked={tone === t} aria-label={t} onClick={() => setTone(t)} className={`cursor-pointer rounded-full ${tone === t ? "ring-2 ring-forest ring-offset-2 ring-offset-surface" : ""}`}>
                <Avatar letter={me!.nickname[0]} tone={t} size={40} />
              </button>
            ))}
          </div>
        </Block>
        <Block vis={vis} setVis={setVis} field="about">
          <Field id="about" label="О себе">
            <TextArea id="about" max={300} value={about} onChange={(e) => setAbout(e.target.value)} placeholder="Чем занимаетесь, чем можете помочь" />
          </Field>
          <ContactWarning text={about} />
        </Block>
        <Block vis={vis} setVis={setVis} field="city">
          <Field id="city" label="Город (необязательно)" hint="Только город — без адреса и района">
            <TextInput id="city" value={city} maxLength={60} onChange={(e) => setCity(e.target.value)} placeholder="Например, Казань" />
          </Field>
        </Block>
        <Block vis={vis} setVis={setVis} field="interests">
          <Field id="interests" label="Интересы" hint="До 10">
            <TagInput id="interests" value={interests} onChange={setInterests} placeholder="Например: Python" />
          </Field>
        </Block>
        <Block vis={vis} setVis={setVis} field="skills">
          <Field id="skills" label="Умею и помогу" hint="До 10">
            <TagInput id="skills" value={skills} onChange={setSkills} placeholder="Например: Excel" />
          </Field>
        </Block>
        {error && (
          <p className="text-sm font-medium text-danger" role="alert">
            {error}
          </p>
        )}
        <div className="sticky bottom-20 z-10 flex gap-2.5 rounded-3xl bg-paper/90 py-2 backdrop-blur md:bottom-4">
          <Button variant="secondary" className="flex-1" onClick={() => go("#profile")}>
            Отмена
          </Button>
          <Button className="flex-1" onClick={save} disabled={busy}>
            {busy ? "Сохраняем…" : "Сохранить"}
          </Button>
        </div>
      </div>
    </Page>
  );
}

export function UserProfileView({ id }: { id: string }) {
  const { me, blocks, block, unblock } = useAccount();
  const { toast, confirm } = useFeedback();
  const [p, setP] = useState<PublicProfile | null | undefined>(undefined);
  const [menu, setMenu] = useState(false);
  const [report, setReport] = useState(false);
  const isMe = me?.id === id;

  useEffect(() => {
    if (isMe) {
      go("#profile");
      return;
    }
    api.getProfile(id).then((r) => setP(r.ok ? r.data : null));
  }, [id, isMe]);

  if (isMe) return null;
  if (p === undefined)
    return (
      <Page narrow>
        <div className="h-64 animate-pulse rounded-[28px] bg-surface/70" aria-busy="true" />
      </Page>
    );
  if (p === null)
    return (
      <Page narrow>
        <PageTitle title="Профиль" fallback="#my" />
        <EmptyState title="Профиль недоступен" text="Профили видны только тем, с кем у вас есть общий круг." icon={<LockIcon />} />
      </Page>
    );

  const blocked = blocks.includes(p.id);
  const doBlock = async () => {
    if (!(await confirm({ title: `Заблокировать @${p.nickname}?`, text: "Вы перестанете видеть его комментарии и сообщения. Снять блокировку можно в настройках.", confirmLabel: "Заблокировать", danger: true }))) return;
    const r = await block(p.id);
    toast(r.ok ? `@${p.nickname} заблокирован` : r.error, r.ok ? "success" : "error");
  };

  return (
    <Page narrow>
      <PageTitle
        title={`@${p.nickname}`}
        fallback="#my"
        sub={p.shares_circle ? "У вас есть общий круг" : undefined}
        action={
          <IconButton label="Действия с профилем" onClick={() => setMenu(true)}>
            <DotsIcon />
          </IconButton>
        }
      />
      {blocked ? (
        <EmptyState title="Вы заблокировали этого пользователя" text="Его комментарии и сообщения скрыты." icon={<BanIcon />}>
          <Button
            variant="secondary"
            onClick={async () => {
              await unblock(p.id);
              toast(`@${p.nickname} разблокирован`, "info");
            }}
          >
            Разблокировать
          </Button>
        </EmptyState>
      ) : (
        <Card p={p} show={() => true} />
      )}
      {menu && (
        <ActionMenu
          title={`@${p.nickname}`}
          onClose={() => setMenu(false)}
          items={[
            { label: "Пожаловаться", icon: <FlagIcon size={20} />, onSelect: () => setReport(true) },
            blocked
              ? { label: "Разблокировать", icon: <BanIcon size={20} />, onSelect: async () => (await unblock(p.id), toast(`@${p.nickname} разблокирован`, "info")) }
              : { label: "Заблокировать", icon: <BanIcon size={20} />, danger: true, onSelect: doBlock },
          ]}
        />
      )}
      {report && <ReportDialog title="Пожаловаться на пользователя" subtitle={`@${p.nickname}`} targetType="user" targetId={p.id} authorId={p.id} authorNick={p.nickname} onClose={() => setReport(false)} />}
    </Page>
  );
}

