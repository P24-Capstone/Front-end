'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
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

export default function MemberDetailPage() {
  const { memberId } = useParams<{ memberId: string }>();
  const router = useRouter();

  const { data: member, isLoading } = useQuery({
    queryKey: ['member', memberId],
    queryFn: async () => {
      const { data } = await api.get(`/api/members/${memberId}`);
      return data.data as MemberResponse;
    },
    enabled: !!memberId,
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

  return (
    <div className="pt-6 px-1">
      <div className="flex flex-col items-center pb-8 border-b border-zinc-100">
        <div className="w-20 h-20 rounded-full bg-zinc-200 flex items-center justify-center text-[24px] font-bold text-zinc-500 mb-4 shadow-sm">
          {member.memNic ? member.memNic[0] : '?'}
        </div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-[20px] font-bold text-zinc-900">{member.memNic}</h1>
          {member.memRole === 'L' && (
            <span className="text-[11px] font-semibold text-white bg-[#3B3EFF] rounded-full px-2 py-0.5">
              리더
            </span>
          )}
        </div>
        <p className="text-[13px] text-zinc-500">
          {member.memRole === 'L' ? '모임장' : '일반 멤버'}
        </p>
      </div>

      <div className="py-6 space-y-5">
        <div>
          <p className="text-[12px] font-semibold text-zinc-400 mb-1">가입일</p>
          <p className="text-[14px] font-medium text-zinc-800">{member.regDtm}</p>
        </div>
        <div>
          <p className="text-[12px] font-semibold text-zinc-400 mb-1">상태</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="flex w-2 h-2 rounded-full bg-green-500"></span>
            <span className="text-[14px] font-medium text-zinc-800">
              {member.memState === 'A' ? '활동 중' : member.memState}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
