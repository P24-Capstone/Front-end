'use client';

import { useParams, useRouter } from 'next/navigation';
import { ALL_EVENTS } from '../_data';

export default function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const router = useRouter();

  const event = ALL_EVENTS.find((e) => e.id === eventId);

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-[14px] text-zinc-400">일정을 찾을 수 없습니다.</p>
        <button onClick={() => router.back()} className="text-[13px] text-blue-500">
          돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="px-1">
      {/* 제목 */}
      <div className="flex items-center gap-2.5 pb-5 border-b border-zinc-100">
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#3b82f6" strokeWidth={1.8} className="shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
        <h1 className="text-[18px] font-bold text-zinc-900 break-words">{event.title}</h1>
      </div>

      {/* 정보 */}
      <div className="py-5 space-y-4 border-b border-zinc-100">
        <div className="flex items-center gap-3">
          <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth={2} className="shrink-0">
            <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          <span className="text-[14px] text-zinc-700">
            {event.year}년 {event.month}월 {event.dateNum}일 ({event.dateDay.slice(0, 1)})
          </span>
        </div>

        <div className="flex items-center gap-3">
          <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth={2} className="shrink-0">
            <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" />
          </svg>
          <span className="text-[14px] text-zinc-700">{event.time}</span>
        </div>

        <div className="flex items-center gap-3">
          <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth={2} className="shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 2C8.686 2 6 4.686 6 8c0 5.25 6 14 6 14s6-8.75 6-14c0-3.314-2.686-6-6-6z" />
            <circle cx="12" cy="8" r="2" />
          </svg>
          <span className="text-[14px] text-zinc-700 break-words">{event.location}</span>
        </div>

        <div className="flex items-start gap-3">
          <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth={2} className="mt-0.5 shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
          </svg>
          <span className="text-[14px] text-zinc-700 break-words">
            <span className="font-semibold">{event.memberCount}명</span>
            <span className="text-zinc-400 ml-1">({event.members.join(', ')})</span>
          </span>
        </div>
      </div>

      {/* 상세 */}
      <div className="pt-5">
        <p className="text-[14px] font-semibold text-zinc-900 mb-3">상세</p>
        {event.description.split('\n').map((line, i) => (
          <p key={i} className="text-[14px] text-zinc-600 leading-relaxed">{line}</p>
        ))}
      </div>
    </div>
  );
}
