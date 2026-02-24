import { apiFetch } from "./client";

interface AskResponse {
  answer: string;
  deeplinks: { label: string; url: string }[];
  context_data: Record<string, unknown>;
}

export async function askQuestion(question: string): Promise<AskResponse> {
  return apiFetch<AskResponse>("/ask/", {
    method: "POST",
    body: JSON.stringify({ question }),
  });
}
