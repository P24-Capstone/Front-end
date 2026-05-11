'use client';

import Link from 'next/link';
import { useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

const GROUP_COLORS = ['#fde68a', '#bfdbfe', '#bbf7d0', '#fecaca', '#ddd6fe', '#fed7aa'];

interface TeamResponse {
  teamId: string;
  teamName: string;
  teamImg: string;
  teamInfo: string;
  teamCategory: string;
  currentMember: number;
  maxMembers: number;
  code: string;
}

const MISSIONS = [
  { id: 1, status: '진행중', statusColor: '#22c55e', title: '책 읽고 인증하기', subtitle: '책 사진찍고 인증하기', deadline: 3 },
  { id: 2, status: '진행중', statusColor: '#f97316', title: '책 읽고 인증하기', subtitle: '책 사진찍고 인증하기', deadline: 5 },
  { id: 3, status: '진행중', statusColor: '#22c55e', title: '책 읽고 인증하기', subtitle: '책 사진찍고 인증하기', deadline: 1 },
  { id: 4, status: '진행중', statusColor: '#f97316', title: '책 읽고 인증하기', subtitle: '책 사진찍고 인증하기', deadline: 7 },
];

export default function MainPage() {
  const [missionTab, setMissionTab] = useState<'진행중' | '완료'>('진행중');

  const { data: myTeams, isLoading } = useQuery({
    queryKey: ['myTeams'],
    queryFn: async () => {
      const { data } = await api.get('/api/teams/my');
      return data.data as TeamResponse[];
    }
  });

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-[390px] mx-auto shadow-sm">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
        <span className="text-[17px] font-bold tracking-tight">CrewWise</span>
        <div className="flex items-center gap-2">
          <button className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
          <button className="p-1 text-zinc-700">
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        {/* 내 모임 */}
        <section className="px-4 py-5">
          <h2 className="text-[15px] font-bold mb-3">내 모임</h2>
          <div className="grid grid-cols-3 gap-2">
            {/* 새 모임 만들기 */}
            <Link href="/groups/new">
              <div className="aspect-square rounded-xl border-2 border-dashed border-zinc-300 flex flex-col items-center justify-center gap-2 hover:border-[#7073FB] hover:bg-[#7073FB] transition-colors cursor-pointer">
                <div className="size-8 rounded-full bg-zinc-100 flex items-center justify-center">
                  <span className="text-xl text-zinc-500 font-light">+</span>
                </div>
                <span className="text-[10px] text-zinc-400 text-center leading-tight">
                  새 모임
                </span>
              </div>
            </Link>

            {/* 모임 카드 */}
            {isLoading ? (
              <div className="col-span-3 text-center text-xs text-zinc-500 py-4">불러오는 중...</div>
            ) : myTeams && myTeams.length > 0 ? (
              myTeams.map((group, i) => (
                <Link key={group.teamId} href={`/${group.teamId}/home`}>
                  <div className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                    <div
                      className="w-full h-full flex items-end p-2"
                      style={{ backgroundColor: GROUP_COLORS[i % GROUP_COLORS.length] }}
                    >
                      <div className="w-full">
                        <p className="text-[11px] font-semibold text-zinc-800 leading-tight truncate">{group.teamName}</p>
                        <p className="text-[10px] text-zinc-500">참여 인원 {group.currentMember}명</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-3 text-center text-xs text-zinc-500 py-4">가입한 모임이 없습니다.</div>
            )}
          </div>
        </section>

        <div className="h-2 bg-zinc-50" />

        {/* 미션 */}
        <section className="px-4 py-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-bold">미션</h2>
            <div className="flex items-center gap-1 text-[12px] text-zinc-400">
              <button
                onClick={() => setMissionTab('진행중')}
                className={missionTab === '진행중' ? 'text-zinc-900 font-semibold' : ''}
              >
                진행중인 미션
              </button>
              <span className="text-zinc-300">|</span>
              <button
                onClick={() => setMissionTab('완료')}
                className={missionTab === '완료' ? 'text-zinc-900 font-semibold' : ''}
              >
                완료된 미션 보기
              </button>
            </div>
          </div>

          <div className="divide-y divide-zinc-100">
            {MISSIONS.map((m) => (
              <div key={m.id} className="flex items-center gap-3 py-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-zinc-200 shrink-0" />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <span
                    className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mb-1"
                    style={{ backgroundColor: m.statusColor + '22', color: m.statusColor }}
                  >
                    {m.status}
                  </span>
                  <p className="text-[12px] font-medium text-zinc-800 leading-tight">{m.title}</p>
                  <p className="text-[11px] text-zinc-400">{m.subtitle}</p>
                </div>

                {/* Action */}
                <div className="shrink-0 flex flex-col items-end gap-1">
                  <button
                    className="text-[11px] px-2.5 py-1 rounded-full border font-medium whitespace-nowrap"
                    style={{ borderColor: '#0d9488', color: '#0d9488' }}
                  >
                    자동 인증하기
                  </button>
                  <span className="text-[10px] text-red-400">마감까지 {m.deadline}일</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-3 px-4 border-t border-zinc-100 text-center">
        <p className="text-[11px] text-zinc-400">© 2026 CrewWise Corp. All Rights Reserved</p>
      </footer>
    </div>
  );
}
