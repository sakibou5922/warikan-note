import { getDb } from "@/db";
import { cleanName, getGroup, jsonError, newId, serverError } from "@/lib/group-store";
import { cors, OPTIONS } from "@/lib/cors";

export { OPTIONS };

type Context = { params: Promise<{ id: string }> };

export const GET = cors(async function get(_request: Request, context: Context) {
  try {
    const group = await getGroup((await context.params).id);
    return group ? Response.json(group, { headers: { "Cache-Control": "no-store" } }) : jsonError("グループが見つかりません。", 404);
  } catch (error) { return serverError(error); }
});

export const POST = cors(async function post(request: Request, context: Context) {
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return jsonError("入力内容を確認してください。", 400); }
  try {
    const group = await getGroup((await context.params).id);
    if (!group) return jsonError("グループが見つかりません。", 404);
    if (body.type !== "member") return jsonError("操作を確認してください。", 400);
    const name = cleanName(body.name);
    if (!name || group.members.length >= 30 || group.members.some((member) => member.name === name)) return jsonError("参加者名を確認してください。同じ名前は登録できません。", 400);
    await getDb().prepare("INSERT INTO members (id, group_id, name, created_at) VALUES (?, ?, ?, ?)").bind(newId(), group.id, name, Date.now()).run();
    return Response.json({ ok: true });
  } catch (error) { return serverError(error); }
});
