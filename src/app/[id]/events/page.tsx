'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

type TabType = '다가오는 일정' | '지난 일정';

interface EventResponse {
  evtId: number;
  evtTitle: string;
  evtContent: string;
  evtStartDt: string;
  evtEndDt: string;
  evtRegDtm: string;
  teamId: string;
}

interface MemberMe {
  memRole: string;
  memState: string;
}

export default function EventsPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<TabType>('다가오는 일정');

  const { data: myMember } = useQuery<MemberMe>({
    queryKey: ['memberMe', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/members/me?teamId=${id}`);
      return data.data;
    },
    enabled: !!id,
  });

  const isLeader = myMember?.memRole === 'L' && myMember?.memState === 'A';

  const { data: eventsData, isLoading } = useQuery({
    queryKey: ['events', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/events?teamId=${id}`);
      return data.data as EventResponse[];
    },
    enabled: !!id,
  });

  const now = new Date();
  // Set now to beginning of day to include today's events in upcoming
  now.setHours(0, 0, 0, 0);

  const allEvents = eventsData || [];
  
  const parsedEvents = allEvents.map(evt => {
    // "YYYY-MM-DD" or similar format supported by Date
    const d = new Date(evt.evtStartDt);
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    return {
      id: evt.evtId,
      title: evt.evtTitle,
      date: d,
      month: d.getMonth() + 1,
      dateNum: d.getDate(),
      dateDay: dayNames[d.getDay()],
    };
  });

  const upcoming = parsedEvents.filter(e => e.date >= now).sort((a, b) => a.date.getTime() - b.date.getTime());
  const past = parsedEvents.filter(e => e.date < now).sort((a, b) => b.date.getTime() - a.date.getTime());

  const events = tab === '다가오는 일정' ? upcoming : past;

  if (isLoading) {
    return <div className="text-center py-20 text-zinc-500 text-sm">불러오는 중...</div>;
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* 서브 탭 */}
      <div className="flex border-b border-zinc-200 -mx-4 sticky top-0 z-10 bg-white">
        {(['다가오는 일정', '지난 일정'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 flex justify-center text-[13px] font-medium transition-colors whitespace-nowrap ${
              tab === t ? 'text-zinc-900' : 'text-zinc-400'
            }`}
          >
            <span className={`inline-block py-2.5 -mb-px ${tab === t ? 'border-b-2 border-zinc-900' : ''}`}>
              {t}
            </span>
          </button>
        ))}
      </div>

      {/* 일정 목록 */}
      <div className="flex-1 -mx-4 -mb-5 bg-zinc-50 px-4 pt-4 pb-20">
        {events.length === 0 && (
          <p className="text-center text-[13px] text-zinc-400 py-10">일정이 없습니다.</p>
        )}

        {events.length > 0 && (
          <div className="relative">
            {events.length > 1 && (
              <div className="absolute left-[18px] top-[40px] bottom-[28px] w-px bg-zinc-200" />
            )}

            {events.map((event, index) => {
              const isFirstOfMonth = index === 0 || events[index - 1].month !== event.month;
              return (
                <div key={event.id} className="flex gap-3 mb-4 relative z-0">
                  {/* 월 레이블 */}
                  <div className="relative z-10 flex flex-col items-center w-9 shrink-0">
                    {isFirstOfMonth ? (
                      <div className="flex flex-col items-center bg-zinc-50 pb-1">
                        <span className="text-[22px] font-bold leading-none text-zinc-800">{event.month}</span>
                        <span className="text-[11px] text-zinc-400 mt-0.5">월</span>
                      </div>
                    ) : (
                      <div className="h-[34px]" />
                    )}
                  </div>

                  {/* 카드 */}
                  <Link href={`/${id}/events/${event.id}`} className="flex-1">
                    <div className="bg-white border border-zinc-200 shadow-sm rounded-xl px-4 py-3.5 active:bg-zinc-50 transition-colors">
                      <p className="text-[12px] font-semibold text-[#3B3EFF]">
                        {event.dateNum}일 {event.dateDay}
                      </p>
                      <p className="text-[14px] font-semibold text-zinc-900 mt-1">{event.title}</p>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isLeader && (
        <Link
          href={`/${id}/events/new`}
          className="fixed bottom-[80px] w-12 h-12 bg-[#3B3EFF] rounded-full flex items-center justify-center shadow-lg z-20"
          style={{ right: 'calc(50% - 195px + 24px)' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </Link>
      )}
    </div>
  );
}
