'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { UPCOMING, PAST } from './_data';

type TabType = '다가오는 일정' | '지난 일정';

export default function EventsPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<TabType>('다가오는 일정');

  const events = tab === '다가오는 일정' ? UPCOMING : PAST;

  return (
    <div className="space-y-4">
      {/* 서브 탭 */}
      <div className="flex justify-center border-b border-zinc-200 -mx-4 px-4 sticky top-0 z-10 bg-white">
        {(['다가오는 일정', '지난 일정'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2.5 mx-5 text-[13px] font-medium transition-colors whitespace-nowrap ${
              tab === t
                ? 'text-zinc-900 border-b-2 border-zinc-900 -mb-px'
                : 'text-zinc-400'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* 일정 목록 */}
      <div className="pt-1">
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
                <div key={event.id} className="flex gap-3 mb-4">
                  {/* 월 레이블 */}
                  <div className="relative z-10 flex flex-col items-center w-9 shrink-0">
                    {isFirstOfMonth ? (
                      <div className="flex flex-col items-center bg-white">
                        <span className="text-[22px] font-bold leading-none text-zinc-800">{event.month}</span>
                        <span className="text-[11px] text-zinc-400 mt-0.5">월</span>
                      </div>
                    ) : (
                      <div className="h-[34px]" />
                    )}
                  </div>

                  {/* 카드 */}
                  <Link href={`/${id}/events/${event.id}`} className="flex-1">
                    <div className="bg-white border border-zinc-200 rounded-xl px-4 py-3.5 shadow-sm active:bg-zinc-50 transition-colors">
                      <p className="text-[12px] font-semibold text-blue-500">
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
    </div>
  );
}
