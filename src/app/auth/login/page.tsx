'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const router = useRouter();
  const setToken = useAuthStore((s) => s.setToken);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [autoLogin, setAutoLogin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', { userEmail: email, userPw: password });
      const token = res.data.data;
      setToken(token);
      if (!autoLogin) {
        sessionStorage.setItem('sessionOnly', 'true');
      }
      router.push('/main');
    } catch {
      setError('이메일 또는 비밀번호를 확인해주세요.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-zinc-800 mb-1">로그인</h1>
      <p className="text-sm text-zinc-500 mb-6">이메일과 비밀번호를 입력해주세요.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full border border-zinc-300 rounded px-3 py-2.5 text-sm placeholder:text-zinc-400 focus:outline-none focus:border-zinc-500"
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full border border-zinc-300 rounded px-3 py-2.5 text-sm placeholder:text-zinc-400 focus:outline-none focus:border-zinc-500"
        />

        <div className="flex items-center justify-between text-xs text-zinc-500 mt-1">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoLogin}
              onChange={(e) => setAutoLogin(e.target.checked)}
              className="accent-zinc-600"
            />
            자동 로그인
          </label>
          <div className="flex gap-3">
            <Link href="/auth/find-email" className="hover:text-zinc-700">아이디 찾기</Link>
            <Link href="/auth/reset-password" className="hover:text-zinc-700">비밀번호 재설정</Link>
          </div>
        </div>

        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-zinc-400 hover:bg-zinc-500 text-white py-2.5 rounded text-sm font-medium mt-2 disabled:opacity-60 transition-colors"
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>

      <p className="text-xs text-center text-zinc-500 mt-6">
        크루와이즈가 처음이신가요?{' '}
        <Link href="/auth/signup" className="font-medium text-zinc-700 underline">
          회원가입
        </Link>
      </p>
    </div>
  );
}
