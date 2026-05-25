'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

type SortType = '생성일순' | '이름순';

interface MeetingRecordResponse {
  meetingId: number;
  teamId: string;
  recFileKey: string;
  status: string;           // P(처리중) | C(완료) | F(실패)
  meetingTitle: string | null;
  fullScript: string | null;
  aiSummary: string | null;
  meetingRegDtm: string;
}

interface MemberResponse {
  memRole: string;
  memState: string;
}

function parseDtm(dtm: string) {
  // "YYYY-MM-DD HH:mm:ss" → Date (ISO 형식으로 변환)
  return new Date(dtm.replace(' ', 'T'));
}

function getGroup(dtm: string): '지난 7일' | '지난 30일' | '이전' {
  const diff = Math.floor((Date.now() - parseDtm(dtm).getTime()) / 86400000);
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

function StatusBadge({ status }: { status: string }) {
  if (status === 'C') {
    return (
      <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-full bg-[#EBEBFF] text-[#3B3EFF]">
        AI 요약
      </span>
    );
  }
  if (status === 'P') {
    return (
      <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-500 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />
        처리 중
      </span>
    );
  }
  if (status === 'F') {
    return (
      <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-full bg-red-50 text-red-400">
        생성 실패
      </span>
    );
  }
  return null;
}

function MinuteCard({ record, groupId }: { record: MeetingRecordResponse; groupId: string }) {
  const queryClient = useQueryClient();
  const isFailed = record.status === 'F';

  const retryMutation = useMutation({
    mutationFn: () => api.post(`/api/meeting-records/${record.meetingId}/retry`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting-records', groupId] });
    },
    onError: () => alert('재시도에 실패했습니다. 잠시 후 다시 시도해 주세요.'),
  });

  return (
    <div className="bg-white rounded-lg overflow-hidden">
      <Link href={`/${groupId}/minutes/${record.meetingId}`}>
        <div className="px-4 py-3.5 flex items-center gap-3 active:bg-zinc-50 transition-colors">
          <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
            <MicIcon />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-1 mb-1.5">
              <StatusBadge status={record.status} />
            </div>
            <p className="text-[14px] font-medium text-zinc-800 truncate">
              {record.meetingTitle || '제목 없음'}
            </p>
            <p className="text-[12px] text-zinc-400 mt-0.5">{record.meetingRegDtm?.slice(0, 10)}</p>
          </div>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#d4d4d8" strokeWidth={2.5} className="shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
          </svg>
        </div>
      </Link>

      {/* 실패 시 재시도 버튼 */}
      {isFailed && (
        <div className="px-4 pb-3 border-t border-zinc-50">
          <button
            onClick={() => retryMutation.mutate()}
            disabled={retryMutation.isPending}
            className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 disabled:opacity-50 text-[12px] font-semibold transition-colors"
          >
            {retryMutation.isPending ? (
              <>
                <span className="w-3 h-3 border-2 border-red-300 border-t-red-400 rounded-full animate-spin" />
                재시도 중...
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                AI 분석 재시도
              </>
            )}
          </button>
        </div>
      )}
    </div>
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
    // 처리 중인 항목이 있으면 5초마다 갱신
    refetchInterval: (query) => {
      const list = query.state.data as MeetingRecordResponse[] | undefined;
      return list?.some((r) => r.status === 'P') ? 5000 : false;
    },
  });

  const sorted = [...records].sort((a, b) => {
    if (sort === '이름순') return (a.meetingTitle ?? '').localeCompare(b.meetingTitle ?? '', 'ko');
    return b.meetingRegDtm.localeCompare(a.meetingRegDtm);
  });

  const GROUP_LABELS = ['지난 7일', '지난 30일', '이전'] as const;
  const groups = GROUP_LABELS.map((label) => ({
    label,
    items: sorted.filter((m) => getGroup(m.meetingRegDtm) === label),
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
            href={`/${id}/minutes/new`}
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
