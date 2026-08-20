import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function normalizeRoles(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") return [value];
  return [];
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Ikke logget ind." }, { status: 401 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !service) {
      return NextResponse.json({ error: "Serveren mangler Supabase-konfiguration." }, { status: 500 });
    }

    const admin = createClient(url, service, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: authData, error: authError } = await admin.auth.getUser(authHeader.slice(7));
    const user = authData.user;
    if (authError || !user) {
      return NextResponse.json({ error: "Sessionen kunne ikke bekræftes." }, { status: 401 });
    }

    const roles = [...new Set([
      ...normalizeRoles(user.app_metadata?.roles),
      ...normalizeRoles(user.app_metadata?.role),
      ...normalizeRoles(user.user_metadata?.roles),
      ...normalizeRoles(user.user_metadata?.role),
    ])];
    if (!roles.includes("parent")) {
      return NextResponse.json({ error: "Forældreadgang kræves." }, { status: 403 });
    }

    const { data: links, error: linkError } = await admin
      .from("parent_students")
      .select("student_id")
      .eq("parent_id", user.id);
    if (linkError) return NextResponse.json({ error: linkError.message }, { status: 400 });

    const ids = (links || []).map((x: any) => Number(x.student_id)).filter(Number.isFinite);
    if (!ids.length) return NextResponse.json({ children: [] });

    const { data: students, error: studentError } = await admin
      .from("students")
      .select("id,name,class_id")
      .in("id", ids)
      .order("name");
    if (studentError) return NextResponse.json({ error: studentError.message }, { status: 400 });

    const classIds = [...new Set((students || []).map((s: any) => s.class_id).filter((x: any) => x !== null))];
    let classNames = new Map<number, string>();
    if (classIds.length) {
      const { data: classes, error: classError } = await admin.from("classes").select("id,name").in("id", classIds);
      if (classError) return NextResponse.json({ error: classError.message }, { status: 400 });
      classNames = new Map((classes || []).map((c: any) => [Number(c.id), String(c.name)]));
    }

    return NextResponse.json({
      children: (students || []).map((s: any) => ({
        id: Number(s.id),
        name: String(s.name),
        class_id: s.class_id === null ? null : Number(s.class_id),
        class_name: s.class_id === null ? null : classNames.get(Number(s.class_id)) || null,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Forældrekoblingen kunne ikke hentes." }, { status: 500 });
  }
}
