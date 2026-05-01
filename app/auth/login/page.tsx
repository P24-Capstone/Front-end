'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'

export default function LoginPage() {
  const [userEmail, setUserEmail] = useState('')
  const [userPw, setUserPw] = useState('')
  const [autoLogin, setAutoLogin] = useState(false)
  const [error, setError] = useState('')
  const login = useAuthStore((state) => state.login)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail, userPw }),
      })
      const data = await res.json()
      if (!res.ok) { setError('이메일 또는 비밀번호가 올바르지 않습니다.'); return }
      login({ id: '', email: userEmail, name: '' }, data.data)
      router.push('/groups')
    } catch {
      setError('서버에 연결할 수 없습니다.')
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-5">로그인</h1>
        <p className="text-base font-semibold mb-10">
          이메일과 비밀번호를<br />입력해주세요.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">이메일</label>
            <input
              type="email"
              placeholder="sample@gmail.com"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-gray-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">비밀번호</label>
            <input
              type="password"
              placeholder="비밀번호 입력"
              value={userPw}
              onChange={(e) => setUserPw(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-gray-500"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoLogin}
                onChange={(e) => setAutoLogin(e.target.checked)}
                className="w-4 h-4"
              />
              자동 로그인
            </label>
            <div className="flex items-center gap-2 text-gray-500 text-xs">
              <button type="button" className="hover:text-gray-700">이메일 확인</button>
              <span className="w-px h-3 bg-gray-300" />
              <button type="button" className="hover:text-gray-700">비밀번호 재설정</button>
            </div>
          </div>

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <button
            type="submit"
            className="w-full py-3 bg-gray-400 text-white rounded font-medium hover:bg-gray-500 transition-colors mt-2"
          >
            로그인
          </button>
        </form>
      </div>

      <p className="mt-6 text-sm text-gray-500">
        크루와이즈가 처음이신가요?{' '}
        <Link href="/auth/signup" className="font-semibold text-gray-800">
          회원가입
        </Link>
      </p>
    </div>
  )
}
