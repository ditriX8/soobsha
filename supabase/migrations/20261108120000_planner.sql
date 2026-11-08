-- «Сообща» v2 — совместный планер для маленьких групп.
-- Главная защита — RLS: каждая таблица отдаёт строки только тем, кому их можно видеть.
-- Сложные действия (вступить по коду, выйти, удалить участника) — функциями базы,
-- чтобы они выполнялись целиком и с проверкой прав.

create extension if not exists citext with schema extensions;

create schema if not exists private;
grant usage on schema private to authenticated;

-- ============================================================
-- Профили
-- ============================================================
create type public.visibility as enum ('private', 'circles', 'public');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname extensions.citext not null unique check (nickname ~ '^[A-Za-z0-9_]{3,20}$'),
  tone text not null default 'lilac' check (tone in ('coral', 'sun', 'lilac', 'mint', 'surface')),
  about text not null default '' check (char_length(about) <= 300),
  city text not null default '' check (char_length(city) <= 60),
  interests text[] not null default '{}' check (cardinality(interests) <= 10),
  skills text[] not null default '{}' check (cardinality(skills) <= 10),
  vis_avatar public.visibility not null default 'private',
  vis_about public.visibility not null default 'private',
  vis_city public.visibility not null default 'private',
  vis_interests public.visibility not null default 'private',
  vis_skills public.visibility not null default 'private',
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- Свою строку видит и меняет только владелец. Другим профили отдаёт функция get_profiles (с учётом видимости полей).
create policy profiles_select_own on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy profiles_insert_own on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- ============================================================
-- Круги и участники
-- ============================================================
create table public.circles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id),
  title text not null check (char_length(btrim(title)) between 3 and 80),
  goal text not null default '' check (char_length(goal) <= 200),
  description text not null default '' check (char_length(description) <= 1000),
  start_date date not null default current_date,
  deadline date not null,
  capacity int not null default 8 check (capacity between 2 and 12),
  chat_enabled boolean not null default true,
  status text not null default 'active' check (status in ('active', 'closed')),
  created_at timestamptz not null default now(),
  check (deadline >= start_date)
);
create index circles_owner_idx on public.circles (owner_id);
alter table public.circles enable row level security;

