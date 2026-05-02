'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function FindEmailPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [foundEmail, setFoundEmail] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/api/auth/find-email', { name, phone });
      setFoundEmail(res.data.data?.email ?? res.data.email);
    } catch {
      setError('일치하는 계정을 찾을 수 없습니다.');
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
      <h1 className="text-xl font-bold text-zinc-800 mb-1">이메일 확인</h1>

      {foundEmail ? (
        <>
          <p className="text-sm text-zinc-500 mt-6">이메일은</p>
          <p className="text-base font-semibold text-zinc-800 mt-1 mb-8">{foundEmail} 입니다.</p>
          <button
            onClick={() => router.push('/auth/login')}
            className="w-full bg-zinc-400 hover:bg-zinc-500 text-white py-2.5 rounded text-sm font-medium transition-colors"
          >
            로그인하러 가기
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-zinc-500 mb-6">이름과 전화번호를 입력해주세요.</p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
      )}

      <BottomLinks />
    </div>
  );
}
