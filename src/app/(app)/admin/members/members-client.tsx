"use client";

import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getMembers,
  updateMemberRole,
  type Member,
} from "@/lib/api/admin";
import { Users, ShieldAlert, ShieldCheck } from "lucide-react";

const roleLabel: Record<string, string> = {
  SUPER_ADMIN: "슈퍼관리자",
  ADMIN: "관리자",
  USER: "일반회원",
};

const statusLabel: Record<string, string> = {
  ACTIVE: "활성",
  SUSPENDED: "정지",
};

export function MembersContent() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadMembers = () => {
    setLoading(true);
    getMembers()
      .then((res) => setMembers(res.members))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const handleRoleChange = async (userId: string, role: string) => {
    setActionLoading(userId);
    try {
      await updateMemberRole(userId, role);
      loadMembers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "역할 변경에 실패했습니다.");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="size-4" />
            전체 회원 ({members.length}명)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              등록된 회원이 없습니다.
            </p>
          ) : (
            <div className="max-h-[600px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-background sticky top-0">
                  <tr className="text-muted-foreground border-b text-xs">
                    <th className="py-2 text-left">이메일</th>
                    <th className="py-2 text-left">이름</th>
                    <th className="py-2 text-center">역할</th>
                    <th className="py-2 text-center">상태</th>
                    <th className="py-2 text-center">가입일</th>
                    <th className="py-2 text-center">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id} className="border-b">
                      <td className="py-2 font-mono text-xs">
                        {m.email ?? "—"}
                      </td>
                      <td className="py-2">{m.display_name ?? "—"}</td>
                      <td className="py-2 text-center">
                        <Badge
                          variant={
                            m.role === "SUPER_ADMIN"
                              ? "default"
                              : m.role === "ADMIN"
                                ? "secondary"
                                : "outline"
                          }
                          className="text-xs"
                        >
                          {roleLabel[m.role] ?? m.role}
                        </Badge>
                      </td>
                      <td className="py-2 text-center">
                        <Badge
                          variant={
                            m.status === "ACTIVE" ? "outline" : "destructive"
                          }
                          className="text-xs"
                        >
                          {statusLabel[m.status] ?? m.status}
                        </Badge>
                      </td>
                      <td className="text-muted-foreground py-2 text-center text-xs">
                        {new Date(m.created_at).toLocaleDateString("ko-KR")}
                      </td>
                      <td className="py-2 text-center">
                        {m.role !== "SUPER_ADMIN" && (
                          <div className="flex justify-center gap-1">
                            {m.status === "ACTIVE" ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-red-600"
                                disabled={actionLoading === m.user_id}
                                onClick={() =>
                                  handleRoleChange(m.user_id, "SUSPENDED")
                                }
                              >
                                <ShieldAlert className="mr-1 size-3" />
                                정지
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-green-600"
                                disabled={actionLoading === m.user_id}
                                onClick={() =>
                                  handleRoleChange(m.user_id, "USER")
                                }
                              >
                                <ShieldCheck className="mr-1 size-3" />
                                복구
                              </Button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
