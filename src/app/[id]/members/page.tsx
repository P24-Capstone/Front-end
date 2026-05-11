'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';

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
  A: '활동',
  W: '대기',
  R: '거절',
};

const STATE_BADGE: Record<string, string> = {
  A: 'bg-green-100 text-green-700',
  W: 'bg-yellow-100 text-yellow-700',
  R: 'bg-red-100 text-red-600',
};

type StateFilter = 'ALL' | 'A' | 'W' | 'R';

export default function MembersPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<StateFilter>('ALL');

  const { data: myMembership } = useQuery({
    queryKey: ['members', 'me', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/members/me?teamId=${id}`);
      return data.data as MemberResponse;
    },
    enabled: !!id,
  });

  const isLeader = myMembership?.memRole === 'L' && myMembership?.memState === 'A';

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

  const filtered = isLeader && activeTab !== 'ALL'
    ? safeMembers.filter((m) => m.memState === activeTab)
    : safeMembers;

  const countByState = (state: string) => safeMembers.filter((m) => m.memState === state).length;

  return (
    <div className="space-y-3 pt-4">
      <h2 className="text-[15px] font-bold">멤버 ({safeMembers.length}명)</h2>

      {isLeader && (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {(['ALL', 'A', 'W', 'R'] as StateFilter[]).map((tab) => {
            const label = tab === 'ALL' ? '전체' : STATE_LABELS[tab];
            const count = tab === 'ALL' ? safeMembers.length : countByState(tab);
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`shrink-0 text-[12px] font-medium px-3 py-1 rounded-full transition-colors ${
                  activeTab === tab
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-100 text-zinc-500'
                }`}
              >
                {label} {count}
              </button>
            );
          })}
        </div>
      )}

      <div className="divide-y divide-zinc-100">
        {filtered.length === 0 && (
          <div className="py-8 text-center text-zinc-400 text-[13px]">멤버가 없습니다.</div>
        )}
        {filtered.map((m) => (
          <Link key={m.memId} href={`/${id}/members/${m.memId}`}>
            <div className="flex items-center gap-3 py-3 cursor-pointer hover:bg-zinc-50 transition-colors px-2 -mx-2 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-zinc-200 shrink-0 flex items-center justify-center text-[13px] font-medium text-zinc-500">
                {m.memNic ? m.memNic[0] : '?'}
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-medium text-zinc-900">{m.memNic}</p>
                <p className="text-[11px] text-zinc-400">
                  {m.memRole === 'L' ? '모임장' : '멤버'}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {isLeader && (
                  <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${STATE_BADGE[m.memState] ?? 'bg-zinc-100 text-zinc-500'}`}>
                    {STATE_LABELS[m.memState] ?? m.memState}
                  </span>
                )}
                {m.memRole === 'L' && (
                  <span className="text-[10px] font-semibold text-white bg-[#3B3EFF] rounded-full px-2 py-0.5">
                    리더
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
