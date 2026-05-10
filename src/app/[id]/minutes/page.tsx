'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { MINUTES, type Minute } from './_data';

type SortType = '생성일순' | '이름순' | '최근수정일순';

const isLeader = true; // TODO: from auth

function getGroup(dateStr: string): '지난 7일' | '지난 30일' | '이전' {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (diff <= 7) return '지난 7일';
  if (diff <= 30) return '지난 30일';
  return '이전';
}

function MicIcon() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="8" y1="23" x2="16" y2="23" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function KebabIcon() {
  return (
    <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24" className="text-zinc-300">
      <circle cx="12" cy="5" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="12" cy="19" r="1.5" />
    </svg>
  );
}

function MinuteCard({ minute, groupId }: { minute: Minute; groupId: string }) {
  return (
    <Link href={`/${groupId}/minutes/${minute.id}`}>
      <div className="bg-white rounded-lg px-4 py-3.5 flex items-center gap-3 active:bg-zinc-50 transition-colors">
        <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
          <MicIcon />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-1 mb-1.5">
            {minute.tags.map((t) => (
              <span key={t.label} className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full ${t.className}`}>
                {t.label}
              </span>
            ))}
          </div>
          <p className="text-[14px] font-medium text-zinc-800 truncate">{minute.title}</p>
        </div>
        <button onClick={(e) => e.preventDefault()} className="shrink-0 p-1">
          <KebabIcon />
        </button>
      </div>
    </Link>
  );
}

export default function MinutesPage() {
  const { id } = useParams<{ id: string }>();
  const [sort, setSort] = useState<SortType>('생성일순');

  const sorted = [...MINUTES].sort((a, b) => {
    if (sort === '이름순') return a.title.localeCompare(b.title, 'ko');
    if (sort === '최근수정일순') return b.updatedAt.localeCompare(a.updatedAt);
    return b.createdAt.localeCompare(a.createdAt);
  });

  const dateKey = sort === '최근수정일순' ? 'updatedAt' : 'createdAt';
  const GROUP_LABELS = ['지난 7일', '지난 30일', '이전'] as const;
  const groups = GROUP_LABELS.map((label) => ({
    label,
    items: sorted.filter((m) => getGroup(m[dateKey]) === label),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 -mx-4 -mb-5 bg-zinc-100 px-4 pt-4 pb-28">
        {/* 정렬 */}
        <div className="flex items-center justify-center mb-4">
          {(['생성일순', '이름순', '최근수정일순'] as const).map((s, i) => (
            <span key={s} className="flex items-center">
              {i > 0 && <span className="text-zinc-300 text-[13px]">|</span>}
              <button
                onClick={() => setSort(s)}
                className={`text-[13px] px-2 ${sort === s ? 'font-semibold text-zinc-900' : 'text-zinc-400'}`}
              >
                {s}
              </button>
            </span>
          ))}
        </div>

        {/* 목록 */}
        {sort === '이름순' ? (
          <div className="flex flex-col gap-3">
            {sorted.map((m) => <MinuteCard key={m.id} minute={m} groupId={id} />)}
          </div>
        ) : (
          groups.map(({ label, items }) => (
            <div key={label} className="mb-5">
              <p className="text-[12px] font-medium text-zinc-400 mb-2 px-1">{label}</p>
              <div className="flex flex-col gap-3">
                {items.map((m) => <MinuteCard key={m.id} minute={m} groupId={id} />)}
              </div>
            </div>
          ))
        )}

        {MINUTES.length === 0 && (
          <p className="text-center text-[13px] text-zinc-400 py-10">회의록이 없습니다.</p>
        )}

        {/* FAB */}
        {isLeader && (
          <Link
            href={`/${id}/minutes/create`}
            className="fixed bottom-6 bg-[#3B3EFF] text-white text-[13px] font-semibold px-4 py-2.5 rounded-full shadow-lg flex items-center gap-1.5"
            style={{ right: 'max(1rem, calc((100vw - 390px) / 2 + 1rem))' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
            </svg>
            새 회의록
          </Link>
        )}
      </div>
    </div>
  );
}
