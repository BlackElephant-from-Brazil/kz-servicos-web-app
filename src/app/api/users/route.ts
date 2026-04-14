import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.json();
    const { full_name, email, phone, cpf, role, date_of_birth } = body;

    if (!full_name || !email || !role) {
      return NextResponse.json(
        { error: "Campos obrigatórios: full_name, email, role" },
        { status: 400 }
      );
    }

    // 1. Create user in Supabase Auth
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { full_name },
      });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    // 2. Insert profile into public.users
    const { data, error } = await supabaseAdmin
      .from("users")
      .insert({
        id: authData.user.id,
        full_name,
        email,
        phone: phone || null,
        cpf: cpf || null,
        role,
        date_of_birth: date_of_birth || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      // Rollback: delete auth user if public.users insert fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
