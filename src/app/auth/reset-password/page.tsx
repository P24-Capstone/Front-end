'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

const INPUT_CLS = 'w-full border border-zinc-200 rounded-xl px-4 py-3 text-[14px] text-zinc-800 placeholder:text-zinc-300 outline-none focus:border-[#3B3EFF] transition-colors bg-zinc-50';

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-1.5 bg-red-50 rounded-lg px-3 py-2">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <p className="text-[12px] text-red-500">{msg}</p>
    </div>
  );
}

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
    if (password !== passwordConfirm) { setError('비밀번호가 일치하지 않습니다.'); return; }
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

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-[22px] font-bold text-zinc-900 mb-1">비밀번호 재설정</h1>
        <p className="text-[14px] text-zinc-400">
          {step === 'verify' ? '이메일과 전화번호를 입력해주세요.' : '새 비밀번호를 입력해주세요.'}
        </p>
      </div>

      {/* 단계 표시 */}
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#3B3EFF] text-white text-[11px] font-bold shrink-0">1</div>
        <span className={`text-[13px] font-medium ${step === 'verify' ? 'text-zinc-900' : 'text-zinc-400'}`}>본인 확인</span>
        <div className="flex-1 h-px bg-zinc-200 mx-1" />
        <div className={`flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold shrink-0 ${step === 'reset' ? 'bg-[#3B3EFF] text-white' : 'bg-zinc-200 text-zinc-400'}`}>2</div>
        <span className={`text-[13px] font-medium ${step === 'reset' ? 'text-zinc-900' : 'text-zinc-400'}`}>비밀번호 변경</span>
      </div>

      {step === 'verify' ? (
        <form onSubmit={handleVerify} className="flex flex-col gap-3">
          <input type="email" placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} required className={INPUT_CLS} />
          <input type="tel" placeholder="전화번호 (숫자만)" value={phone} onChange={(e) => setPhone(e.target.value)} required className={INPUT_CLS} />
          {error && <ErrorBox msg={error} />}
          <button type="submit" disabled={loading || !email || !phone}
            className="w-full h-[52px] bg-[#3B3EFF] text-white rounded-2xl text-[15px] font-bold mt-1 disabled:bg-zinc-300 disabled:text-zinc-500 transition-colors">
            {loading ? '확인 중...' : '확인'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleReset} className="flex flex-col gap-3">
          <input type="password" placeholder="새 비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} required className={INPUT_CLS} />
          <input type="password" placeholder="비밀번호 확인" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} required className={INPUT_CLS} />
          {error && <ErrorBox msg={error} />}
          <button type="submit" disabled={loading || !password || !passwordConfirm}
            className="w-full h-[52px] bg-[#3B3EFF] text-white rounded-2xl text-[15px] font-bold mt-1 disabled:bg-zinc-300 disabled:text-zinc-500 transition-colors">
            {loading ? '처리 중...' : '변경하기'}
          </button>
        </form>
      )}

      <div className="flex flex-col items-center gap-1.5">
        <p className="text-[13px] text-zinc-400">
          크루와이즈가 처음이신가요?{' '}
          <Link href="/auth/signup" className="font-semibold text-[#3B3EFF]">회원가입</Link>
        </p>
        <p className="text-[13px] text-zinc-400">
          이미 크루와이즈 회원이신가요?{' '}
          <Link href="/auth/login" className="font-semibold text-[#3B3EFF]">로그인</Link>
        </p>
      </div>
    </div>
  );
}