'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'verify' | 'reset'>('verify');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleVerify(e: { preventDefault(): void }) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/api/auth/verify-user', { email, phone });
      setStep('reset');
    } catch {
      setError('일치하는 계정을 찾을 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: { preventDefault(): void }) {
    e.preventDefault();
    setError('');
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/auth/reset-password', { email, phone, newPassword: password });
      router.push('/auth/login');
    } catch {
      setError('비밀번호 재설정에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

  const BottomLinks = () => (
    <div className="flex flex-col items-center gap-1 mt-6 text-xs text-zinc-500">
      <p>
        크루와이즈가 처음이신가요?{' '}
        <Link href="/auth/signup" className="font-medium text-zinc-700 underline">회원가입</Link>
      </p>
      <p>
        이미 크루와이즈 회원이신가요?{' '}
        <Link href="/auth/login" className="font-medium text-zinc-700 underline">로그인</Link>
      </p>
    </div>
  );

  return (
    <div>
      <h1 className="text-xl font-bold text-zinc-800 mb-1">비밀번호 재설정</h1>

      {step === 'verify' ? (
        <>
          <p className="text-sm text-zinc-500 mb-6">이메일과 전화번호를 입력해주세요.</p>
          <form onSubmit={handleVerify} className="flex flex-col gap-3">
            <input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-zinc-300 rounded px-3 py-2.5 text-sm placeholder:text-zinc-400 focus:outline-none focus:border-zinc-500"
            />
            <input
              type="tel"
              placeholder="전화번호"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full border border-zinc-300 rounded px-3 py-2.5 text-sm placeholder:text-zinc-400 focus:outline-none focus:border-zinc-500"
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-zinc-400 hover:bg-zinc-500 text-white py-2.5 rounded text-sm font-medium mt-1 disabled:opacity-60 transition-colors"
            >
              {loading ? '확인 중...' : '확인'}
            </button>
          </form>
        </>
      ) : (
        <>
          <p className="text-sm text-zinc-500 mb-6">새 비밀번호를 입력해 주세요.</p>
          <form onSubmit={handleReset} className="flex flex-col gap-3">
            <input
              type="password"
              placeholder="새 비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-zinc-300 rounded px-3 py-2.5 text-sm placeholder:text-zinc-400 focus:outline-none focus:border-zinc-500"
            />
            <input
              type="password"
              placeholder="비밀번호 확인"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
              className="w-full border border-zinc-300 rounded px-3 py-2.5 text-sm placeholder:text-zinc-400 focus:outline-none focus:border-zinc-500"
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-zinc-400 hover:bg-zinc-500 text-white py-2.5 rounded text-sm font-medium mt-1 disabled:opacity-60 transition-colors"
            >
              {loading ? '처리 중...' : '확인'}
            </button>
          </form>
        </>
      )}

      <BottomLinks />
    </div>
  );
}
