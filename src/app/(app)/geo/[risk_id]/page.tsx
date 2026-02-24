import type { Metadata } from "next";

import { Shield } from "lucide-react";
import { RiskDetailContent } from "./risk-detail-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ risk_id: string }>;
}): Promise<Metadata> {
  const { risk_id } = await params;
  return {
    title: `${risk_id} 리스크 상세`,
    description: `지정학 리스크 "${risk_id}" 상세 분석 및 투자 영향`,
  };
}

export default async function GeoRiskDetailPage({
  params,
}: {
  params: Promise<{ risk_id: string }>;
}) {
  const { risk_id } = await params;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Shield className="size-6" />
          지정학 리스크 상세
        </h1>
      </div>
      <RiskDetailContent riskId={risk_id} />
    </div>
  );
}
