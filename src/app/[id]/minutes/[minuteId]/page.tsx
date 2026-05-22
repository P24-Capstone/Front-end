'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

type TabType = '요약' | '스크립트' | '정보';

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

// ── AI 처리 중 배너 ──────────────────────────────────────────────
function ProcessingBanner() {
  return (
    <div className="mx-0 mb-3 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 flex items-center gap-3">
      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
      <div>
        <p className="text-[13px] font-semibold text-amber-700">AI가 회의록을 분석하고 있어요</p>
        <p className="text-[12px] text-amber-500 mt-0.5">완료되면 자동으로 업데이트됩니다.</p>
      </div>
    </div>
  );
}

// ── 실패 배너 ──────────────────────────────────────────────────
function FailedBanner() {
  return (
    <div className="mx-0 mb-3 rounded-xl bg-red-50 border border-red-100 px-4 py-3 flex items-center gap-3">
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth={2}>
        <circle cx="12" cy="12" r="10" />
        <path strokeLinecap="round" d="M12 8v4M12 16h.01" />
      </svg>
      <div>
        <p className="text-[13px] font-semibold text-red-600">AI 분석에 실패했습니다</p>
        <p className="text-[12px] text-red-400 mt-0.5">음성 파일을 확인한 후 다시 시도해 주세요.</p>
      </div>
    </div>
  );
}