create table public.circle_members (
  circle_id uuid not null references public.circles (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (circle_id, user_id)
);
create index circle_members_user_idx on public.circle_members (user_id);
alter table public.circle_members enable row level security;

-- Ссылка на Telegram — отдельная таблица, чтобы её видели только участники.
create table public.circle_private (
  circle_id uuid primary key references public.circles (id) on delete cascade,
  telegram_url text check (telegram_url is null or telegram_url ~ '^https://t\.me/[A-Za-z0-9_+/-]{3,64}$')
);
alter table public.circle_private enable row level security;

-- Вспомогательные проверки (security definer — без рекурсии RLS). Схема private не доступна через API.
create function private.is_member(c uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.circle_members m where m.circle_id = c and m.user_id = (select auth.uid()));
$$;

create function private.is_owner(c uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.circles x where x.id = c and x.owner_id = (select auth.uid()) and x.status = 'active');
$$;

create function private.shares_circle(other uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.circle_members a
    join public.circle_members b on a.circle_id = b.circle_id
    join public.circles c on c.id = a.circle_id and c.status = 'active'
    where a.user_id = (select auth.uid()) and b.user_id = other
  );
$$;

revoke all on function private.is_member(uuid), private.is_owner(uuid), private.shares_circle(uuid) from public, anon;
grant execute on function private.is_member(uuid), private.is_owner(uuid), private.shares_circle(uuid) to authenticated;

create policy circles_select_member on public.circles for select to authenticated using ((select private.is_member(id)));
-- Создаются через create_circle(); менять название, цель, срок и т. п. может создатель.
create policy circles_update_owner on public.circles for update to authenticated
  using ((select private.is_owner(id))) with check (owner_id = (select auth.uid()));

create policy members_select on public.circle_members for select to authenticated using ((select private.is_member(circle_id)));

create policy private_select on public.circle_private for select to authenticated using ((select private.is_member(circle_id)));
create policy private_update on public.circle_private for update to authenticated using ((select private.is_owner(circle_id))) with check ((select private.is_owner(circle_id)));

-- ============================================================
-- Приглашения
-- ============================================================
create table public.invites (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles (id) on delete cascade,
  code text not null unique check (code ~ '^[A-Z2-9]{8}$'),
  created_by uuid not null references public.profiles (id) on delete cascade,
  expires_at timestamptz not null default now() + interval '7 days',
  max_uses int check (max_uses is null or max_uses between 1 and 50),
  uses int not null default 0,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index invites_circle_idx on public.invites (circle_id);
alter table public.invites enable row level security;
-- Коды видит только создатель круга. Вступление — через join_by_code().
create policy invites_select_owner on public.invites for select to authenticated using ((select private.is_owner(circle_id)));

-- Попытки ввода кода — против перебора.
create table private.join_attempts (
  user_id uuid not null,
  created_at timestamptz not null default now()
);
create index join_attempts_idx on private.join_attempts (user_id, created_at);

-- ============================================================
-- Задачи и комментарии
-- ============================================================
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  notes text not null default '' check (char_length(notes) <= 2000),
  due_date date,
  assignee_id uuid references public.profiles (id) on delete set null,
  status text not null default 'todo' check (status in ('todo', 'done')),
  pinned boolean not null default false,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  completed_by uuid references public.profiles (id) on delete set null
);
create index tasks_circle_idx on public.tasks (circle_id);
create index tasks_assignee_idx on public.tasks (assignee_id);
create index tasks_created_by_idx on public.tasks (created_by);
create index tasks_completed_by_idx on public.tasks (completed_by);
alter table public.tasks enable row level security;

create policy tasks_select on public.tasks for select to authenticated using ((select private.is_member(circle_id)));
create policy tasks_insert on public.tasks for insert to authenticated
  with check ((select private.is_member(circle_id)) and created_by = (select auth.uid()));
-- Тонкие правила (кто что может менять) — в триггере tasks_guard.
create policy tasks_update on public.tasks for update to authenticated
  using ((select private.is_member(circle_id))) with check ((select private.is_member(circle_id)));
create policy tasks_delete on public.tasks for delete to authenticated
  using ((select private.is_member(circle_id)) and (created_by = (select auth.uid()) or (select private.is_owner(circle_id))));

create table public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  circle_id uuid not null references public.circles (id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index task_comments_task_idx on public.task_comments (task_id);
create index task_comments_circle_idx on public.task_comments (circle_id);
create index task_comments_author_idx on public.task_comments (author_id);
alter table public.task_comments enable row level security;
create policy comments_select on public.task_comments for select to authenticated using ((select private.is_member(circle_id)));
create policy comments_insert on public.task_comments for insert to authenticated
  with check ((select private.is_member(circle_id)) and author_id = (select auth.uid()));
create policy comments_delete on public.task_comments for delete to authenticated
  using (author_id = (select auth.uid()) or (select private.is_owner(circle_id)));

-- ============================================================
-- Чат круга
-- ============================================================
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles (id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index messages_circle_idx on public.messages (circle_id, created_at desc);
create index messages_author_idx on public.messages (author_id);
alter table public.messages enable row level security;
create policy messages_select on public.messages for select to authenticated using ((select private.is_member(circle_id)));
create policy messages_insert on public.messages for insert to authenticated
  with check (
    (select private.is_member(circle_id)) and author_id = (select auth.uid())
    and exists (select 1 from public.circles c where c.id = circle_id and c.chat_enabled)
  );
create policy messages_delete on public.messages for delete to authenticated
  using (author_id = (select auth.uid()) or (select private.is_owner(circle_id)));

-- ============================================================
-- Лента событий круга, уведомления, блокировки, жалобы
-- ============================================================
create table public.activity (
  id bigint generated always as identity primary key,
  circle_id uuid not null references public.circles (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  kind text not null,
  title text not null default '',
  created_at timestamptz not null default now()
);
create index activity_circle_idx on public.activity (circle_id, created_at desc);
create index activity_actor_idx on public.activity (actor_id);
alter table public.activity enable row level security;
create policy activity_select on public.activity for select to authenticated using ((select private.is_member(circle_id)));

create table public.notification_settings (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  assigned boolean not null default true,
  comments boolean not null default true,
  joins boolean not null default true,
  done boolean not null default false,
  all_off boolean not null default false
);
alter table public.notification_settings enable row level security;
create policy ns_select on public.notification_settings for select to authenticated using (user_id = (select auth.uid()));
create policy ns_insert on public.notification_settings for insert to authenticated with check (user_id = (select auth.uid()));
create policy ns_update on public.notification_settings for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create table public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,
  text text not null,
  circle_id uuid references public.circles (id) on delete cascade,
  task_id uuid references public.tasks (id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);
create index notifications_circle_idx on public.notifications (circle_id);
create index notifications_task_idx on public.notifications (task_id);
alter table public.notifications enable row level security;
create policy notif_select on public.notifications for select to authenticated using (user_id = (select auth.uid()));
create policy notif_update on public.notifications for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy notif_delete on public.notifications for delete to authenticated using (user_id = (select auth.uid()));

create table public.blocks (
  blocker_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index blocks_blocked_idx on public.blocks (blocked_id);
alter table public.blocks enable row level security;
create policy blocks_select on public.blocks for select to authenticated using (blocker_id = (select auth.uid()));
create policy blocks_insert on public.blocks for insert to authenticated with check (blocker_id = (select auth.uid()));
create policy blocks_delete on public.blocks for delete to authenticated using (blocker_id = (select auth.uid()));

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  target_type text not null check (target_type in ('task', 'comment', 'message', 'user')),
  target_id uuid not null,
  reason text not null check (reason in ('spam', 'abuse', 'fraud', 'personal', 'inappropriate', 'other')),
  status text not null default 'open' check (status in ('open', 'actioned', 'dismissed')),
  created_at timestamptz not null default now(),
  unique (reporter_id, target_type, target_id)
);
alter table public.reports enable row level security;
create policy reports_select on public.reports for select to authenticated using (reporter_id = (select auth.uid()));
create policy reports_insert on public.reports for insert to authenticated with check (reporter_id = (select auth.uid()));

-- ============================================================
-- Защита от спама: не больше N записей в минуту от одного человека
-- ============================================================
create function private.rate_limit() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  n int;
  lim int := coalesce(tg_argv[0]::int, 20);
begin
  execute format('select count(*) from %I.%I where %I = $1 and created_at > now() - interval ''1 minute''',
                 tg_table_schema, tg_table_name, tg_argv[1])
    into n using (select auth.uid());
  if n >= lim then
    raise exception 'Слишком часто. Подождите минуту.' using errcode = 'P0001';
  end if;
  return new;
end $$;

create trigger tasks_rate before insert on public.tasks for each row execute function private.rate_limit('30', 'created_by');
create trigger comments_rate before insert on public.task_comments for each row execute function private.rate_limit('20', 'author_id');
create trigger messages_rate before insert on public.messages for each row execute function private.rate_limit('20', 'author_id');
create trigger reports_rate before insert on public.reports for each row execute function private.rate_limit('10', 'reporter_id');

-- ============================================================
-- Уведомления и лента событий (пишутся триггерами)
-- ============================================================
create function private.notify(target uuid, k text, t text, c uuid, tsk uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare s public.notification_settings;
begin
  if target is null or target = (select auth.uid()) then return; end if;
  select * into s from public.notification_settings where user_id = target;
  if found and (s.all_off
      or (k = 'assigned' and not s.assigned)
      or (k = 'comment' and not s.comments)
      or (k = 'join' and not s.joins)
      or (k = 'done' and not s.done)) then
    return;
  end if;
  insert into public.notifications (user_id, kind, text, circle_id, task_id) values (target, k, t, c, tsk);
end $$;

create function private.nick(u uuid) returns text
language sql stable security definer set search_path = '' as $$
  select coalesce((select '@' || nickname::text from public.profiles where id = u), 'кто-то');
$$;

-- Правила изменения задач + журнал + уведомления
create function private.tasks_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := (select auth.uid());
  owner boolean;
  editor boolean;
  pinned_count int;
begin
  if new.circle_id <> old.circle_id or (new.created_by is distinct from old.created_by and new.created_by is not null) then
    raise exception 'Нельзя переносить задачу между кругами' using errcode = 'P0001';
  end if;
  select (c.owner_id = me) into owner from public.circles c where c.id = old.circle_id;
  editor := owner or me = old.created_by or me = old.assignee_id;

  -- Название, описание, срок: создатель задачи, ответственный или создатель круга
  if (new.title, new.notes, new.due_date) is distinct from (old.title, old.notes, old.due_date) and not editor then
    raise exception 'Менять задачу могут её автор, ответственный или создатель круга' using errcode = 'P0001';
  end if;
  -- Ответственного: редакторы; любой может «взять себе» свободную задачу
  if new.assignee_id is distinct from old.assignee_id then
    if not (editor or (old.assignee_id is null and new.assignee_id = me)) then
      raise exception 'Назначать ответственного могут автор задачи или создатель круга' using errcode = 'P0001';
    end if;
    if new.assignee_id is not null and not exists (
      select 1 from public.circle_members m where m.circle_id = new.circle_id and m.user_id = new.assignee_id) then
      raise exception 'Ответственный должен быть участником круга' using errcode = 'P0001';
    end if;
  end if;
  -- Отметка выполнения: ответственный, создатель круга, а у свободной задачи — любой участник
  if new.status <> old.status then
    if not (owner or me = old.assignee_id or old.assignee_id is null) then
      raise exception 'Отметить выполнение может ответственный или создатель круга' using errcode = 'P0001';
    end if;
    if new.status = 'done' then
      new.completed_at := now();
      new.completed_by := me;
    else
      new.completed_at := null;
      new.completed_by := null;
    end if;
  else
    new.completed_at := old.completed_at;
    -- null приходит, когда удалили аккаунт того, кто выполнил (ON DELETE SET NULL)
    new.completed_by := case when new.completed_by is null then null else old.completed_by end;
  end if;
  -- Закрепление: только создатель круга, не больше 5
  if new.pinned <> old.pinned then
    if not owner then
      raise exception 'Закреплять задачи может только создатель круга' using errcode = 'P0001';
    end if;
    if new.pinned then
      select count(*) into pinned_count from public.tasks where circle_id = new.circle_id and pinned and id <> new.id;
      if pinned_count >= 5 then
        raise exception 'Закрепить можно не больше 5 задач' using errcode = 'P0001';
      end if;
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger tasks_guard before update on public.tasks for each row execute function private.tasks_guard();

create function private.tasks_check_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.status := 'todo';
  new.completed_at := null;
  new.completed_by := null;
  if new.pinned and not exists (select 1 from public.circles c where c.id = new.circle_id and c.owner_id = (select auth.uid())) then
    new.pinned := false;
  end if;
  if new.assignee_id is not null and not exists (
    select 1 from public.circle_members m where m.circle_id = new.circle_id and m.user_id = new.assignee_id) then
    raise exception 'Ответственный должен быть участником круга' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger tasks_check_insert before insert on public.tasks for each row execute function private.tasks_check_insert();

create function private.tasks_after() returns trigger
language plpgsql security definer set search_path = '' as $$
declare me uuid := (select auth.uid());
begin
  if tg_op = 'INSERT' then
    insert into public.activity (circle_id, actor_id, kind, title) values (new.circle_id, me, 'task_created', new.title);
    perform private.notify(new.assignee_id, 'assigned', private.nick(me) || ' назначил(а) вам задачу «' || new.title || '»', new.circle_id, new.id);
  elsif tg_op = 'UPDATE' then
    if new.status = 'done' and old.status <> 'done' then
      insert into public.activity (circle_id, actor_id, kind, title) values (new.circle_id, me, 'task_done', new.title);
      perform private.notify(new.created_by, 'done', private.nick(me) || ' выполнил(а) задачу «' || new.title || '»', new.circle_id, new.id);
    end if;
    if new.assignee_id is distinct from old.assignee_id and new.assignee_id is not null then
      perform private.notify(new.assignee_id, 'assigned', private.nick(me) || ' назначил(а) вам задачу «' || new.title || '»', new.circle_id, new.id);
    end if;
  end if;
  return null;
end $$;
create trigger tasks_after after insert or update on public.tasks for each row execute function private.tasks_after();

create function private.comments_after() returns trigger
language plpgsql security definer set search_path = '' as $$
declare t public.tasks; me uuid := (select auth.uid());
begin
  select * into t from public.tasks where id = new.task_id;
  if t.circle_id <> new.circle_id then
    raise exception 'Комментарий не к этому кругу' using errcode = 'P0001';
  end if;
  perform private.notify(t.assignee_id, 'comment', private.nick(me) || ' прокомментировал(а) «' || t.title || '»', t.circle_id, t.id);
  if t.created_by is distinct from t.assignee_id then
    perform private.notify(t.created_by, 'comment', private.nick(me) || ' прокомментировал(а) «' || t.title || '»', t.circle_id, t.id);
  end if;
  return null;
end $$;
create trigger comments_after after insert on public.task_comments for each row execute function private.comments_after();

-- ============================================================
-- Функции для приложения (вызываются через API)
-- ============================================================

-- Профили других людей — только разрешённые поля.
-- «Мои круги» = общий активный круг; «Все» = любой вошедший пользователь.
create function public.get_profiles(ids uuid[])
returns table (id uuid, nickname text, tone text, about text, city text, interests text[], skills text[], shares_circle boolean)
language sql stable security definer set search_path = '' as $$
  select p.id, p.nickname::text,
    case when p.id = me.uid or p.vis_avatar = 'public' or (p.vis_avatar = 'circles' and sc.shares) then p.tone else 'surface' end,
    case when p.id = me.uid or p.vis_about = 'public' or (p.vis_about = 'circles' and sc.shares) then p.about else '' end,
    case when p.id = me.uid or p.vis_city = 'public' or (p.vis_city = 'circles' and sc.shares) then p.city else '' end,
    case when p.id = me.uid or p.vis_interests = 'public' or (p.vis_interests = 'circles' and sc.shares) then p.interests else '{}' end,
    case when p.id = me.uid or p.vis_skills = 'public' or (p.vis_skills = 'circles' and sc.shares) then p.skills else '{}' end,
    sc.shares
  from public.profiles p
  cross join (select (select auth.uid()) as uid) me
  cross join lateral (select private.shares_circle(p.id) as shares) sc
  where me.uid is not null
    and p.id = any(ids)
    and cardinality(ids) <= 100
    -- никнейм виден только тем, с кем есть общий круг (или себе)
    and (p.id = me.uid or sc.shares)
    and not exists (select 1 from public.blocks b where b.blocker_id = p.id and b.blocked_id = me.uid);
$$;

create function public.create_circle(p_title text, p_goal text, p_description text, p_deadline date, p_capacity int, p_telegram text)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare me uuid := (select auth.uid()); cid uuid; n int;
begin
  if me is null then raise exception 'Нужно войти' using errcode = 'P0001'; end if;
  if not exists (select 1 from public.profiles where id = me) then raise exception 'Сначала создайте профиль' using errcode = 'P0001'; end if;
  select count(*) into n from public.circles where owner_id = me and created_at > now() - interval '1 hour';
  if n >= 10 then raise exception 'Слишком много кругов за час' using errcode = 'P0001'; end if;
  insert into public.circles (owner_id, title, goal, description, deadline, capacity)
    values (me, btrim(p_title), btrim(coalesce(p_goal, '')), btrim(coalesce(p_description, '')), p_deadline, coalesce(p_capacity, 8))
    returning id into cid;
  insert into public.circle_members (circle_id, user_id, role) values (cid, me, 'owner');
  insert into public.circle_private (circle_id, telegram_url) values (cid, nullif(btrim(coalesce(p_telegram, '')), ''));
  insert into public.activity (circle_id, actor_id, kind, title) values (cid, me, 'circle_created', btrim(p_title));
  return cid;
end $$;

create function public.create_invite(p_circle uuid, p_days int default 7, p_max_uses int default null)
returns text
language plpgsql security definer set search_path = '' as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  c text;
begin
  if not private.is_owner(p_circle) then raise exception 'Приглашать может только создатель круга' using errcode = 'P0001'; end if;
  if p_days not between 1 and 30 then raise exception 'Срок приглашения — от 1 до 30 дней' using errcode = 'P0001'; end if;
  loop
    c := '';
    for i in 1..8 loop
      c := c || substr(alphabet, 1 + (get_byte(extensions.gen_random_bytes(1), 0) % 32), 1);
    end loop;
    exit when not exists (select 1 from public.invites where code = c);
  end loop;
  insert into public.invites (circle_id, code, created_by, expires_at, max_uses)
    values (p_circle, c, (select auth.uid()), now() + make_interval(days => p_days), p_max_uses);
  return c;
end $$;

create function public.revoke_invite(p_invite uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.invites set revoked_at = now()
   where id = p_invite and private.is_owner(circle_id) and revoked_at is null;
end $$;

create function private.normalize_code(raw text) returns text
language sql immutable set search_path = '' as $$
  select upper(regexp_replace(coalesce(raw, ''), '[^A-Za-z0-9]', '', 'g'));
$$;

create function private.check_attempts() returns void
language plpgsql security definer set search_path = '' as $$
declare n int; me uuid := (select auth.uid());
begin
  select count(*) into n from private.join_attempts where user_id = me and created_at > now() - interval '10 minutes';
  if n >= 20 then raise exception 'Слишком много попыток. Подождите 10 минут.' using errcode = 'P0001'; end if;
  insert into private.join_attempts (user_id) values (me);
end $$;

-- Что за круг по коду (до вступления): название, цель, создатель, число участников.
create function public.preview_invite(p_code text)
returns table (circle_id uuid, title text, goal text, owner_nickname text, members int, capacity int, already_member boolean, problem text)
language plpgsql security definer set search_path = '' as $$
declare inv public.invites; c public.circles; cnt int;
begin
  if (select auth.uid()) is null then raise exception 'Нужно войти' using errcode = 'P0001'; end if;
  perform private.check_attempts();
  select * into inv from public.invites i where i.code = private.normalize_code(p_code);
  if not found then
    return query select null::uuid, null::text, null::text, null::text, 0, 0, false, 'Приглашение не найдено. Проверьте код.'::text;
    return;
  end if;
  select * into c from public.circles x where x.id = inv.circle_id;
  select count(*) into cnt from public.circle_members m where m.circle_id = c.id;
  return query select c.id, c.title, c.goal, (select p.nickname::text from public.profiles p where p.id = c.owner_id), cnt, c.capacity,
    private.is_member(c.id),
    case
      when c.status <> 'active' then 'Круг закрыт.'
      when inv.revoked_at is not null then 'Приглашение отозвано создателем.'
      when inv.expires_at < now() then 'Срок приглашения истёк. Попросите новое.'
      when inv.max_uses is not null and inv.uses >= inv.max_uses then 'Приглашение уже использовано.'
      when cnt >= c.capacity then 'В круге нет свободных мест.'
      when exists (select 1 from public.blocks b where b.blocker_id = c.owner_id and b.blocked_id = (select auth.uid())) then 'Вступить нельзя.'
      else null
    end;
end $$;

create function public.join_by_code(p_code text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare me uuid := (select auth.uid()); inv public.invites; c public.circles; cnt int;
begin
  if me is null then raise exception 'Нужно войти' using errcode = 'P0001'; end if;
  if not exists (select 1 from public.profiles where id = me) then raise exception 'Сначала создайте профиль' using errcode = 'P0001'; end if;
  perform private.check_attempts();
  select * into inv from public.invites where code = private.normalize_code(p_code) for update;
  if not found then raise exception 'Приглашение не найдено. Проверьте код.' using errcode = 'P0001'; end if;
  select * into c from public.circles where id = inv.circle_id for update;
  if exists (select 1 from public.circle_members where circle_id = c.id and user_id = me) then return c.id; end if;
  if c.status <> 'active' then raise exception 'Круг закрыт.' using errcode = 'P0001'; end if;
  if inv.revoked_at is not null then raise exception 'Приглашение отозвано создателем.' using errcode = 'P0001'; end if;
  if inv.expires_at < now() then raise exception 'Срок приглашения истёк. Попросите новое.' using errcode = 'P0001'; end if;
  if inv.max_uses is not null and inv.uses >= inv.max_uses then raise exception 'Приглашение уже использовано.' using errcode = 'P0001'; end if;
  select count(*) into cnt from public.circle_members where circle_id = c.id;
  if cnt >= c.capacity then raise exception 'В круге нет свободных мест.' using errcode = 'P0001'; end if;
  if exists (select 1 from public.blocks b where b.blocker_id = c.owner_id and b.blocked_id = me) then
    raise exception 'Вступить нельзя.' using errcode = 'P0001';
  end if;
  insert into public.circle_members (circle_id, user_id, role) values (c.id, me, 'member');
  update public.invites set uses = uses + 1 where id = inv.id;
  insert into public.activity (circle_id, actor_id, kind, title) values (c.id, me, 'member_joined', '');
  perform private.notify(c.owner_id, 'join', private.nick(me) || ' вступил(а) в круг «' || c.title || '»', c.id, null);
  return c.id;
end $$;

create function public.leave_circle(p_circle uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare me uuid := (select auth.uid()); c public.circles; heir uuid;
begin
  select * into c from public.circles where id = p_circle for update;
  if not found or not exists (select 1 from public.circle_members where circle_id = p_circle and user_id = me) then
    raise exception 'Вы не участник этого круга' using errcode = 'P0001';
  end if;
  delete from public.circle_members where circle_id = p_circle and user_id = me;
  update public.tasks set assignee_id = null where circle_id = p_circle and assignee_id = me and status = 'todo';
  insert into public.activity (circle_id, actor_id, kind, title) values (p_circle, me, 'member_left', '');
  if c.owner_id = me then
    select user_id into heir from public.circle_members where circle_id = p_circle order by joined_at limit 1;
    if heir is null then
      update public.circles set status = 'closed' where id = p_circle;
      update public.invites set revoked_at = now() where circle_id = p_circle and revoked_at is null;
      return 'closed';
    end if;
    update public.circles set owner_id = heir where id = p_circle;
    update public.circle_members set role = 'owner' where circle_id = p_circle and user_id = heir;
    return 'transferred';
  end if;
  return 'left';
end $$;

create function public.remove_member(p_circle uuid, p_user uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_owner(p_circle) then raise exception 'Удалять участников может только создатель' using errcode = 'P0001'; end if;
  if p_user = (select auth.uid()) then raise exception 'Чтобы уйти самому, используйте «Выйти из круга»' using errcode = 'P0001'; end if;
  delete from public.circle_members where circle_id = p_circle and user_id = p_user;
  update public.tasks set assignee_id = null where circle_id = p_circle and assignee_id = p_user and status = 'todo';
  insert into public.activity (circle_id, actor_id, kind, title) values (p_circle, (select auth.uid()), 'member_removed', '');
end $$;

-- Удаление аккаунта: все данные пользователя удаляются каскадом.
create function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
declare me uuid := (select auth.uid()); r record;
begin
  if me is null then raise exception 'Нужно войти' using errcode = 'P0001'; end if;
  for r in select circle_id from public.circle_members where user_id = me loop
    perform public.leave_circle(r.circle_id);
  end loop;
  -- круги, где пользователь был создателем и которые закрылись, больше никому не нужны
  delete from public.circles where owner_id = me and status = 'closed';
  delete from auth.users where id = me;
end $$;

revoke all on function public.get_profiles(uuid[]), public.create_circle(text, text, text, date, int, text), public.create_invite(uuid, int, int),
  public.revoke_invite(uuid), public.preview_invite(text), public.join_by_code(text), public.leave_circle(uuid),
  public.remove_member(uuid, uuid), public.delete_my_account() from public, anon;
grant execute on function public.get_profiles(uuid[]), public.create_circle(text, text, text, date, int, text), public.create_invite(uuid, int, int),
  public.revoke_invite(uuid), public.preview_invite(text), public.join_by_code(text), public.leave_circle(uuid),
  public.remove_member(uuid, uuid), public.delete_my_account() to authenticated;

-- Права на таблицы: anon (без входа) не получает ничего.
revoke all on all tables in schema public from anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
-- Поля, которые клиент не должен подменять напрямую
revoke update on public.circles from authenticated;
grant update (title, goal, description, deadline, capacity, chat_enabled) on public.circles to authenticated;
revoke insert, update, delete on public.circle_members, public.invites, public.activity, public.notifications from authenticated;
grant update (read_at) on public.notifications to authenticated;
grant delete on public.notifications to authenticated;
revoke update, delete on public.reports from authenticated;
revoke insert, update, delete on public.circle_private from authenticated;
grant update (telegram_url) on public.circle_private to authenticated;
revoke insert, delete on public.circles from authenticated;

-- ============================================================
-- Синхронизация в реальном времени
-- ============================================================
alter publication supabase_realtime add table
  public.circles, public.circle_members, public.circle_private, public.tasks,
  public.task_comments, public.messages, public.activity, public.notifications;
