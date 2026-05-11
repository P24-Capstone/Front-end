'use client';

import { useParams } from 'next/navigation';
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

export default function MembersPage() {
  const { id } = useParams<{ id: string }>();

  const { data: members, isLoading } = useQuery({
    queryKey: ['members', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/members?teamId=${id}`);
      return data.data as MemberResponse[];
    },
    enabled: !!id,
  });

  if (isLoading) {
    return <div className="text-center py-10 text-zinc-500 text-sm">불러오는 중...</div>;
  }

  const safeMembers = members || [];

  return (
    <div className="space-y-3 pt-4">
      <h2 className="text-[15px] font-bold">멤버 ({safeMembers.length}명)</h2>
      <div className="divide-y divide-zinc-100">
        {safeMembers.length === 0 && (
          <div className="py-8 text-center text-zinc-400 text-[13px]">멤버가 없습니다.</div>
        )}
        {safeMembers.map((m) => (
          <div key={m.memId} className="flex items-center gap-3 py-3">
            <div className="w-10 h-10 rounded-full bg-zinc-200 shrink-0 flex items-center justify-center text-[13px] font-medium text-zinc-500">
              {m.memNic ? m.memNic[0] : '?'}
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-medium text-zinc-900">{m.memNic}</p>
              <p className="text-[11px] text-zinc-400">
                {m.memRole === 'L' ? '모임장' : '멤버'}
              </p>
            </div>
            {m.memRole === 'L' && (
              <span className="text-[10px] font-semibold text-white bg-[#3B3EFF] rounded-full px-2 py-0.5">
                리더
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
