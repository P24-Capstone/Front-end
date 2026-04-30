'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const [form, setForm] = useState({
    userEmail: '',
    userPw: '',
    userPwConfirm: '',
    userName: '',
    userTel: '',
  })
  const [agreements, setAgreements] = useState({
    all: false,
    terms: false,
    privacy: false,
    marketing: false,
  })
  const [termsOpen, setTermsOpen] = useState(false)
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleAllAgree = (checked: boolean) => {
    setAgreements({ all: checked, terms: checked, privacy: checked, marketing: checked })
  }

  const handleAgree = (key: keyof typeof agreements, checked: boolean) => {
    const next = { ...agreements, [key]: checked }
    next.all = next.terms && next.privacy && next.marketing
    setAgreements(next)
  }

  const isFormValid =
    form.userEmail &&
    form.userPw &&
    form.userPwConfirm &&
    form.userName &&
    form.userTel &&
    agreements.terms &&
    agreements.privacy

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!isFormValid) return

    // TODO: 백엔드 API 연결 시 아래 주석을 해제하고 임시 코드를 삭제하세요
    // const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/signup`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     userEmail: form.userEmail,
    //     userPw: form.userPw,
    //     userName: form.userName,
    //     userTel: form.userTel,
    //   }),
    // })
    // if (!res.ok) return

    router.push('/auth/login')
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-6">회원가입</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex gap-2">
            <input
              name="userEmail"
              type="email"
              placeholder="이메일"
              value={form.userEmail}
              onChange={handleChange}
              className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-gray-500"
            />
            <button
              type="button"
              className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-600 whitespace-nowrap hover:bg-gray-50"
            >
              중복 확인
            </button>
          </div>

          <input
            name="userPw"
            type="password"
            placeholder="비밀번호"
            value={form.userPw}
            onChange={handleChange}
            className="border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-gray-500"
          />

          <input
            name="userPwConfirm"
            type="password"
            placeholder="비밀번호 확인"
            value={form.userPwConfirm}
            onChange={handleChange}
            className="border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-gray-500"
          />

          <input
            name="userName"
            type="text"
            placeholder="이름"
            value={form.userName}
            onChange={handleChange}
            className="border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-gray-500"
          />

          <input
            name="userTel"
            type="tel"
            placeholder="전화번호"
            value={form.userTel}
            onChange={handleChange}
            className="border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-gray-500"
          />

          {/* 약관 동의 */}
          <div className="flex flex-col gap-2 mt-1 text-sm">
            <div className="flex items-start justify-between">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreements.all}
                  onChange={(e) => handleAllAgree(e.target.checked)}
                  className="w-4 h-4 mt-0.5 shrink-0"
                />
                <span className="text-xs leading-snug">
                  [필수] 이용약관 및 개인정보 수집 관련 동의, 개인정보 제3자 제공 동의
                </span>
              </label>
              <button
                type="button"
                onClick={() => setTermsOpen(!termsOpen)}
                className="text-gray-400 ml-2 shrink-0"
              >
                {termsOpen ? '▲' : '▼'}
              </button>
            </div>

            {termsOpen && (
              <div className="flex flex-col gap-2 pl-2 border-l border-gray-200 ml-1">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreements.terms}
                      onChange={(e) => handleAgree('terms', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-xs">[필수] 이용약관</span>
                  </label>
                  <button type="button" className="text-xs text-gray-400 underline">보기</button>
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreements.privacy}
                      onChange={(e) => handleAgree('privacy', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-xs">[필수] 개인정보 제3자 제공 동의서</span>
                  </label>
                  <button type="button" className="text-xs text-gray-400 underline">보기</button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreements.marketing}
                  onChange={(e) => handleAgree('marketing', e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-xs">[선택] 마케팅 정보 수신동의</span>
              </label>
              <button type="button" className="text-xs text-gray-400 underline">보기</button>
            </div>
          </div>

          <button
            type="submit"
            disabled={!isFormValid}
            className="w-full py-3 bg-gray-400 text-white rounded font-medium mt-2 disabled:opacity-50 hover:bg-gray-500 transition-colors disabled:cursor-not-allowed"
          >
            회원가입
          </button>
        </form>

        <p className="mt-6 text-sm text-gray-500 text-center">
          이미 크루와이즈 회원이신가요?{' '}
          <Link href="/auth/login" className="font-semibold text-gray-800">
            로그인
          </Link>
        </p>
      </div>
    </div>
  )
}
