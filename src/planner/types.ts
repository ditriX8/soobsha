import type { AvatarTone } from "@/components/ui";

export type Visibility = "private" | "circles" | "public";

export type MyProfile = {
  id: string;
  nickname: string;
  tone: AvatarTone;
  about: string;
  city: string;
  interests: string[];
  skills: string[];
  vis_avatar: Visibility;
  vis_about: Visibility;
  vis_city: Visibility;
  vis_interests: Visibility;
  vis_skills: Visibility;
};

/** Профиль другого человека — только разрешённые поля (из get_profiles). */
export type PublicProfile = {
  id: string;
  nickname: string;
  tone: AvatarTone;
  about: string;
  city: string;
  interests: string[];
  skills: string[];
  shares_circle: boolean;
};

export type Circle = {
  id: string;
  owner_id: string;
  title: string;
  goal: string;
  description: string;
  start_date: string;
  deadline: string;
  capacity: number;
  chat_enabled: boolean;
  status: "active" | "closed";
  created_at: string;
};

export type Member = { circle_id: string; user_id: string; role: "owner" | "member"; joined_at: string };

export type Task = {
  id: string;
  circle_id: string;
  title: string;
  notes: string;
  due_date: string | null;
  assignee_id: string | null;
  status: "todo" | "done";
  pinned: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  completed_by: string | null;
};

export type TaskComment = { id: string; task_id: string; circle_id: string; author_id: string; body: string; created_at: string };
export type Message = { id: string; circle_id: string; author_id: string; body: string; created_at: string };
export type Activity = { id: number; circle_id: string; actor_id: string | null; kind: string; title: string; created_at: string };
export type Invite = { id: string; circle_id: string; code: string; expires_at: string; max_uses: number | null; uses: number; revoked_at: string | null; created_at: string };
export type AppNotification = { id: number; kind: string; text: string; circle_id: string | null; task_id: string | null; read_at: string | null; created_at: string };
export type NotificationSettings = { user_id: string; assigned: boolean; comments: boolean; joins: boolean; done: boolean; all_off: boolean };

export type ReportReason = "spam" | "abuse" | "fraud" | "personal" | "inappropriate" | "other";
export type ReportTarget = "task" | "comment" | "message" | "user";
