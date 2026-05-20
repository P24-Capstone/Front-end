'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

interface NoticeResponse {
  notiId: number;
  notiTitle: string;
  notiContent: string;
  notiFix: string;
  notiRequired: string;
  regDtm: string;
  modDtm: string;
  teamId: string;
}

interface MemberMe {
  memRole: string;
  memState: string;
}

type SortType = '최근순' | '제목순';

function PinIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="17" x2="12" y2="22" />
      <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
    </svg>
  );
}

function NoticeItem({ notice, id }: { notice: NoticeResponse; id: string }) {
  const isPinned = notice.notiFix === 'Y';
  const isRequired = notice.notiRequired === 'Y';

  return (
    <Link
      href={`/${id}/notices/${notice.notiId}`}
      className="flex items-start justify-between py-3 border-b border-zinc-100 gap-2"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          {isRequired && (
            <span className="text-[11px] font-semibold text-white bg-[#3B3EFF] rounded-full px-2 py-0.5 shrink-0">
              필독
            </span>
          )}
          <p className="text-[14px] font-medium text-zinc-900">{notice.notiTitle}</p>
        </div>
        <p className="text-[12px] text-zinc-400 mt-1">{notice.regDtm.split(' ')[0]}</p>
      </div>
      {isPinned && (
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

  const { data: notices, isLoading } = useQuery({
    queryKey: ['notices', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/notices?teamId=${id}`);
      return data.data as NoticeResponse[];
    },
    enabled: !!id,
  });

  const { data: myMember } = useQuery<MemberMe>({
    queryKey: ['memberMe', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/members/me?teamId=${id}`);
      return data.data;
    },
    enabled: !!id,
  });

  const isLeader = myMember?.memRole === 'L' && myMember?.memState === 'A';

  if (isLoading) {
    return <div className="text-center py-10 text-zinc-500 text-sm">불러오는 중...</div>;
  }

  const safeNotices = notices || [];
  const pinned = safeNotices.filter((n) => n.notiFix === 'Y');
  const rest = safeNotices.filter((n) => n.notiFix !== 'Y').sort((a, b) =>
    sort === '제목순' ? a.notiTitle.localeCompare(b.notiTitle) : b.regDtm.localeCompare(a.regDtm)
  );

  return (
    <div className="pt-2">
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

      {/* 고정 공지 */}
      {pinned.length > 0 && (
        <div className="mb-4">
          {pinned.map((notice) => (
            <NoticeItem key={notice.notiId} notice={notice} id={id} />
          ))}
        </div>
      )}

      {/* 일반 공지 목록 */}
      <div className="pb-20">
        {rest.length === 0 && pinned.length === 0 && (
          <div className="text-center py-10 text-zinc-500 text-sm">등록된 공지가 없습니다.</div>
        )}
        {rest.map((notice) => (
          <NoticeItem key={notice.notiId} notice={notice} id={id} />
        ))}
      </div>

      {/* 글쓰기 플로팅 버튼 */}
      {isLeader && (
        <Link
          href={`/${id}/notices/new`}
          className="fixed bottom-[80px] right-6 w-12 h-12 bg-[#3B3EFF] rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors z-10 max-w-[390px]"
          style={{ right: 'calc(50% - 195px + 24px)', left: 'auto' }}
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