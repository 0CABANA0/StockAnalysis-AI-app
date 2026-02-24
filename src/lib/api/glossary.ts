import { apiFetch } from "./client";
import type { GlossaryTerm } from "@/types";

interface GlossaryListResponse {
  terms: GlossaryTerm[];
  total: number;
}

export async function getGlossaryTerms(
  category?: string,
): Promise<GlossaryListResponse> {
  const query = category ? `?category=${encodeURIComponent(category)}` : "";
  return apiFetch<GlossaryListResponse>(`/glossary/${query}`);
}

export async function getGlossaryTerm(term: string): Promise<GlossaryTerm> {
  return apiFetch<GlossaryTerm>(`/glossary/${encodeURIComponent(term)}`);
}
