import type { Metadata } from "next";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "용어 상세 | Stock Intelligence",
};

export default async function GlossaryTermPage({
  params,
}: {
  params: Promise<{ term: string }>;
}) {
  const { term } = await params;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">{decodeURIComponent(term)}</h1>
      </div>
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-sm">
            백엔드 연동 후 용어 설명이 표시됩니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
