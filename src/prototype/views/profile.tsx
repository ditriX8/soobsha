"use client";

import { useEffect, useState } from "react";
import { BanIcon, DotsIcon, EditIcon, FlagIcon, GlobeIcon, InfoIcon, LockIcon, SettingsIcon, UsersIcon } from "@/components/icons";
import { Avatar, Button, ButtonLink, Chip, EmptyState, IconButton, avatarToneList, type AvatarTone } from "@/components/ui";
import { plural } from "@/lib/format";
import { useFeedback } from "../feedback";
import { canSeeField, shareCircle } from "../logic";
import { ActionMenu, ContactWarning, Field, ReportDialog, TagInput, TextArea, TextInput } from "../parts";
import { go } from "../router";
import { Page, PageTitle } from "../shell";
import { useStore } from "../store";
import type { DemoState, Person, ProfileField, Visibility } from "../types";

const VIS: { value: Visibility; label: string; icon: typeof LockIcon }[] = [
  { value: "private", label: "Только я", icon: LockIcon },
  { value: "circles", label: "Мои круги", icon: UsersIcon },
  { value: "public", label: "Все", icon: GlobeIcon },
];

const FIELD_LABEL: Record<ProfileField, string> = {
  avatar: "Цвет аватара",
  about: "О себе",
  city: "Город",
  interests: "Интересы",
  skills: "Навыки",
};

