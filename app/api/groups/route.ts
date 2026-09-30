import { getDb } from "@/db";
import { cleanName, jsonError, newId, serverError } from "@/lib/group-store";
import { cors, OPTIONS } from "@/lib/cors";

export { OPTIONS };

export const POST = cors(async function post(request: Request) {
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return jsonError("入力内容を確認してください。", 400); }
  const title = cleanName(body.title, 80);
  const names = Array.isArray(body.names) ? body.names.map((name) => cleanName(name)).filter(Boolean) : [];
  if (!title || names.length < 2 || names.length > 30 || new Set(names).size !== names.length) return jsonError("グループ名と重複しない参加者名を2人以上入力してください。", 400);
  const id = newId();
  const now = Date.now();
  try {
    const db = getDb();
    await db.batch([
      db.prepare("INSERT INTO groups (id, title, created_at) VALUES (?, ?, ?)").bind(id, title, now),
      ...names.map((name, index) => db.prepare("INSERT INTO members (id, group_id, name, created_at) VALUES (?, ?, ?, ?)").bind(newId(), id, name, now + index)),
    ]);
    return Response.json({ id }, { status: 201 });
  } catch (error) { return serverError(error); }
});
