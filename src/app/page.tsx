import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Stock Intelligence</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          거시경제 + 지정학 기반 AI 투자 가이드
        </p>
      </div>
      <p className="text-muted-foreground max-w-md text-center text-sm">
        글로벌 거시경제 지표와 지정학적 리스크를 종합 분석하여, 근거 있는 투자
        가이드를 제공합니다.
      </p>
      <div className="flex gap-4">
        <Button asChild>
          <Link href="/auth/login">로그인</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/auth/signup">회원가입</Link>
        </Button>
      </div>
      <p className="text-muted-foreground text-xs">
        본 서비스는 투자 참고 정보이며, 투자 판단의 최종 책임은 본인에게
        있습니다.
      </p>
    </div>
  );
}
