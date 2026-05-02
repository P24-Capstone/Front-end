'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

const TERMS = [
  { id: 'terms', label: '[필수] 이용약관 및 개인정보 수집·이용 동의, 개인정보 제3자 제공에 동의합니다', required: true },
  { id: 'privacy', label: '[필수] 광고성 정보 및 개인정보 수집 동의', required: true },
  { id: 'marketing', label: '[선택] 마케팅 정보 수신 동의', required: false },
];

type TermId = 'terms' | 'privacy' | 'marketing';

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', passwordConfirm: '', name: '', phone: '' });
  const [emailChecked, setEmailChecked] = useState(false);
  const [checked, setChecked] = useState<Record<TermId, boolean>>({ terms: false, privacy: false, marketing: false });
  const [allChecked, setAllChecked] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e: { target: { name: string; value: string } }) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === 'email') setEmailChecked(false);
  }

  function handleTermChange(id: TermId, val: boolean) {
    const next = { ...checked, [id]: val };
    setChecked(next);
    setAllChecked(Object.values(next).every(Boolean));
  }

  function handleAllChange(val: boolean) {
    setAllChecked(val);
    setChecked({ terms: val, privacy: val, marketing: val });
  }

  async function handleEmailCheck() {
    if (!form.email) return;
    setError('');
    try {
      await api.post('/api/auth/check-email', { email: form.email });
      setEmailChecked(true);
    } catch {
      setError('이미 사용 중인 이메일입니다.');
    }
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setError('');
    if (!emailChecked) { setError('이메일 중복 확인을 해주세요.'); return; }
    if (form.password !== form.passwordConfirm) { setError('비밀번호가 일치하지 않습니다.'); return; }
    if (!checked.terms || !checked.privacy) { setError('필수 약관에 동의해주세요.'); return; }
    setLoading(true);
    try {
      await api.post('/api/auth/signup', {
        userEmail: form.email,
        userPw: form.password,
        userName: form.name,
        userTel: form.phone,
      });
      router.push('/auth/login');
    } catch {
      setError('회원가입에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-zinc-800 mb-6">회원가입</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex gap-2">
          <input
            type="email"
            name="email"
            placeholder="이메일"
            value={form.email}
            onChange={handleChange}
            required
            className="flex-1 border border-zinc-300 rounded px-3 py-2.5 text-sm placeholder:text-zinc-400 focus:outline-none focus:border-zinc-500"
          />
          <button
            type="button"
            onClick={handleEmailCheck}
            className="shrink-0 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 text-xs px-3 rounded transition-colors"
          >
            중복 확인
          </button>
        </div>
        {emailChecked && (
          <p className="text-xs text-green-600 -mt-1">사용 가능한 이메일입니다.</p>
        )}

        <input
          type="password"
          name="password"
          placeholder="비밀번호"
          value={form.password}
          onChange={handleChange}
          required
          className="w-full border border-zinc-300 rounded px-3 py-2.5 text-sm placeholder:text-zinc-400 focus:outline-none focus:border-zinc-500"
        />
        <input
          type="password"
          name="passwordConfirm"
          placeholder="비밀번호 확인"
          value={form.passwordConfirm}
          onChange={handleChange}
          required
          className="w-full border border-zinc-300 rounded px-3 py-2.5 text-sm placeholder:text-zinc-400 focus:outline-none focus:border-zinc-500"
        />
        <input
          type="text"
          name="name"
          placeholder="이름"
          value={form.name}
          onChange={handleChange}
          required
          className="w-full border border-zinc-300 rounded px-3 py-2.5 text-sm placeholder:text-zinc-400 focus:outline-none focus:border-zinc-500"
        />
        <input
          type="tel"
          name="phone"
          placeholder="전화번호"
          value={form.phone}
          onChange={handleChange}
          required
          className="w-full border border-zinc-300 rounded px-3 py-2.5 text-sm placeholder:text-zinc-400 focus:outline-none focus:border-zinc-500"
        />

        <div className="border border-zinc-200 rounded p-3 mt-1 flex flex-col gap-2">
          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-zinc-700 select-none">
            <input
              type="checkbox"
              checked={allChecked}
              onChange={(e) => handleAllChange(e.target.checked)}
              className="accent-zinc-600"
            />
            전체 동의
          </label>
          <div className="border-t border-zinc-100 pt-2 flex flex-col gap-2">
            {TERMS.map((term) => (
              <div key={term.id} className="flex items-start justify-between gap-2">
                <label className="flex items-start gap-2 cursor-pointer text-xs text-zinc-600 flex-1 select-none">
                  <input
                    type="checkbox"
                    checked={checked[term.id as TermId]}
                    onChange={(e) => handleTermChange(term.id as TermId, e.target.checked)}
                    className="mt-0.5 accent-zinc-600 shrink-0"
                  />
                  {term.label}
                </label>
                <button type="button" className="text-xs text-zinc-400 hover:text-zinc-600 shrink-0">보기</button>
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-zinc-400 hover:bg-zinc-500 text-white py-2.5 rounded text-sm font-medium mt-1 disabled:opacity-60 transition-colors"
        >
          {loading ? '처리 중...' : '회원가입'}
        </button>
      </form>

      <p className="text-xs text-center text-zinc-500 mt-6">
        이미 크루와이즈 회원이신가요?{' '}
        <Link href="/auth/login" className="font-medium text-zinc-700 underline">
          로그인
        </Link>
      </p>
    </div>
  );
}
