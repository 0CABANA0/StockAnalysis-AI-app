"use client";

import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getModels,
  updateModelConfig,
  type ModelConfig,
} from "@/lib/api/admin";
import { Bot, Save } from "lucide-react";

export function ModelsContent() {
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editModel, setEditModel] = useState("");
  const [editFallback, setEditFallback] = useState("");
  const [saving, setSaving] = useState(false);

  const loadModels = () => {
    setLoading(true);
    getModels()
      .then((res) => setModels(res.models))
      .catch(() => setModels([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadModels();
  }, []);

  const startEdit = (m: ModelConfig) => {
    setEditingId(m.id);
    setEditModel(m.primary_model);
    setEditFallback(m.fallback_model ?? "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditModel("");
    setEditFallback("");
  };

  const handleSave = async (configId: string) => {
    setSaving(true);
    try {
      await updateModelConfig(configId, {
        primary_model: editModel,
        fallback_model: editFallback || undefined,
      });
      cancelEdit();
      loadModels();
    } catch (err) {
      alert(err instanceof Error ? err.message : "모델 설정 변경에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {models.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground text-center text-sm">
              등록된 AI 모델 설정이 없습니다.
            </p>
          </CardContent>
        </Card>
      ) : (
        models.map((m) => (
          <Card key={m.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Bot className="size-4" />
                {m.display_name || m.config_key}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge
                  variant={m.is_active ? "default" : "secondary"}
                  className="text-xs"
                >
                  {m.is_active ? "활성" : "비활성"}
                </Badge>
                {editingId !== m.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => startEdit(m)}
                  >
                    수정
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editingId === m.id ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium">Primary Model</label>
                    <input
                      value={editModel}
                      onChange={(e) => setEditModel(e.target.value)}
                      className="border-input bg-background mt-1 w-full rounded-md border px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium">
                      Fallback Model
                    </label>
                    <input
                      value={editFallback}
                      onChange={(e) => setEditFallback(e.target.value)}
                      className="border-input bg-background mt-1 w-full rounded-md border px-2 py-1 text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={saving || !editModel.trim()}
                      onClick={() => handleSave(m.id)}
                    >
                      <Save className="mr-1 size-3" />
                      {saving ? "저장 중..." : "저장"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={cancelEdit}
                    >
                      취소
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Primary</span>
                    <span className="font-mono text-xs">{m.primary_model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fallback</span>
                    <span className="font-mono text-xs">
                      {m.fallback_model ?? "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Tokens</span>
                    <span>{m.max_tokens.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Temperature</span>
                    <span>{m.temperature}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