/** Карточка профиля — показывает только то, что разрешено зрителю. */
function ProfileCard({ person, allowed }: { person: Person; allowed: (f: ProfileField) => boolean }) {
  const any =
    (allowed("about") && !!person.about) || (allowed("city") && !!person.city) || (allowed("interests") && person.interests.length > 0) || (allowed("skills") && person.skills.length > 0);
  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col items-center gap-3 rounded-[28px] border border-line bg-surface p-6 text-center shadow-card">
        <Avatar letter={person.nickname[0]} tone={allowed("avatar") ? person.tone : "surface"} size={88} />
        <h2 className="font-display text-2xl font-medium tracking-[-0.03em]">@{person.nickname}</h2>
        {allowed("city") && person.city && <p className="text-sm font-medium text-ink-3">{person.city}</p>}
        {allowed("about") && person.about && <p className="max-w-[460px] text-[15px] leading-[1.55] text-ink-2">{person.about}</p>}
        <p className="rounded-full bg-paper px-4 py-2 text-sm font-medium">
          {person.finishedCircles} {plural(person.finishedCircles, "круг доведён", "круга доведено", "кругов доведено")} до конца
        </p>
      </section>
      {allowed("interests") && person.interests.length > 0 && (
        <section className="rounded-3xl border border-line bg-surface p-5">
          <h3 className="mb-3 text-xs font-semibold tracking-[0.06em] text-ink-3 uppercase">Интересы</h3>
          <div className="flex flex-wrap gap-2">
            {person.interests.map((t) => (
              <Chip key={t} tone="lilac">
                {t}
              </Chip>
            ))}
          </div>
        </section>
      )}
      {allowed("skills") && person.skills.length > 0 && (
        <section className="rounded-3xl border border-line bg-surface p-5">
          <h3 className="mb-3 text-xs font-semibold tracking-[0.06em] text-ink-3 uppercase">Умею и помогу</h3>
          <div className="flex flex-wrap gap-2">
            {person.skills.map((t) => (
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

/* ---------- Мой профиль ---------- */

export function MyProfileView() {
  const { me, state } = useStore();
  const [as, setAs] = useState<"me" | "circles" | "public">("me");
  const allowed = (f: ProfileField) => (as === "me" ? true : as === "circles" ? me!.visibility[f] !== "private" : me!.visibility[f] === "public");
  const empty = !me!.about && !me!.city && me!.interests.length === 0 && me!.skills.length === 0;
  const myCircles = state.circles.filter((c) => c.status === "open" && c.members.includes(me!.id)).length;

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
              ["public", "Любой пользователь"],
            ] as const
          ).map(([v, l]) => (
            <button key={v} type="button" aria-pressed={as === v} className="cursor-pointer rounded-full" onClick={() => setAs(v)}>
              <Chip tone={as === v ? "ink" : "outline"}>{l}</Chip>
            </button>
          ))}
        </div>
      </fieldset>

      {empty && as === "me" ? (
        <EmptyState title="Профиль пока пустой" text="Добавьте пару слов о себе, интересы и навыки — так проще найти свой круг. Всё закрыто, пока вы сами не откроете." icon={<EditIcon />}>
          <ButtonLink href="#profile-edit">Заполнить профиль</ButtonLink>
        </EmptyState>
      ) : (
        <ProfileCard person={me!} allowed={allowed} />
      )}
      <p className="mt-4 text-center text-sm text-ink-3">
        Вы в {myCircles} {plural(myCircles, "круге", "кругах", "кругах")} · email и контакты в профиле не показываются никогда
      </p>
    </Page>
  );
}

type VisState = Record<ProfileField, Visibility>;

function VisPicker({ field, vis, setVis }: { field: ProfileField; vis: VisState; setVis: (f: (x: VisState) => VisState) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label={`Кто видит: ${FIELD_LABEL[field]}`}>
      {VIS.map((v) => (
        <button
          key={v.value}
          type="button"
          role="radio"
          aria-checked={vis[field] === v.value}
          onClick={() => setVis((x) => ({ ...x, [field]: v.value }))}
          className={`flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold ${
            vis[field] === v.value ? (v.value === "public" ? "bg-sun-soft text-ink ring-1 ring-sun" : v.value === "circles" ? "bg-mint text-forest-700 ring-1 ring-forest/40" : "bg-ink text-surface") : "bg-paper text-ink-2"
          }`}
        >
          <v.icon size={14} />
          {v.label}
        </button>
      ))}
    </div>
  );
}

function Block({ field, vis, setVis, children }: { field: ProfileField; vis: VisState; setVis: (f: (x: VisState) => VisState) => void; children: React.ReactNode }) {
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

/* ---------- Редактирование ---------- */

export function ProfileEditView() {
  const { me, actions } = useStore();
  const { toast } = useFeedback();
  const [about, setAbout] = useState(me!.about);
  const [city, setCity] = useState(me!.city);
  const [interests, setInterests] = useState(me!.interests);
  const [skills, setSkills] = useState(me!.skills);
  const [tone, setTone] = useState<AvatarTone>(me!.tone);
  const [vis, setVis] = useState(me!.visibility);
  const [error, setError] = useState("");

  const save = () => {
    const r = actions.saveProfile({ about, city, interests, skills, tone, visibility: vis });
    if (!r.ok) {
      setError(r.error);
      toast(r.error, "error");
      return;
    }
    toast("Профиль сохранён", "success");
    go("#profile");
  };

  return (
    <Page narrow>
      <PageTitle title="Редактировать профиль" fallback="#profile" />
      <div className="mb-5 flex items-start gap-3 rounded-3xl bg-mint p-4 text-sm text-forest-700">
        <LockIcon size={18} className="mt-0.5 shrink-0" />
        По умолчанию каждое поле видите только вы. «Мои круги» — участники ваших кругов, «Все» — любой вошедший пользователь. Гостям профили не показываются.
      </div>

      <div className="flex flex-col gap-4">
        <section className="flex items-center gap-4 rounded-3xl border border-line bg-surface p-5">
          <Avatar letter={me!.nickname[0]} tone={tone} size={64} />
          <div>
            <p className="font-display text-lg font-medium">@{me!.nickname}</p>
            <p className="text-[13px] text-ink-3">Никнейм виден в кругах, где вы участвуете или куда подали заявку</p>
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
            <TextArea id="about" max={300} value={about} onChange={(e) => setAbout(e.target.value)} placeholder="Чем занимаетесь, чему учитесь, чем можете помочь" />
          </Field>
          <ContactWarning text={about} />
        </Block>

        <Block vis={vis} setVis={setVis} field="city">
          <Field id="city" label="Город (необязательно)" hint="Только город — без адреса и района">
            <TextInput id="city" value={city} maxLength={60} onChange={(e) => setCity(e.target.value)} placeholder="Например, Казань" />
          </Field>
        </Block>

        <Block vis={vis} setVis={setVis} field="interests">
          <Field id="interests" label="Интересы" hint="По ним подбираются круги. До 10.">
            <TagInput id="interests" value={interests} onChange={setInterests} placeholder="Например: Python" />
          </Field>
        </Block>

        <Block vis={vis} setVis={setVis} field="skills">
          <Field id="skills" label="Умею и помогу" hint="Навыки, которыми можете поделиться. До 10.">
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
          <Button className="flex-1" onClick={save}>
            Сохранить
          </Button>
        </div>
      </div>
    </Page>
  );
}

/* ---------- Чужой профиль ---------- */

export function UserProfileView({ id }: { id: string }) {
  const { state, me, actions } = useStore();
  const { toast, confirm } = useFeedback();
  const [menu, setMenu] = useState(false);
  const [report, setReport] = useState(false);
  const person = state.people[id];

  const isMe = !!me && id === me.id;
  useEffect(() => {
    if (isMe) go("#profile");
  }, [isMe]);
  if (isMe) return null;
  if (!person) {
    return (
      <Page narrow>
        <PageTitle title="Профиль" />
        <EmptyState title="Такого пользователя нет" icon={<InfoIcon />} />
      </Page>
    );
  }
  if (!me) {
    return (
      <Page narrow>
        <PageTitle title={`@${person.nickname}`} />
        <EmptyState title="Профили видят только вошедшие пользователи" text="Так мы защищаем участников от посторонних." icon={<LockIcon />}>
          <ButtonLink href="#login">Войти в демо</ButtonLink>
        </EmptyState>
      </Page>
    );
  }

  const blocked = state.blocks.includes(person.id);
  const common = shareCircle(state as DemoState, me.id, person.id);

  const doBlock = async () => {
    if (!(await confirm({ title: `Заблокировать @${person.nickname}?`, text: "Вы перестанете видеть его шаги, комментарии и сообщения, он не сможет вступить в ваши круги.", confirmLabel: "Заблокировать", danger: true }))) return;
    actions.block(person.id);
    toast(`@${person.nickname} заблокирован`, "success");
  };

  return (
    <Page narrow>
      <PageTitle
        title={`@${person.nickname}`}
        fallback="#my"
        sub={common ? "У вас есть общий круг" : "Общих кругов нет"}
        action={
          <IconButton label="Действия с профилем" onClick={() => setMenu(true)}>
            <DotsIcon />
          </IconButton>
        }
      />
      {person.demo && <p className="mb-4 rounded-2xl bg-lilac-soft px-4 py-2.5 text-sm">Демо-персонаж: вымышленный человек для примера.</p>}
      {blocked ? (
        <EmptyState title="Вы заблокировали этого пользователя" text="Его публикации скрыты, он не может вступить в ваши круги." icon={<BanIcon />}>
          <Button
            variant="secondary"
            onClick={() => {
              actions.unblock(person.id);
              toast(`@${person.nickname} разблокирован`, "info");
            }}
          >
            Разблокировать
          </Button>
        </EmptyState>
      ) : (
        <ProfileCard person={person} allowed={(f) => canSeeField(state, me.id, person, f)} />
      )}
      {menu && (
        <ActionMenu
          title={`@${person.nickname}`}
          onClose={() => setMenu(false)}
          items={[
            { label: "Пожаловаться", icon: <FlagIcon size={20} />, onSelect: () => setReport(true) },
            blocked
              ? {
                  label: "Разблокировать",
                  icon: <BanIcon size={20} />,
                  onSelect: () => {
                    actions.unblock(person.id);
                    toast(`@${person.nickname} разблокирован`, "info");
                  },
                }
              : { label: "Заблокировать", icon: <BanIcon size={20} />, danger: true, onSelect: doBlock },
          ]}
        />
      )}
      {report && <ReportDialog title="Пожаловаться на пользователя" subtitle={`@${person.nickname}`} targetType="user" targetId={person.id} authorId={person.id} onClose={() => setReport(false)} />}
    </Page>
  );
}
