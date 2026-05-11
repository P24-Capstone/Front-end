'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { NOTICES, type Notice } from './_data';

type SortType = '최근순' | '제목순';

function PinIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="17" x2="12" y2="22" />
      <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
    </svg>
  );
}

function NoticeItem({ notice, id }: { notice: Notice; id: string }) {
  return (
    <Link
      href={`/${id}/notices/${notice.id}`}
      className="flex items-start justify-between py-3 border-b border-zinc-100 gap-2"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          {notice.isRequired && (
            <span className="text-[11px] font-semibold text-white bg-[#3B3EFF] rounded-full px-2 py-0.5 shrink-0">
              필독
            </span>
          )}
          <p className="text-[14px] font-medium text-zinc-900">{notice.title}</p>
        </div>
        <p className="text-[12px] text-zinc-400 mt-1">{notice.date}</p>
      </div>
      {notice.isPinned && (
        <div className="shrink-0 mt-0.5">
          <PinIcon />
        </div>
      )}
    </Link>
  );
}

export default function NoticesPage() {
  const { id } = useParams<{ id: string }>();
  const [sort, setSort] = useState<SortType>('최근순');

  const pinned = NOTICES.filter((n) => n.isPinned);
  const rest = NOTICES.filter((n) => !n.isPinned).sort((a, b) =>
    sort === '제목순' ? a.title.localeCompare(b.title) : b.date.localeCompare(a.date)
  );

  return (
    <div className="pt-2">
      {/* 고정 공지 */}
      {pinned.length > 0 && (
        <div className="mb-4">
          {pinned.map((notice) => (
            <NoticeItem key={notice.id} notice={notice} id={id} />
          ))}
        </div>
      )}

      {/* 정렬 */}
      <div className="flex items-center justify-center mb-1 pb-3 border-b border-zinc-100">
        <button
          onClick={() => setSort('최근순')}
          className={`text-[13px] px-2 ${sort === '최근순' ? 'font-semibold text-zinc-900' : 'text-zinc-400'}`}
        >
          최근순
        </button>
        <span className="text-zinc-300 text-[13px]">|</span>
        <button
          onClick={() => setSort('제목순')}
          className={`text-[13px] px-2 ${sort === '제목순' ? 'font-semibold text-zinc-900' : 'text-zinc-400'}`}
        >
          제목순
        </button>
      </div>

      {/* 일반 공지 목록 */}
      <div>
        {rest.map((notice) => (
          <NoticeItem key={notice.id} notice={notice} id={id} />
        ))}
      </div>
    </div>
  );
}
