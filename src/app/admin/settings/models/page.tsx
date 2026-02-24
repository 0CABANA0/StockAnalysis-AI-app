import { Cpu } from "lucide-react";

import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { serverApiFetch } from "@/lib/api/client";
import { createClient } from "@/lib/supabase/server";
import type { ModelConfig } from "@/types";

export const metadata = {
  title: "AI 모델 관리 | StockAnalysis AI",
};

interface ModelsListResponse {
  models: ModelConfig[];
  total: number;
}

export default async function AdminModelsPage() {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  let allModels: ModelConfig[] = [];

  if (session?.access_token) {
    try {
      const result = await serverApiFetch<ModelsListResponse>(
        "/admin/models",
        session.access_token,
      );
      allModels = result.models;
    } catch {
      // API 에러 — 빈 상태 표시
    }
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">AI 모델 관리</h1>
          <p className="text-muted-foreground text-sm">
            기능별 AI 모델 배정 및 파라미터를 관리합니다.
          </p>
        </div>

        <div className="rounded-lg border">
          {allModels.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="bg-muted mb-4 flex size-16 items-center justify-center rounded-full">
                <Cpu className="text-muted-foreground size-8" />
              </div>
              <h3 className="mb-1 text-lg font-semibold">
                등록된 모델이 없습니다
              </h3>
              <p className="text-muted-foreground text-sm">
                모델 설정이 추가되면 여기에 표시됩니다.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>설정 키</TableHead>
                  <TableHead>표시 이름</TableHead>
                  <TableHead>기본 모델</TableHead>
                  <TableHead>Fallback</TableHead>
                  <TableHead className="text-right">Max Tokens</TableHead>
                  <TableHead className="text-right">Temperature</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>수정일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allModels.map((model) => (
                  <TableRow key={model.id}>
                    <TableCell className="font-mono text-sm">
                      {model.config_key}
                    </TableCell>
                    <TableCell className="font-medium">
                      {model.display_name}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {model.primary_model}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-sm">
                      {model.fallback_model ?? "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {model.max_tokens.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {model.temperature}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={model.is_active ? "default" : "secondary"}
                      >
                        {model.is_active ? "활성" : "비활성"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(model.updated_at).toLocaleDateString("ko-KR")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </main>
    </div>
  );
}
