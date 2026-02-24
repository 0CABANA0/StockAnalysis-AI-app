import type { Metadata } from "next";

import { GlossaryTermContent } from "./term-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ term: string }>;
}): Promise<Metadata> {
  const { term } = await params;
  const decoded = decodeURIComponent(term);
  return {
    title: `${decoded} | 용어사전`,
    description: `투자 용어 "${decoded}"의 정의와 설명`,
  };
}

export default async function GlossaryTermPage({
  params,
}: {
  params: Promise<{ term: string }>;
}) {
  const { term } = await params;

  return <GlossaryTermContent term={term} />;
}
