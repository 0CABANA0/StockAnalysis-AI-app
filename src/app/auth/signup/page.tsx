"use client";

import { useState } from "react";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }
    // TODO: Supabase 회원가입 연동
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">회원가입</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            새 계정을 만드세요
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              이메일
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 dark:border-gray-700 dark:bg-gray-900"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 dark:border-gray-700 dark:bg-gray-900"
            />
          </div>
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium"
            >
              비밀번호 확인
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 dark:border-gray-700 dark:bg-gray-900"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white transition-colors hover:bg-blue-700"
          >
            회원가입
          </button>
        </form>
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          이미 계정이 있으신가요?{" "}
          <Link href="/auth/login" className="text-blue-600 hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