export default function MinuteDetailPage() {
  const { id, minuteId } = useParams<{ id: string; minuteId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabType>('요약');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: myMembership } = useQuery({
    queryKey: ['members', 'me', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/members/me?teamId=${id}`);
      return data.data as MemberResponse;
    },
    enabled: !!id,
  });

  const isLeader = myMembership?.memRole === 'L' && myMembership?.memState === 'A';

  const { data: record, isLoading, isError } = useQuery({
    queryKey: ['meeting-record', minuteId],
    queryFn: async () => {
      const { data } = await api.get(`/api/meeting-records/${minuteId}`);
      return data.data as MeetingRecordResponse;
    },
    enabled: !!minuteId,
  });

  // status='P' 동안 5초마다 폴링
  useEffect(() => {
    if (record?.status !== 'P') return;
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['meeting-record', minuteId] });
    }, 5000);
    return () => clearInterval(interval);
  }, [record?.status, minuteId, queryClient]);

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/meeting-records/${minuteId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting-records', id] });
      router.back();
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-[14px] text-zinc-400">불러오는 중...</p>
      </div>
    );
  }

  if (isError || !record) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-[14px] text-zinc-400">회의록을 찾을 수 없습니다.</p>
        <button onClick={() => router.back()} className="text-[13px] text-[#3B3EFF]">돌아가기</button>
      </div>
    );
  }

  const isProcessing = record.status === 'P';
  const isFailed = record.status === 'F';

  return (
    <div className="flex flex-col min-h-full">
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-[300px] p-6 shadow-xl">
            <h3 className="text-[16px] font-bold text-zinc-900 text-center mb-2">회의록 삭제</h3>
            <p className="text-[13px] text-zinc-500 text-center mb-6">이 회의록을 삭제하시겠습니까?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-[14px] font-medium text-zinc-600 border border-zinc-200"
              >
                취소
              </button>
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 rounded-xl text-[14px] font-semibold text-white bg-red-500 disabled:opacity-60"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 제목 · 날짜 */}
      <div className="pt-5 pb-4">
        <h1 className="text-[17px] font-bold text-zinc-900 leading-snug mb-3">
          {record.meetingTitle || '제목 없음'}
        </h1>
        <div className="flex items-center gap-1.5">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth={2}>
            <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          <span className="text-[12px] text-zinc-400">{record.meetingRegDtm?.slice(0, 10)}</span>
        </div>
      </div>

      {/* 탭바 */}
      <div className="flex border-t border-b border-zinc-200 -mx-4 sticky top-0 z-10 bg-white">
        {(['요약', '스크립트', '정보'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 flex justify-center text-[13px] font-medium transition-colors ${tab === t ? 'text-zinc-900' : 'text-zinc-400'}`}
          >
            <span className={`inline-block py-2.5 -mb-px ${tab === t ? 'border-b-2 border-zinc-900' : ''}`}>
              {t}
            </span>
          </button>
        ))}
      </div>

      {/* 요약 */}
      {tab === '요약' && (
        <div className="flex-1 -mx-4 -mb-5 bg-[#EBEBFF] px-4 pt-4 pb-8 flex flex-col gap-3">
          {isProcessing && <ProcessingBanner />}
          {isFailed && <FailedBanner />}
          <div className="bg-white rounded-xl p-4">
            {isProcessing ? (
              <div className="flex flex-col items-center gap-3 py-6">
                <div className="w-8 h-8 border-2 border-zinc-200 border-t-[#3B3EFF] rounded-full animate-spin" />
                <p className="text-[13px] text-zinc-400">AI 요약 생성 중...</p>
              </div>
            ) : isFailed ? (
              <p className="text-[14px] text-zinc-400">AI 분석에 실패하여 요약을 생성할 수 없습니다.</p>
            ) : record.aiSummary ? (
              <p className="text-[14px] text-zinc-700 leading-relaxed whitespace-pre-wrap">{record.aiSummary}</p>
            ) : (
              <p className="text-[14px] text-zinc-400">AI 요약이 아직 생성되지 않았습니다.</p>
            )}
          </div>
        </div>
      )}

      {/* 스크립트 */}
      {tab === '스크립트' && (
        <div className="flex-1 -mx-4 -mb-5 bg-[#EBEBFF] px-4 pt-4 pb-8">
          {isProcessing && <ProcessingBanner />}
          {isFailed && <FailedBanner />}
          <div className="bg-white rounded-xl p-4">
            {isProcessing ? (
              <div className="flex flex-col items-center gap-3 py-6">
                <div className="w-8 h-8 border-2 border-zinc-200 border-t-[#3B3EFF] rounded-full animate-spin" />
                <p className="text-[13px] text-zinc-400">STT 변환 중...</p>
              </div>
            ) : isFailed ? (
              <p className="text-[14px] text-zinc-400">AI 분석에 실패하여 스크립트를 생성할 수 없습니다.</p>
            ) : record.fullScript ? (
              <p className="text-[13px] text-zinc-700 leading-relaxed whitespace-pre-wrap">{record.fullScript}</p>
            ) : (
              <p className="text-[14px] text-zinc-400">스크립트가 없습니다.</p>
            )}
          </div>
        </div>
      )}

      {/* 정보 */}
      {tab === '정보' && (
        <div className="flex-1 -mx-4 -mb-5 bg-[#EBEBFF] px-4 pt-4 pb-8">
          {isProcessing && <ProcessingBanner />}
          {isFailed && <FailedBanner />}
          <div className="bg-white rounded-xl overflow-hidden">
            {[
              { label: '상태', value: isProcessing ? '처리 중' : isFailed ? '생성 실패' : '완료' },
              { label: '생성일시', value: record.meetingRegDtm },
              { label: '음성파일', value: record.recFileKey || '-' },
            ].map(({ label, value }, i, arr) => (
              <div
                key={label}
                className={`flex items-center justify-between px-4 py-3.5 ${i < arr.length - 1 ? 'border-b border-zinc-50' : ''}`}
              >
                <span className="text-[13px] text-zinc-400">{label}</span>
                <span
                  className={`text-[13px] font-medium truncate max-w-[200px] ${
                    label === '상태' && isProcessing ? 'text-amber-500' :
                    label === '상태' && isFailed ? 'text-red-400' :
                    'text-zinc-800'
                  }`}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>

          {isLeader && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full mt-4 py-3 rounded-xl text-[14px] font-semibold text-red-500 border border-red-200 bg-white"
            >
              회의록 삭제
            </button>
          )}
        </div>
      )}
    </div>
  );
}
