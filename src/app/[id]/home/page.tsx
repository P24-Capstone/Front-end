'use client';

const NEWS_ITEMS = [
  { id: 1, content: '새 공지를 작성했어요', time: '10분 전' },
  { id: 2, content: '새 투표가 시작됐어요. 참여해보세요!', time: '1시간 전' },
  { id: 3, content: '이번 주 미션이 업데이트됐어요', time: '2시간 전' },
  { id: 4, content: '새 일정이 등록됐어요. 확인해보세요.', time: '어제' },
];

const RANKING = [
  { rank: 1, score: 98, emoji: '🥇' },
  { rank: 2, score: 85, emoji: '🥈' },
  { rank: 3, score: 72, emoji: '🥉' },
];

function CircleProgress({ pct, size = 84, sw = 7, color = '#111827' }: { pct: number; size?: number; sw?: number; color?: string }) {
  const r = (size - sw * 2) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={sw} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={sw}
        strokeDasharray={`${(pct / 100) * c} ${c}`} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`} />
    </svg>
  );
}

function DonutChart({ pct, label, color }: { pct: number; label: string; color: string }) {
  const size = 110; const sw = 14;
  const r = (size - sw * 2) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={sw} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={sw}
            strokeDasharray={`${(pct / 100) * c} ${c}`} strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-base font-bold">{pct}%</span>
        </div>
      </div>
      <span className="text-xs text-zinc-500">{label}</span>
    </div>
  );
}

export default function GroupHomePage() {
  return (
    <div className="space-y-6 pt-4">
      {/* 최근 소식 */}
      <section>
        <h2 className="text-[15px] font-bold mb-3">최근 소식</h2>
        <div className="space-y-2">
          {NEWS_ITEMS.map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50">
              <div className="w-9 h-9 rounded-full bg-[#3B3EFF] shrink-0 flex items-center justify-center">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-zinc-800 leading-snug">{item.content}</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 나의 대시보드 */}
      <section>
        <h2 className="text-[15px] font-bold mb-3">나의 대시보드</h2>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-zinc-50 rounded-2xl p-4 flex flex-col items-center">
            <p className="text-[11px] text-zinc-500 mb-3 text-center">평균 활동 시간</p>
            <div className="relative">
              <CircleProgress pct={100} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[18px] font-bold leading-none">2.54</span>
                <span className="text-[10px] text-zinc-400 mt-0.5">시간</span>
              </div>
            </div>
            <p className="text-[11px] text-zinc-400 mt-2">100%</p>
          </div>
          <div className="bg-zinc-50 rounded-2xl p-4">
            <p className="text-[11px] text-zinc-500 mb-1">나의 MBP MOP (Top 5)</p>
            <p className="text-[13px] font-bold mb-3">나의 순위: 4위 ⭐</p>
            <div className="space-y-2">
              {RANKING.map((r) => (
                <div key={r.rank} className="flex items-center gap-1.5">
                  <span className="text-[13px] w-5">{r.emoji}</span>
                  <div className="flex-1 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${r.score}%`, backgroundColor: '#374151' }} />
                  </div>
                  <span className="text-[10px] text-zinc-400 w-6 text-right">{r.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-zinc-50 rounded-2xl p-4">
          <p className="text-[13px] font-semibold mb-4">개인별 주차 미션 성취</p>
          <div className="flex justify-around items-center">
            <DonutChart pct={25} label="모임달성" color="#f97316" />
            <div className="w-px h-16 bg-zinc-200" />
            <DonutChart pct={45} label="나의달성" color="#111827" />
          </div>
          <p className="text-[11px] text-zinc-400 text-center mt-4">2월달의 주차 성취율 (5째 주) 입니다.</p>
        </div>
      </section>
    </div>
  );
}