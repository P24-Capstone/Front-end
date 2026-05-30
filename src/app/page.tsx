import Link from 'next/link';

const FEATURES = [
  {
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="18" fill="#e0f2fe" />
        <path d="M12 22c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="#0284c7" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="18" cy="13" r="2.5" fill="#0284c7" />
        <path d="M24 18l2-2M12 18l-2-2" stroke="#0284c7" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="26" cy="16" r="1.5" fill="#7dd3fc" />
        <circle cx="10" cy="16" r="1.5" fill="#7dd3fc" />
      </svg>
    ),
    title: 'AI 자동 모임 관리',
    desc: '스케줄링, 리마인더, 참여도 분석을 한번에 해결하세요.',
  },
  {
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="18" fill="#dcfce7" />
        <circle cx="18" cy="18" r="7" stroke="#16a34a" strokeWidth="1.8" />
        <circle cx="18" cy="18" r="3" fill="#16a34a" />
        <path d="M18 7v2M18 27v2M7 18H9M27 18h2" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
    title: '실시간 목표 달성',
    desc: '모임 목표를 설정하고 진행 상황을 시각적으로 확인하세요.',
  },
  {
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="18" fill="#fef9c3" />
        <rect x="10" y="14" width="7" height="9" rx="1.5" stroke="#ca8a04" strokeWidth="1.8" />
        <rect x="19" y="11" width="7" height="12" rx="1.5" stroke="#ca8a04" strokeWidth="1.8" />
        <path d="M10 25h16" stroke="#ca8a04" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
    title: '통합 협업 툴킷',
    desc: '필요한 모든 도구를 한 곳에서 쉽게 사용하세요.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="max-w-2xl mx-auto w-full flex flex-col flex-1 shadow-sm">

        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
          <span className="text-[17px] font-bold tracking-tight">Crewise</span>
          <div className="flex items-center gap-2">
            <Link
              href="/auth/signup"
              className="text-[13px] text-zinc-600 px-3 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 transition-colors"
            >
              회원가입
            </Link>
            <Link
              href="/auth/login"
              className="text-[13px] text-white px-3 py-1.5 rounded-lg bg-[#3B3EFF] hover:bg-[#7073FB] transition-colors"
            >
              로그인
            </Link>
          </div>
        </header>

        {/* Hero */}
        <section className="relative h-[260px] overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(160deg, #374151 0%, #3B3EFF 45%, #111827 100%)',
            }}
          />
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background:
                'radial-gradient(ellipse at 70% 40%, #6b7280 0%, transparent 60%), radial-gradient(ellipse at 20% 70%, #374151 0%, transparent 50%)',
            }}
          />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="relative z-10 flex flex-col justify-between h-full p-5">
            <p className="text-[11px] text-zinc-400">2026.06.09 서비스 오픈</p>
            <div>
              <h1 className="text-white text-[17px] font-bold leading-relaxed mb-5">
                귀찮은 관리는 AI에게,<br />
                우리는 목표 달성에만 집중하는<br />
                독특한 모임 공간
              </h1>
            </div>
          </div>
        </section>

        {/* Feature Cards */}
        <main className="flex-1 px-4 py-6 space-y-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="flex flex-col items-center text-center gap-3 p-5 rounded-2xl border border-zinc-100 shadow-sm"
            >
              <div className="mt-1">{f.icon}</div>
              <div>
                <p className="text-[15px] font-bold text-zinc-900 mb-1">{f.title}</p>
                <p className="text-[12px] text-zinc-500 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </main>

        {/* Footer */}
        <footer className="py-3 px-4 border-t border-zinc-100 text-center">
          <p className="text-[11px] text-zinc-400">© 2026 Crewise Corp. All Rights Reserved</p>
        </footer>

      </div>
    </div>
  );
}