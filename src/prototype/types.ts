import type { AvatarTone, Tone } from "@/components/ui";

export type Visibility = "private" | "circles" | "public";
export type ProfileField = "avatar" | "about" | "city" | "interests" | "skills";

export type Person = {
  id: string;
  nickname: string;
  tone: AvatarTone;
  about: string;
  city: string;
  interests: string[];
  skills: string[];
  visibility: Record<ProfileField, Visibility>;
  finishedCircles: number;
  /** Вымышленный демо-персонаж (не живой человек) */
  demo?: boolean;
};

export type Topic =
  | "Программирование"
  | "Языки"
  | "Дизайн"
  | "Экзамены"
  | "Карьера"
  | "Привычки"
  | "Локальные дела";

export type Circle = {
  id: string;
  title: string;
  goal: string;
  description: string;
  topic: Topic;
  tags: string[];
  capacity: number;
  weeks: number;
  startDate: string; // YYYY-MM-DD
  joinMode: "open" | "approval";
  ownerId: string;
  /** Участники в порядке вступления */
  members: string[];
  status: "open" | "closed";
  createdAt: string;
};

export type JoinRequest = {
  id: string;
  circleId: string;
  userId: string;
  message: string;
  status: "pending" | "approved" | "rejected" | "withdrawn";
  createdAt: string;
};

export type Step = {
  id: string;
  circleId: string;
  authorId: string;
  week: number;
  body: string;
  createdAt: string;
  support: string[]; // кто нажал «Держись»
  useful: string[]; // кто нажал «Полезно»
  /** Сколько реакций было в демо-данных до нас (вымышленные люди) */
  baseSupport: number;
  baseUseful: number;
};

export type Comment = {
  id: string;
  stepId: string;
  authorId: string;
  body: string;
  createdAt: string;
};

export type ChatMessage = {
  id: string;
  circleId: string;
  authorId: string;
  body: string;
  createdAt: string;
};

export type ReportReason = "spam" | "abuse" | "fraud" | "personal" | "inappropriate" | "other";

export type Report = {
  id: string;
  targetType: "step" | "comment" | "message" | "user";
  targetId: string;
  reason: ReportReason;
  createdAt: string;
};

export type NotificationType = "requests" | "replies" | "newSteps" | "reminders" | "circleEnd" | "news";

export type AppNotification = {
  id: string;
  type: NotificationType;
  text: string;
  link: string; // якорь, куда вести
  createdAt: string;
  read: boolean;
};

export type NotificationSettings = {
  prefs: Record<NotificationType, { inApp: boolean; email: boolean }>;
  quietHours: boolean;
  digest: boolean;
  allOff: boolean;
};

export type DemoState = {
  version: 1;
  meId: string | null;
  people: Record<string, Person>;
  circles: Circle[];
  requests: JoinRequest[];
  steps: Step[];
  comments: Comment[];
  messages: ChatMessage[];
  reports: Report[];
  blocks: string[]; // кого заблокировал я
  revealed: string[]; // скрытое по жалобе, которое я решил показать
  mutedCircles: string[];
  notifications: AppNotification[];
  notificationSettings: NotificationSettings;
};

export type TopicMeta = { name: Topic; tone: Tone };
