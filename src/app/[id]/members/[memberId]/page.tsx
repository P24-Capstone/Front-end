'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

interface MemberResponse {
  memId: string;
  memNic: string;
  memRole: string;
  memState: string;
  regDtm: string;
  procDtm: string | null;
  userId: string;
  teamId: string;
}

const STATE_LABELS: Record<string, string> = {
  A: '활동 중',
  W: '가입 대기',
  R: '가입 거절',
};

const STATE_DOT: Record<string, string> = {
  A: 'bg-green-500',
  W: 'bg-yellow-400',
  R: 'bg-red-500',
};

function EditModal({
  member,
  onClose,
  onSave,
  isPending,
}: {
  member: MemberResponse;
  onClose: () => void;
  onSave: (nick: string) => void;
  isPending: boolean;
}) {
  const [nick, setNick] = useState(member.memNic ?? '');
  const [bio, setBio] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-[320px] p-6 shadow-xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h3 className="text-[16px] font-bold text-zinc-900 text-center mb-5">프로필 수정</h3>

        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-full bg-[#C4B5FD] flex items-center justify-center text-[22px] font-bold text-white shrink-0">
            {nick[0] || '?'}
          </div>
          <button className="flex-1 h-10 border border-zinc-300 rounded-xl text-[13px] font-medium text-zinc-700">
            이미지 업로드
          </button>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <span className="text-[13px] font-medium text-zinc-600 w-16 shrink-0">닉네임</span>
          <input
            value={nick}
            onChange={(e) => setNick(e.target.value)}
            className="flex-1 border border-[#3B3EFF] rounded-lg px-3 py-1.5 text-[13px] outline-none"
          />
        </div>

        <div className="flex items-center gap-3 mb-5">
          <span className="text-[13px] font-medium text-zinc-600 w-16 shrink-0">한줄 소개</span>
          <input
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="한줄 소개"
            className="flex-1 border border-zinc-200 rounded-lg px-3 py-1.5 text-[13px] outline-none"
          />
        </div>

        <button
          onClick={() => onSave(nick)}
          disabled={isPending}
          className="w-full bg-[#3B3EFF] text-white text-[14px] font-semibold rounded-xl py-2.5 disabled:opacity-60"
        >
          완료
        </button>
      </div>
    </div>
  );
}

