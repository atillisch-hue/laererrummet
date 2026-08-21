import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function normalizeRoles(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") return [value];
  return [];
}

async function getAdmin(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return { error: "Ikke logget ind.", status: 401 };
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) return { error: "Serveren mangler Supabase-konfiguration.", status: 500 };
  const admin = createClient(url, service, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await admin.auth.getUser(authHeader.slice(7));
  if (error || !data.user) return { error: "Sessionen kunne ikke bekræftes.", status: 401 };
  const roles = [...new Set([
    ...normalizeRoles(data.user.app_metadata?.roles), ...normalizeRoles(data.user.app_metadata?.role),
    ...normalizeRoles(data.user.user_metadata?.roles), ...normalizeRoles(data.user.user_metadata?.role),
  ])];
  if (!roles.includes("admin")) return { error: "Kun administratorer kan ændre brugere.", status: 403 };
  return { admin, me: data.user };
}

export async function PATCH(req: Request) {
  try {
    const access = await getAdmin(req);
    if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });
    const body = await req.json();
    const id = String(body.id || "");
    if (!id) return NextResponse.json({ error: "Bruger mangler." }, { status: 400 });
    const attrs: any = {};
    if (Array.isArray(body.roles)) {
      const allowed = ["teacher", "parent", "board", "admin"];
      const roles = [...new Set(body.roles.filter((r: string) => allowed.includes(r)))];
      if (!roles.length) return NextResponse.json({ error: "Brugeren skal have mindst én rolle." }, { status: 400 });
      if (id === access.me.id && !roles.includes("admin")) return NextResponse.json({ error: "Du kan ikke fjerne din egen admin-rolle." }, { status: 400 });
      attrs.app_metadata = { roles, role: roles[0] };
      attrs.user_metadata = { roles, role: roles[0] };
    }
    if (body.password !== undefined) {
      const password = String(body.password || "");
      if (password.length < 8) return NextResponse.json({ error: "Adgangskoden skal være mindst 8 tegn." }, { status: 400 });
      attrs.password = password;
    }
    if (body.disabled !== undefined) attrs.ban_duration = body.disabled ? "876000h" : "none";
    const { error } = await access.admin.auth.admin.updateUserById(id, attrs);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Brugeren kunne ikke ændres." }, { status: 500 }); }
}

export async function DELETE(req: Request) {
  try {
    const access = await getAdmin(req);
    if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "Bruger mangler." }, { status: 400 });
    if (String(id) === access.me.id) return NextResponse.json({ error: "Du kan ikke slette din egen konto." }, { status: 400 });
    const { error } = await access.admin.auth.admin.deleteUser(String(id));
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Brugeren kunne ikke slettes." }, { status: 500 }); }
}
