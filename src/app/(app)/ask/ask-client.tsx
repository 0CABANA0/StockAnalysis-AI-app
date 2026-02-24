"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { askQuestion } from "@/lib/api/ask";
import { Loader2, Send, ExternalLink } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  deeplinks?: { label: string; url: string }[];
}

export function AskContent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setLoading(true);

    try {
      const res = await askQuestion(question);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.answer,
          deeplinks: res.deeplinks,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "죄송합니다. 일시적 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* 메시지 영역 */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto pb-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground text-sm">
                투자 관련 질문을 입력해 보세요
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {[
                  "지금 VIX가 높은가요?",
                  "코스피 전망은?",
                  "초보자 추천 ETF는?",
                  "환율이 오르면 어떤 주식이 좋나요?",
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="hover:bg-accent rounded-full border px-3 py-1 text-xs transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              <p className="whitespace-pre-wrap text-sm">{msg.content}</p>

              {msg.deeplinks && msg.deeplinks.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {msg.deeplinks.map((link, j) => (
                    <Link
                      key={j}
                      href={link.url}
                      className="text-primary inline-flex items-center gap-1 rounded border bg-background px-2 py-0.5 text-xs hover:underline"
                    >
                      {link.label}
                      <ExternalLink className="size-2.5" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted flex items-center gap-2 rounded-lg px-4 py-2">
              <Loader2 className="size-4 animate-spin" />
              <span className="text-sm">답변 생성 중...</span>
            </div>
          </div>
        )}
      </div>

      {/* 입력 영역 */}
      <form onSubmit={handleSubmit} className="flex gap-2 pt-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="투자 관련 질문을 입력하세요..."
          disabled={loading}
          className="flex-1"
        />
        <Button type="submit" disabled={loading || !input.trim()} size="icon">
          <Send className="size-4" />
        </Button>
      </form>

      <p className="text-muted-foreground mt-2 text-center text-xs">
        AI가 생성한 참고 정보입니다. 투자 결정은 전문가 상담을 권장합니다.
      </p>
    </div>
  );
}
