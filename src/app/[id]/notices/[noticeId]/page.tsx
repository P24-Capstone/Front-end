'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '@/lib/api';

interface NoticeResponse {
  notiId: number;
  notiTitle: string;
  notiContent: string;
  notiFix: string;
  regDtm: string;
  modDtm: string;
  teamId: string;
}

interface MemberResponse {
  memRole: string;
  memState: string;
}

function DeleteConfirmPopup({ onConfirm, onCancel, isPending }: {
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onCancel} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-xl w-[280px] overflow-hidden">
        <div className="px-6 pt-6 pb-5 text-center">
          <div className="w-11 h-11 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
            </svg>
          </div>
          <p className="text-[15px] font-bold text-zinc-900 mb-1">공지를 삭제할까요?</p>
          <p className="text-[13px] text-zinc-400">삭제된 공지는 복구할 수 없어요.</p>
        </div>
        <div className="flex border-t border-zinc-100">
          <button
            onClick={onCancel}
            className="flex-1 py-3.5 text-[14px] font-medium text-zinc-500 border-r border-zinc-100"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 py-3.5 text-[14px] font-semibold text-red-500"
          >
            {isPending ? '삭제 중...' : '삭제'}
          </button>
        </div>
      </div>
    </>
  );
}

export default function NoticeDetailPage() {
  const { id, noticeId } = useParams<{ id: string; noticeId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: notice, isLoading } = useQuery({
    queryKey: ['notice', noticeId],
    queryFn: async () => {
      const { data } = await api.get(`/api/notices/${noticeId}`);
      return data.data as NoticeResponse;
    },
    enabled: !!noticeId,
  });

  const { data: myMembership } = useQuery({
    queryKey: ['members', 'me', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/members/me?teamId=${id}`);
      return data.data as MemberResponse;
    },
    enabled: !!id,
  });

  const isLeader = myMembership?.memRole === 'L' && myMembership?.memState === 'A';

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/api/notices/${noticeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices', id] });
      router.push(`/${id}/notices`);
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || '삭제에 실패했습니다.');
    },
  });


  if (isLoading) {
    return <div className="text-center py-20 text-zinc-500 text-sm">불러오는 중...</div>;
  }

  if (!notice) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-[14px] text-zinc-400">공지를 찾을 수 없습니다.</p>
        <button onClick={() => router.back()} className="text-[13px] text-blue-500">돌아가기</button>
      </div>
    );
  }

  return (
    <div className="pt-5 px-1">
      {/* 제목 */}
      <div className="pb-5 border-b border-zinc-100">
        {notice.notiFix === 'Y' && (
          <p className="text-[11px] font-medium text-zinc-400 mb-2">고정됨</p>
        )}
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-[18px] font-bold text-zinc-900 break-words flex-1">{notice.notiTitle}</h1>
          {isLeader && (
            <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
              <button
                onClick={() => router.push(`/${id}/notices/${noticeId}/edit`)}
                className="text-[13px] font-medium text-zinc-500 border border-zinc-200 rounded-lg px-3 py-1"
              >
                수정
              </button>
              <button
                onClick={() => setDeleteOpen(true)}
                className="text-[13px] font-medium text-zinc-500 border border-zinc-200 rounded-lg px-3 py-1"
              >
                삭제
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 날짜 · 작성자 */}
      <div className="flex items-center gap-4 py-4 border-b border-zinc-100">
        <div className="flex items-center gap-1.5">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth={2}>
            <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          <span className="text-[12px] text-zinc-400">{notice.regDtm}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span className="text-[12px] text-zinc-400">모임장</span>
        </div>
      </div>

      {/* 내용 */}
      <div className="pt-5">
        {notice.notiContent?.split('\n').map((line, i) => (
          <p key={i} className="text-[14px] text-zinc-700 leading-relaxed mb-1">{line}</p>
        ))}
      </div>

      {deleteOpen && (
        <DeleteConfirmPopup
          onConfirm={() => deleteMutation.mutate()}
          onCancel={() => setDeleteOpen(false)}
          isPending={deleteMutation.isPending}
        />
      )}
    </div>
  );
}