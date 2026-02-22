"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function mapAuthError(message: string): string {
  if (message.includes("Invalid login credentials")) {
    return "이메일 또는 비밀번호가 올바르지 않습니다.";
  }
  if (message.includes("Email not confirmed")) {
    return "이메일 인증이 완료되지 않았습니다. 메일함을 확인해주세요.";
  }
  if (message.includes("User already registered")) {
    return "이미 가입된 이메일입니다.";
  }
  if (message.includes("Password should be at least")) {
    return "비밀번호는 최소 8자 이상이어야 합니다.";
  }
  if (message.includes("Unable to validate email")) {
    return "유효한 이메일 주소를 입력해주세요.";
  }
  return message;
}

export type AuthState = {
  error: string | null;
};

export async function signIn(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: mapAuthError(error.message) };
  }

  // SUSPENDED 사용자 체크
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("status")
      .eq("id", user.id)
      .returns<{ status: string }[]>()
      .single();

    if (profile?.status === "SUSPENDED") {
      await supabase.auth.signOut();
      return { error: "계정이 정지되었습니다. 관리자에게 문의하세요." };
    }

    // last_login 갱신
    await supabase
      .from("user_profiles")
      .update({ last_login: new Date().toISOString() } as never)
      .eq("id", user.id);
  }

  redirect("/dashboard");
}

export async function signUp(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (password !== confirmPassword) {
    return { error: "비밀번호가 일치하지 않습니다." };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${appUrl}/auth/callback`,
    },
  });

  if (error) {
    return { error: mapAuthError(error.message) };
  }

  // user_profiles 행은 DB 트리거(handle_new_user)가 자동 생성
  redirect("/auth/signup?confirmed=pending");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}
