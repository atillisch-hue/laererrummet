import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return NextResponse.json({ error: "Ikke logget ind." }, { status: 401 });
    const token = authHeader.slice(7);
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!service) return NextResponse.json({ error: "Serveren mangler SUPABASE_SERVICE_ROLE_KEY." }, { status: 500 });

    const viewer = createClient(url, anon);
    const { data: me, error: meError } = await viewer.auth.getUser(token);
    if (meError || !me.user) return NextResponse.json({ error: "Sessionen kunne ikke bekræftes." }, { status: 401 });
    const rawRoles = me.user.app_metadata?.roles;
    const roles = Array.isArray(rawRoles) ? rawRoles : (me.user.app_metadata?.role ? [me.user.app_metadata.role] : []);
    if (!roles.includes("admin")) return NextResponse.json({ error: "Kun administratorer kan oprette brugere." }, { status: 403 });

    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const requested = Array.isArray(body.roles) ? body.roles : [];
    const allowed = ["teacher", "parent", "admin"];
    const newRoles = requested.filter((r: string) => allowed.includes(r));
    if (!email || password.length < 8 || !newRoles.length) return NextResponse.json({ error: "Udfyld mail, mindst én rolle og en adgangskode på mindst 8 tegn." }, { status: 400 });

    const admin = createClient(url, service, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { roles: newRoles, role: newRoles[0] }
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, id: data.user.id, email: data.user.email });
  } catch {
    return NextResponse.json({ error: "Brugeren kunne ikke oprettes." }, { status: 500 });
  }
}
