'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

const TERMS = [
  { id: 'terms',     label: '[필수] 이용약관 및 개인정보 수집·이용 동의',  required: true  },
  { id: 'privacy',   label: '[필수] 광고성 정보 및 개인정보 수집 동의',     required: true  },
  { id: 'marketing', label: '[선택] 마케팅 정보 수신 동의',                required: false },
];

type TermId = 'terms' | 'privacy' | 'marketing';

const INPUT_CLS = 'w-full border border-zinc-200 rounded-xl px-4 py-3 text-[14px] text-zinc-800 placeholder:text-zinc-300 outline-none focus:border-[#3B3EFF] transition-colors bg-zinc-50';

function Checkbox({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 cursor-pointer transition-colors ${checked ? 'bg-[#3B3EFF] border-[#3B3EFF]' : 'border-zinc-300 bg-white'}`}
    >
      {checked && (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 13l4 4L19 7" />
        </svg>
      )}
    </div>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', passwordConfirm: '', name: '', phone: '' });
  const [emailChecked, setEmailChecked] = useState(false);
  const [checked, setChecked] = useState<Record<TermId, boolean>>({ terms: false, privacy: false, marketing: false });
  const [allChecked, setAllChecked] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e: { target: { name: string; value: string } }) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === 'email') { setEmailChecked(false); setEmailError(''); }
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
      setEmailError('이미 사용 중인 이메일입니다.');
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
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-[22px] font-bold text-zinc-900 mb-1">회원가입</h1>
        <p className="text-[14px] text-zinc-400">크루와이즈에 오신 걸 환영해요!</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {/* 이메일 */}
        <div className="flex gap-2">
          <input
            type="email"
            name="email"
            placeholder="이메일"
            value={form.email}
            onChange={handleChange}
            required
            className="flex-1 border border-zinc-200 rounded-xl px-4 py-3 text-[14px] text-zinc-800 placeholder:text-zinc-300 outline-none focus:border-[#3B3EFF] transition-colors bg-zinc-50"
          />
          <button
            type="button"
            onClick={handleEmailCheck}
            className={`shrink-0 px-4 rounded-xl text-[13px] font-semibold transition-colors ${emailChecked ? 'bg-emerald-50 text-emerald-600' : 'bg-[#EBEBFF] text-[#3B3EFF]'}`}
          >
            {emailChecked ? '확인완료' : '중복확인'}
          </button>
        </div>

        {emailError && (
          <div className="flex items-center gap-1.5 bg-red-50 rounded-lg px-3 py-2 -mt-1">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-[12px] text-red-500">{emailError}</p>
          </div>
        )}

        {/* 비밀번호 */}
        <input type="password" name="password"        placeholder="비밀번호"      value={form.password}        onChange={handleChange} required className={INPUT_CLS} />
        <input type="password" name="passwordConfirm" placeholder="비밀번호 확인" value={form.passwordConfirm} onChange={handleChange} required className={INPUT_CLS} />

        {/* 이름 / 전화번호 */}
        <input type="text" name="name"  placeholder="이름"   value={form.name}  onChange={handleChange} required className={INPUT_CLS} />
        <input type="tel"  name="phone" placeholder="전화번호" value={form.phone} onChange={handleChange} required className={INPUT_CLS} />

        {/* 약관 */}
        <div className="border border-zinc-200 rounded-xl p-4 flex flex-col gap-3 mt-1 bg-zinc-50">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <Checkbox checked={allChecked} onChange={handleAllChange} />
            <span className="text-[14px] font-semibold text-zinc-800">전체 동의</span>
          </label>
          <div className="border-t border-zinc-200 pt-3 flex flex-col gap-2.5">
            {TERMS.map((term) => (
              <div key={term.id} className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2.5 cursor-pointer select-none flex-1">
                  <Checkbox checked={checked[term.id as TermId]} onChange={(v) => handleTermChange(term.id as TermId, v)} />
                  <span className="text-[12px] text-zinc-500">{term.label}</span>
                </label>
                <button type="button" className="text-[11px] text-zinc-400 underline shrink-0">보기</button>
              </div>
            ))}
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
          disabled={loading}
          className="w-full h-[52px] bg-[#3B3EFF] text-white rounded-2xl text-[15px] font-bold mt-1 disabled:bg-zinc-300 disabled:text-zinc-500 transition-colors"
        >
          {loading ? '처리 중...' : '회원가입'}
        </button>
      </form>

      <p className="text-[13px] text-center text-zinc-400">
        이미 크루와이즈 회원이신가요?{' '}
        <Link href="/auth/login" className="font-semibold text-[#3B3EFF]">
          로그인
        </Link>
      </p>
    </div>
  );
}