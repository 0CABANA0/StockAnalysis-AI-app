"use client";

import { Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { UserProfile } from "@/types";

const roleBadge: Record<
  string,
  {
    label: string;
    variant: "default" | "destructive" | "secondary" | "outline";
  }
> = {
  SUPER_ADMIN: { label: "슈퍼 관리자", variant: "destructive" },
  ADMIN: { label: "관리자", variant: "default" },
  USER: { label: "일반 사용자", variant: "secondary" },
  SUSPENDED: { label: "정지", variant: "outline" },
};

const statusBadge: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: "활성", className: "text-green-600" },
  SUSPENDED: { label: "정지", className: "text-red-600" },
  DEACTIVATED: { label: "비활성", className: "text-gray-500" },
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

interface MembersTableProps {
  members: UserProfile[];
}

export function MembersTable({ members }: MembersTableProps) {
  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="bg-muted mb-4 flex size-16 items-center justify-center rounded-full">
          <Users className="text-muted-foreground size-8" />
        </div>
        <h3 className="mb-1 text-lg font-semibold">회원이 없습니다</h3>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>이메일</TableHead>
          <TableHead>표시 이름</TableHead>
          <TableHead>역할</TableHead>
          <TableHead>상태</TableHead>
          <TableHead>텔레그램</TableHead>
          <TableHead>마지막 로그인</TableHead>
          <TableHead>가입일</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => {
          const role = roleBadge[member.role] ?? roleBadge.USER;
          const status = statusBadge[member.status] ?? statusBadge.ACTIVE;

          return (
            <TableRow key={member.id}>
              <TableCell className="font-medium">
                {member.email ?? "-"}
              </TableCell>
              <TableCell>{member.display_name ?? "-"}</TableCell>
              <TableCell>
                <Badge variant={role.variant}>{role.label}</Badge>
              </TableCell>
              <TableCell>
                <span className={`text-sm font-medium ${status.className}`}>
                  {status.label}
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {member.telegram_chat_id ? "연결됨" : "-"}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatDate(member.last_login)}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatDate(member.created_at)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
