'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';

interface Team {
  teamId: string;
  teamName: string;
  teamImg: string;
  teamInfo: string;
  teamCategory: string;
  currentMember: number;
  maxMembers: number;
  code: string;
}

async function fetchGroup(id: string): Promise<Team> {
  const { data } = await api.get(`/api/teams/${id}`);
  return data.data;
}

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: group, isLoading, isError } = useQuery({
    queryKey: ['group', id],
    queryFn: () => fetchGroup(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-10 space-y-4">
        <div className="h-8 w-48 bg-zinc-100 rounded animate-pulse" />
        <div className="h-4 w-24 bg-zinc-100 rounded animate-pulse" />
        <div className="h-32 bg-zinc-100 rounded-xl animate-pulse" />
      </main>
    );
  }

  if (isError || !group) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-10 text-center">
        <p className="text-zinc-500">모임 정보를 불러오지 못했습니다.</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-sm text-zinc-400 underline"
        >
          돌아가기
        </button>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <button
        onClick={() => router.back()}
        className="mb-6 text-sm text-zinc-400 hover:text-zinc-700"
      >
        ← 목록으로
      </button>

      <div className="flex items-center gap-4 mb-6">
        {group.teamImg ? (
          <img src={group.teamImg} alt={group.teamName} className="w-16 h-16 rounded-full object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-500 text-xl font-bold">
            {group.teamName[0]}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">{group.teamName}</h1>
          <p className="text-sm text-zinc-400">{group.teamCategory}</p>
        </div>
      </div>

      <div className="border border-zinc-200 rounded-xl p-6 space-y-4">
        <div>
          <p className="text-xs text-zinc-400 mb-1">소개</p>
          <p className="text-sm text-zinc-700 leading-relaxed">{group.teamInfo}</p>
        </div>
        <div className="flex gap-6">
          <div>
            <p className="text-xs text-zinc-400 mb-1">인원</p>
            <p className="text-sm font-medium">{group.currentMember} / {group.maxMembers}명</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400 mb-1">초대코드</p>
            <p className="text-sm font-mono font-medium">{group.code}</p>
          </div>
        </div>
      </div>

      <button className="mt-6 w-full py-3 bg-black text-white rounded-xl text-sm font-medium hover:bg-zinc-800 transition-colors">
        모임 참가하기
      </button>
    </main>
  );
}
