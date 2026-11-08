import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Подключение к Supabase из браузера.
 * Публичный (publishable) ключ не секретный: что кому можно — решают правила RLS в базе.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isConfigured = Boolean(url && key);

let client: SupabaseClient | null = null;
export function sb(): SupabaseClient {
  if (!client) {
    if (!url || !key) throw new Error("Supabase не настроен");
    client = createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: "soobsha-auth" },
    });
  }
  return client;
}

export type Result<T = void> = { ok: true; data: T } | { ok: false; error: string };

/** Понятное сообщение об ошибке на русском. */
export function humanError(e: { message?: string; code?: string } | null | undefined): string {
  if (!e) return "Что-то пошло не так";
  const m = e.message ?? "";
  if (e.code === "P0001") return m;
  if (/Failed to fetch|NetworkError|fetch failed|Load failed/i.test(m)) return "Нет соединения с сервером. Проверьте интернет и повторите.";
  if (/duplicate key.*nickname|profiles_nickname_key/i.test(m)) return "Этот никнейм уже занят — выберите другой";
  if (/duplicate key.*reports/i.test(m)) return "Вы уже жаловались на это";
  if (/violates check constraint/i.test(m)) return "Проверьте введённые данные: что-то слишком длинное или в неверном формате";
  if (/row-level security|permission denied/i.test(m)) return "Недостаточно прав для этого действия";
  if (/JWT|session/i.test(m)) return "Сессия истекла — войдите снова";
  return "Не получилось: " + m;
}

export async function run<T>(p: PromiseLike<{ data: unknown; error: { message: string; code?: string } | null }>): Promise<Result<T>> {
  try {
    const { data, error } = await p;
    if (error) return { ok: false, error: humanError(error) };
    return { ok: true, data: data as T };
  } catch (e) {
    return { ok: false, error: humanError(e as Error) };
  }
}
