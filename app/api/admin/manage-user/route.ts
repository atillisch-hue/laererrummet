import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const allowed = ["teacher", "parent", "board", "admin"];

async function getAdmin(req: Request, body: any) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return { error: "Ikke logget ind.", status: 401 } as const;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) return { error: "Serveren mangler Supabase-konfiguration.", status: 500 } as const;

  const admin = createClient(url, service, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await admin.auth.getUser(authHeader.slice(7));
  if (error || !data.user) return { error: "Sessionen kunne ikke bekræftes.", status: 401 } as const;

  const requestedSchoolId = Number(body.school_id || 0);
  let q = admin.from("school_memberships").select("school_id").eq("user_id", data.user.id).eq("role", "admin").eq("active", true);
  if (requestedSchoolId) q = q.eq("school_id", requestedSchoolId);
  const { data: memberships, error: membershipError } = await q.limit(1);
  if (membershipError) return { error: "Skoleadgangen kunne ikke bekræftes.", status: 500 } as const;
  const schoolId = requestedSchoolId || memberships?.[0]?.school_id;
  if (!schoolId || !memberships?.length) return { error: "Kun administratorer på skolen kan ændre brugere.", status: 403 } as const;

  return { admin, me: data.user, schoolId };
}

async function verifyTarget(admin: any, schoolId: number, userId: string) {
  const { data, error } = await admin.from("school_memberships").select("id").eq("school_id", schoolId).eq("user_id", userId).limit(1);
  return !error && Boolean(data?.length);
}

async function syncRoleCaches(admin: any, userId: string) {
  const { data: memberships } = await admin.from("school_memberships").select("role").eq("user_id", userId).eq("active", true);
  const roles = [...new Set((memberships || []).map((m: any) => String(m.role)).filter((r: string) => allowed.includes(r)))];
  if (!roles.length) return;

  await admin.auth.admin.updateUserById(userId, { app_metadata: { roles, role: roles[0] } });
  await admin.from("user_roles").delete().eq("user_id", userId);
  await admin.from("user_roles").insert(roles.map(role => ({ user_id: userId, role })));
  await admin.from("user_profiles").update({ role: roles[0] }).eq("user_id", userId);
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const access = await getAdmin(req, body);
    if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });

    const id = String(body.id || "");
    if (!id) return NextResponse.json({ error: "Bruger mangler." }, { status: 400 });
    if (!(await verifyTarget(access.admin, access.schoolId, id))) return NextResponse.json({ error: "Brugeren tilhører ikke den skole, du administrerer." }, { status: 403 });

    if (Array.isArray(body.roles)) {
      const roles = [...new Set(body.roles.filter((r: string) => allowed.includes(r)))];
      if (!roles.length) return NextResponse.json({ error: "Brugeren skal have mindst én rolle." }, { status: 400 });
      if (id === access.me.id && !roles.includes("admin")) return NextResponse.json({ error: "Du kan ikke fjerne din egen admin-rolle." }, { status: 400 });

      const { error: deleteError } = await access.admin.from("school_memberships").delete().eq("school_id", access.schoolId).eq("user_id", id);
      if (deleteError) return NextResponse.json({ error: "De gamle roller kunne ikke fjernes." }, { status: 500 });

      const { error: insertError } = await access.admin.from("school_memberships").insert(roles.map(role => ({ school_id: access.schoolId, user_id: id, role, active: true })));
      if (insertError) return NextResponse.json({ error: "De nye roller kunne ikke gemmes." }, { status: 500 });

      await syncRoleCaches(access.admin, id);
    }

    if (body.password !== undefined) {
      const password = String(body.password || "");
      if (password.length < 8) return NextResponse.json({ error: "Adgangskoden skal være mindst 8 tegn." }, { status: 400 });
      const { error } = await access.admin.auth.admin.updateUserById(id, { password });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (body.disabled !== undefined) {
      const { error } = await access.admin.auth.admin.updateUserById(id, { ban_duration: body.disabled ? "876000h" : "none" });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Brugeren kunne ikke ændres." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const access = await getAdmin(req, body);
    if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });

    const id = String(body.id || "");
    if (!id) return NextResponse.json({ error: "Bruger mangler." }, { status: 400 });
    if (id === access.me.id) return NextResponse.json({ error: "Du kan ikke slette din egen konto." }, { status: 400 });
    if (!(await verifyTarget(access.admin, access.schoolId, id))) return NextResponse.json({ error: "Brugeren tilhører ikke den skole, du administrerer." }, { status: 403 });

    const { error } = await access.admin.auth.admin.deleteUser(id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Brugeren kunne ikke slettes." }, { status: 500 });
  }
}
