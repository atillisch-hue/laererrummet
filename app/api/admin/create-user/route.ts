import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return NextResponse.json({ error: "Ikke logget ind." }, { status: 401 });

    const token = authHeader.slice(7);
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !service) return NextResponse.json({ error: "Serveren mangler Supabase-konfiguration." }, { status: 500 });

    const admin = createClient(url, service, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: me, error: meError } = await admin.auth.getUser(token);
    if (meError || !me.user) return NextResponse.json({ error: "Sessionen kunne ikke bekræftes." }, { status: 401 });

    const body = await req.json();
    const requestedSchoolId = Number(body.school_id || 0);
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const requested = Array.isArray(body.roles) ? body.roles : [];
    const allowed = ["teacher", "parent", "board", "admin"];
    const newRoles = [...new Set(requested.filter((r: string) => allowed.includes(r)))];

    if (!email || password.length < 8 || !newRoles.length) {
      return NextResponse.json({ error: "Udfyld mail, mindst én rolle og en adgangskode på mindst 8 tegn." }, { status: 400 });
    }

    let membershipQuery = admin
      .from("school_memberships")
      .select("school_id")
      .eq("user_id", me.user.id)
      .eq("role", "admin")
      .eq("active", true);
    if (requestedSchoolId) membershipQuery = membershipQuery.eq("school_id", requestedSchoolId);

    const { data: memberships, error: membershipError } = await membershipQuery.limit(1);
    if (membershipError) return NextResponse.json({ error: "Skoleadgangen kunne ikke bekræftes." }, { status: 500 });
    const schoolId = requestedSchoolId || memberships?.[0]?.school_id;
    if (!schoolId || !memberships?.length) return NextResponse.json({ error: "Kun administratorer på skolen kan oprette brugere." }, { status: 403 });

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { roles: newRoles, role: newRoles[0] },
      user_metadata: {}
    });
    if (error || !data.user) return NextResponse.json({ error: error?.message || "Brugeren kunne ikke oprettes." }, { status: 400 });

    const userId = data.user.id;
    const membershipRows = newRoles.map(role => ({ school_id: schoolId, user_id: userId, role, active: true }));
    const { error: membershipInsertError } = await admin.from("school_memberships").insert(membershipRows);
    if (membershipInsertError) {
      await admin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: "Brugeren blev ikke knyttet korrekt til skolen." }, { status: 500 });
    }

    await admin.from("user_roles").upsert(newRoles.map(role => ({ user_id: userId, role })), { onConflict: "user_id,role" });
    await admin.from("user_profiles").update({ role: newRoles[0], active: true }).eq("user_id", userId);

    return NextResponse.json({ ok: true, id: userId, email: data.user.email });
  } catch {
    return NextResponse.json({ error: "Brugeren kunne ikke oprettes." }, { status: 500 });
  }
}
