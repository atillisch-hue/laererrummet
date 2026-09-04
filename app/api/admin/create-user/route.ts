import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const allowedRoles = ["teacher", "staff", "leader", "parent", "board", "admin"];
const staffRoles = new Set<string>(["teacher", "staff", "leader", "admin"]);
const personnelGroups = new Set(["teacher", "pedagogue", "substitute", "administration", "other"]);

function normalizeAbbreviation(value: unknown) {
  return String(value || "").trim().toUpperCase();
}

function primaryRole(roles: string[]) {
  for (const role of ["admin", "leader", "teacher", "staff", "board", "parent"]) if (roles.includes(role)) return role;
  return roles[0] || "staff";
}

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
    const requested: unknown[] = Array.isArray(body.roles) ? body.roles : [];
    const newRoles: string[] = Array.from(new Set<string>(requested.filter((r): r is string => typeof r === "string" && allowedRoles.includes(r))));
    const isStaff = newRoles.some(role => staffRoles.has(role));
    const displayName = String(body.display_name || "").trim();
    const abbreviation = normalizeAbbreviation(body.abbreviation);
    const personnelGroup = String(body.personnel_group || "teacher");
    const hasStaffIdentity = Boolean(displayName || abbreviation || body.personnel_group);

    if (!email || password.length < 8 || !newRoles.length) {
      return NextResponse.json({ error: "Udfyld mail, mindst én rolle og en adgangskode på mindst 8 tegn." }, { status: 400 });
    }
    if (isStaff && hasStaffIdentity) {
      if (!displayName) return NextResponse.json({ error: "Medarbejderen skal have et navn." }, { status: 400 });
      if (abbreviation.length < 2 || abbreviation.length > 4 || /\s/.test(abbreviation)) {
        return NextResponse.json({ error: "Forkortelsen skal være 2–4 tegn uden mellemrum." }, { status: 400 });
      }
      if (!personnelGroups.has(personnelGroup)) {
        return NextResponse.json({ error: "Ugyldig personalegruppe." }, { status: 400 });
      }
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

    if (isStaff && hasStaffIdentity) {
      const { data: duplicate } = await admin
        .from("staff_directory_profiles")
        .select("user_id")
        .eq("school_id", schoolId)
        .ilike("abbreviation", abbreviation)
        .limit(1);
      if (duplicate?.length) return NextResponse.json({ error: `Forkortelsen ${abbreviation} bruges allerede på skolen.` }, { status: 409 });
    }

    const primary = primaryRole(newRoles);
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { roles: newRoles, role: primary },
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

    const { error: roleCacheError } = await admin.from("user_roles").upsert(newRoles.map(role => ({ user_id: userId, role })), { onConflict: "user_id,role" });
    const profilePatch: Record<string, unknown> = { role: primary, active: true };
    if (displayName) profilePatch.display_name = displayName;
    const { error: profileError } = await admin.from("user_profiles").update(profilePatch).eq("user_id", userId);

    if (isStaff && hasStaffIdentity) {
      const { error: staffProfileError } = await admin.from("staff_directory_profiles").insert({
        school_id: schoolId,
        user_id: userId,
        abbreviation,
        personnel_group: personnelGroup
      });
      if (staffProfileError) {
        await admin.auth.admin.deleteUser(userId);
        const duplicate = staffProfileError.code === "23505";
        return NextResponse.json({ error: duplicate ? `Forkortelsen ${abbreviation} bruges allerede på skolen.` : "Personaleprofilen kunne ikke oprettes." }, { status: duplicate ? 409 : 500 });
      }
    }

    if (roleCacheError || profileError) {
      await admin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: "Brugerens profil kunne ikke færdiggøres." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: userId, email: data.user.email });
  } catch {
    return NextResponse.json({ error: "Brugeren kunne ikke oprettes." }, { status: 500 });
  }
}