export default function MemberDetailPage() {
  const { id, memberId } = useParams<{ id: string; memberId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showKickConfirm, setShowKickConfirm] = useState(false);

  const { data: myMembership } = useQuery({
    queryKey: ['memberMe', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/members/me?teamId=${id}`);
      return data.data as MemberResponse;
    },
    enabled: !!id,
  });

  const isLeader = myMembership?.memRole === 'L' && myMembership?.memState === 'A';

  const { data: member, isLoading } = useQuery({
    queryKey: ['member', memberId],
    queryFn: async () => {
      const { data } = await api.get(`/api/members/${memberId}`);
      return data.data as MemberResponse;
    },
    enabled: !!memberId,
  });

  const isOwnProfile = member?.memId === myMembership?.memId;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['members', id] });
    queryClient.invalidateQueries({ queryKey: ['member', memberId] });
    queryClient.invalidateQueries({ queryKey: ['memberMe', id] });
  };

  const approveMutation = useMutation({
    mutationFn: () => api.patch(`/api/members/${memberId}/approve`),
    onSuccess: () => { invalidate(); router.back(); },
  });

  const rejectMutation = useMutation({
    mutationFn: () => api.patch(`/api/members/${memberId}/reject`),
    onSuccess: () => { invalidate(); router.back(); },
  });

  const saveMutation = useMutation({
    mutationFn: (nick: string) => api.patch(`/api/members/${memberId}`, { memNic: nick }),
    onSuccess: () => { invalidate(); setShowEditModal(false); },
  });

  const kickMutation = useMutation({
    mutationFn: () => api.delete(`/api/members/${memberId}`),
    onSuccess: () => { invalidate(); router.back(); },
  });

  if (isLoading) {
    return <div className="text-center py-20 text-zinc-500 text-sm">불러오는 중...</div>;
  }

  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-[14px] text-zinc-400">멤버 정보를 찾을 수 없습니다.</p>
        <button onClick={() => router.back()} className="text-[13px] text-blue-500">돌아가기</button>
      </div>
    );
  }

  const canActOnMember = isLeader && member.memState === 'W';

  return (
    <div className="pt-6 px-1">
      {showKickConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-[300px] p-6 shadow-xl">
            <h3 className="text-[16px] font-bold text-zinc-900 text-center mb-2">멤버 강퇴</h3>
            <p className="text-[13px] text-zinc-500 text-center mb-6">
              <span className="font-semibold text-zinc-800">{member.memNic}</span> 님을 모임에서 강퇴하시겠습니까?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowKickConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-[14px] font-medium text-zinc-600 border border-zinc-200"
              >
                취소
              </button>
              <button
                onClick={() => kickMutation.mutate()}
                disabled={kickMutation.isPending}
                className="flex-1 py-2.5 rounded-xl text-[14px] font-semibold text-white bg-red-500 disabled:opacity-60"
              >
                강퇴
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <EditModal
          member={member}
          onClose={() => setShowEditModal(false)}
          onSave={(nick) => saveMutation.mutate(nick)}
          isPending={saveMutation.isPending}
        />
      )}

      {/* 프로필 상단 */}
      <div className="flex items-center gap-4 pb-8 border-b border-zinc-100">
        <div className="w-20 h-20 rounded-full bg-[#C4B5FD] flex items-center justify-center text-[24px] font-bold text-white shrink-0">
          {member.memNic[0] || '?'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-[20px] font-bold text-zinc-900 truncate">{member.memNic}</h1>
            {member.memRole === 'L' && (
              <span className="text-[11px] font-semibold text-white bg-[#3B3EFF] rounded-full px-2 py-0.5 shrink-0">
                리더
              </span>
            )}
          </div>
          <p className="text-[13px] text-zinc-500">
            {member.memRole === 'L' ? '모임장' : '일반 멤버'}
          </p>
        </div>

        {isOwnProfile && (
          <button
            onClick={() => setShowEditModal(true)}
            className="text-[13px] font-medium text-zinc-500 border border-zinc-200 rounded-lg px-3 py-1 shrink-0"
          >
            수정
          </button>
        )}
      </div>

      {/* 상세 정보 */}
      <div className="py-6 space-y-5">
        <div>
          <p className="text-[12px] font-semibold text-zinc-400 mb-1">가입 신청일</p>
          <p className="text-[14px] font-medium text-zinc-800">{member.regDtm}</p>
        </div>
        {member.procDtm && (
          <div>
            <p className="text-[12px] font-semibold text-zinc-400 mb-1">처리일</p>
            <p className="text-[14px] font-medium text-zinc-800">{member.procDtm}</p>
          </div>
        )}
        <div>
          <p className="text-[12px] font-semibold text-zinc-400 mb-1">상태</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`w-2 h-2 rounded-full ${STATE_DOT[member.memState] ?? 'bg-zinc-400'}`} />
            <span className="text-[14px] font-medium text-zinc-800">
              {STATE_LABELS[member.memState] ?? member.memState}
            </span>
          </div>
        </div>
      </div>

      {canActOnMember && (
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => rejectMutation.mutate()}
            disabled={approveMutation.isPending || rejectMutation.isPending}
            className="flex-1 py-3 rounded-xl text-[14px] font-semibold border border-zinc-200 text-zinc-600 disabled:opacity-50"
          >
            거절
          </button>
          <button
            onClick={() => approveMutation.mutate()}
            disabled={approveMutation.isPending || rejectMutation.isPending}
            className="flex-1 py-3 rounded-xl text-[14px] font-semibold bg-[#3B3EFF] text-white disabled:opacity-50"
          >
            승인
          </button>
        </div>
      )}

      {isLeader && !isOwnProfile && member.memState === 'A' && (
        <div className="pt-2">
          <button
            onClick={() => setShowKickConfirm(true)}
            className="w-full py-3 rounded-xl text-[14px] font-semibold text-red-500 border border-red-200"
          >
            강퇴
          </button>
        </div>
      )}
    </div>
  );
}