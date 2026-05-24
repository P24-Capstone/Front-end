'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

export default function NoticesPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
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
    return (
      <div className="flex-1 -mx-4 -mb-5 bg-zinc-100 px-4 flex items-center justify-center py-20">
        <p className="text-[13px] text-zinc-400">불러오는 중...</p>
      </div>
    );
  }

  const safeNotices = notices ?? [];
  const pinned = safeNotices.filter((n) => n.notiFix === 'Y');
  const rest = safeNotices
    .filter((n) => n.notiFix !== 'Y')
    .sort((a, b) =>
      sort === '제목순'
        ? a.notiTitle.localeCompare(b.notiTitle)
        : b.regDtm.localeCompare(a.regDtm)
    );

  const NoticeCard = ({ notice, pinned: isPinned }: { notice: NoticeResponse; pinned?: boolean }) => {
    const isRequired = notice.notiRequired === 'Y';
    const preview = notice.notiContent?.replace(/\n/g, ' ').slice(0, 60) ?? '';

    return (
      <button
        onClick={() => router.push(`/${id}/notices/${notice.notiId}`)}
        className="w-full bg-white rounded-xl px-4 py-3.5 flex items-start gap-3 text-left"
      >
        {/* 아이콘 */}
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${isPinned ? 'bg-[#EBEBFF]' : 'bg-zinc-100'}`}>
          {isPinned ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B3EFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="17" x2="12" y2="22" />
              <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          )}
        </div>

        {/* 텍스트 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            {isRequired && (
              <span className="text-[10px] font-semibold text-white bg-[#3B3EFF] rounded-full px-1.5 py-0.5 shrink-0">필독</span>
            )}
            {isPinned && (
              <span className="text-[10px] font-semibold text-[#3B3EFF] bg-[#EBEBFF] rounded-full px-1.5 py-0.5 shrink-0">고정</span>
            )}
            <p className="text-[14px] font-semibold text-zinc-900 truncate">{notice.notiTitle}</p>
          </div>
          {preview && (
            <p className="text-[12px] text-zinc-400 truncate mt-0.5">{preview}</p>
          )}
          <p className="text-[11px] text-zinc-300 mt-1">{notice.regDtm.split(' ')[0]}</p>
        </div>

        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d4d4d8" strokeWidth={2.5} className="shrink-0 mt-1">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
        </svg>
      </button>
    );
  };

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 -mx-4 -mb-5 bg-zinc-100 px-4 pt-4 pb-28">

        {/* 정렬 */}
        <div className="flex items-center justify-center mb-3">
          {(['최근순', '제목순'] as SortType[]).map((s, i) => (
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

        {safeNotices.length === 0 ? (
          <p className="text-center text-[13px] text-zinc-400 py-12">등록된 공지가 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {/* 고정 공지 */}
            {pinned.map((n) => <NoticeCard key={n.notiId} notice={n} pinned />)}
            {/* 일반 공지 */}
            {rest.map((n) => <NoticeCard key={n.notiId} notice={n} />)}
          </div>
        )}
      </div>

      {/* 리더 전용 플로팅 버튼 */}
      {isLeader && (
        <button
          onClick={() => router.push(`/${id}/notices/new`)}
          className="fixed bottom-[80px] w-12 h-12 bg-[#3B3EFF] rounded-full flex items-center justify-center shadow-lg z-20"
          style={{ right: 'calc(50% - 195px + 24px)' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      )}
    </div>
  );
}
