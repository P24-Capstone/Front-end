'use client';

import Link from 'next/link';
import { useState } from 'react';
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

  async function handleSubmit(e: { preventDefault: () => void }) {
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
    <div className="flex flex-col gap-8">
      {/* 타이틀 */}
      <div>
        <h1 className="text-[22px] font-bold text-zinc-900 mb-1">로그인</h1>
        <p className="text-[14px] text-zinc-400">이메일과 비밀번호를 입력해주세요.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-[14px] text-zinc-800 placeholder:text-zinc-300 outline-none focus:border-[#3B3EFF] transition-colors bg-zinc-50"
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-[14px] text-zinc-800 placeholder:text-zinc-300 outline-none focus:border-[#3B3EFF] transition-colors bg-zinc-50"
        />

        <div className="flex items-center justify-between mt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div
              onClick={() => setAutoLogin(!autoLogin)}
              className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${autoLogin ? 'bg-[#3B3EFF] border-[#3B3EFF]' : 'border-zinc-300 bg-white'}`}
            >
              {autoLogin && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className="text-[13px] text-zinc-500">자동 로그인</span>
          </label>
          <div className="flex gap-3">
            <Link href="/auth/find-email" className="text-[12px] text-zinc-400 hover:text-zinc-600 transition-colors">아이디 찾기</Link>
            <span className="text-zinc-200 text-[12px]">|</span>
            <Link href="/auth/reset-password" className="text-[12px] text-zinc-400 hover:text-zinc-600 transition-colors">비밀번호 재설정</Link>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-1.5 bg-red-50 rounded-lg px-3 py-2">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-[12px] text-red-500">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !email || !password}
          className="w-full h-[52px] bg-[#3B3EFF] text-white rounded-2xl text-[15px] font-bold mt-2 disabled:bg-zinc-300 disabled:text-zinc-500 transition-colors"
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>

      <p className="text-[13px] text-center text-zinc-400">
        크루와이즈가 처음이신가요?{' '}
        <Link href="/auth/signup" className="font-semibold text-[#3B3EFF]">
          회원가입
        </Link>
      </p>
    </div>
  );
}