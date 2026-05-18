'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

type SortType = '생성일순' | '이름순';

interface MeetingRecordResponse {
  meetingId: number;
  meetingTitle: string;
  fullScript: string;
  aiSummary: string;
  regDtm: string;
  teamId: string;
  recFileKey: string;
}

interface MemberResponse {
  memRole: string;
  memState: string;
}

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

function MinuteCard({ record, groupId }: { record: MeetingRecordResponse; groupId: string }) {
  const hasAiSummary = !!record.aiSummary;
  return (
    <Link href={`/${groupId}/minutes/${record.meetingId}`}>
      <div className="bg-white rounded-lg px-4 py-3.5 flex items-center gap-3 active:bg-zinc-50 transition-colors">
        <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
          <MicIcon />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-1 mb-1.5">
            {hasAiSummary && (
              <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-full bg-[#EBEBFF] text-[#3B3EFF]">
                AI 요약
              </span>
            )}
          </div>
          <p className="text-[14px] font-medium text-zinc-800 truncate">
            {record.meetingTitle || '제목 없음'}
          </p>
          <p className="text-[12px] text-zinc-400 mt-0.5">{record.regDtm?.slice(0, 10)}</p>
        </div>
      </div>
    </Link>
  );
}

export default function MinutesPage() {
  const { id } = useParams<{ id: string }>();
  const [sort, setSort] = useState<SortType>('생성일순');

  const { data: myMembership } = useQuery({
    queryKey: ['members', 'me', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/members/me?teamId=${id}`);
      return data.data as MemberResponse;
    },
    enabled: !!id,
  });

  const isLeader = myMembership?.memRole === 'L' && myMembership?.memState === 'A';

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['meeting-records', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/meeting-records?teamId=${id}`);
      return data.data as MeetingRecordResponse[];
    },
    enabled: !!id,
  });

  const sorted = [...records].sort((a, b) => {
    if (sort === '이름순') return (a.meetingTitle ?? '').localeCompare(b.meetingTitle ?? '', 'ko');
    return b.regDtm.localeCompare(a.regDtm);
  });

  const GROUP_LABELS = ['지난 7일', '지난 30일', '이전'] as const;
  const groups = GROUP_LABELS.map((label) => ({
    label,
    items: sorted.filter((m) => getGroup(m.regDtm) === label),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 -mx-4 -mb-5 bg-zinc-100 px-4 pt-4 pb-28">
        {/* 정렬 */}
        <div className="flex items-center justify-center mb-4">
          {(['생성일순', '이름순'] as const).map((s, i) => (
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

        {isLoading && <p className="text-center text-[13px] text-zinc-400 py-10">불러오는 중...</p>}
        {!isLoading && records.length === 0 && (
          <p className="text-center text-[13px] text-zinc-400 py-10">회의록이 없습니다.</p>
        )}

        {/* 목록 */}
        {sort === '이름순' ? (
          <div className="flex flex-col gap-3">
            {sorted.map((m) => <MinuteCard key={m.meetingId} record={m} groupId={id} />)}
          </div>
        ) : (
          groups.map(({ label, items }) => (
            <div key={label} className="mb-5">
              <p className="text-[12px] font-medium text-zinc-400 mb-2 px-1">{label}</p>
              <div className="flex flex-col gap-3">
                {items.map((m) => <MinuteCard key={m.meetingId} record={m} groupId={id} />)}
              </div>
            </div>
          ))
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
