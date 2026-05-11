'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

interface EventResponse {
  evtId: number;
  evtTitle: string;
  evtContent: string;
  evtStartDt: string;
  evtEndDt: string;
  evtRegDtm: string;
  teamId: string;
}

export default function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const router = useRouter();

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const { data } = await api.get(`/api/events/${eventId}`);
      return data.data as EventResponse;
    },
    enabled: !!eventId,
  });

  if (isLoading) {
    return <div className="text-center py-20 text-zinc-500 text-sm">불러오는 중...</div>;
  }

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

  // Parse dates
  const start = new Date(event.evtStartDt);
  const end = new Date(event.evtEndDt);
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  const dateStr = `${start.getFullYear()}년 ${start.getMonth() + 1}월 ${start.getDate()}일 (${dayNames[start.getDay()]})`;

  return (
    <div className="pt-5 px-1">
      {/* 제목 */}
      <div className="flex items-center gap-2.5 pb-5 border-b border-zinc-100">
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#3B3EFF" strokeWidth={1.8} className="shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
        <h1 className="text-[18px] font-bold text-zinc-900 break-words">{event.evtTitle}</h1>
      </div>

      {/* 정보 */}
      <div className="py-5 space-y-4 border-b border-zinc-100">
        <div className="flex items-center gap-3">
          <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth={2} className="shrink-0">
            <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          <span className="text-[14px] text-zinc-700">
            {dateStr}
          </span>
        </div>

        {/* Backend Event does not support location and member list yet */}
        {/* <div className="flex items-center gap-3">...</div> */}
      </div>

      {/* 상세 */}
      <div className="pt-5">
        <p className="text-[14px] font-semibold text-zinc-900 mb-3">상세</p>
        {event.evtContent?.split('\n').map((line, i) => (
          <p key={i} className="text-[14px] text-zinc-600 leading-relaxed">{line}</p>
        ))}
      </div>
    </div>
  );
}
