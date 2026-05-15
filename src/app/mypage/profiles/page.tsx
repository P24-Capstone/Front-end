'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueries } from '@tanstack/react-query';
import api from '@/lib/api';

const GROUP_COLORS = ['#fde68a', '#bfdbfe', '#bbf7d0', '#fecaca', '#ddd6fe', '#fed7aa'];

interface TeamResponse {
  teamId: string;
  teamName: string;
  currentMember: number;
}

interface MemberResponse {
  memId: string;
  memNic: string;
  memRole: string;
  memState: string;
  teamId: string;
}

interface Profile {
  memId: string;
  memNic: string;
  bio: string;
  teamId: string;
  teamName: string;
  currentMember: number;
  colorIdx: number;
}

function XButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="absolute top-4 right-4 w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );
}

function EditModal({ profile, onClose }: { profile: Profile; onClose: () => void }) {
  const [nick, setNick] = useState(profile.memNic);
  const [bio, setBio] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-[320px] p-6 shadow-xl relative">
        <XButton onClick={onClose} />
        <h3 className="text-[16px] font-bold text-zinc-900 text-center mb-5">프로필 수정</h3>

        <div className="flex items-center gap-4 mb-5">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-[22px] font-bold text-zinc-700 shrink-0"
            style={{ backgroundColor: GROUP_COLORS[profile.colorIdx] }}
          >
            {nick[0] || '?'}
          </div>
          <button className="flex-1 h-10 border border-zinc-300 rounded-xl text-[13px] font-medium text-zinc-700">
            이미지 업로드
          </button>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <span className="text-[13px] font-medium text-zinc-600 w-16 shrink-0">
            닉네임
          </span>
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
          onClick={onClose}
          className="w-full bg-[#3B3EFF] text-white text-[14px] font-semibold rounded-xl py-2.5"
        >
          완료
        </button>
      </div>
    </div>
  );
}

function UsedTeamsModal({ profile, onClose }: { profile: Profile; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-[320px] p-6 shadow-xl relative">
        <XButton onClick={onClose} />
        <h3 className="text-[16px] font-bold text-zinc-900 text-center mb-5">이 프로필을 사용 중인 모임</h3>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <div
              className="aspect-square rounded-xl flex items-end p-2"
              style={{ backgroundColor: GROUP_COLORS[profile.colorIdx] }}
            >
              <p className="text-[11px] font-semibold text-zinc-800 leading-tight truncate w-full">
                {profile.teamName}
              </p>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">모임원 {profile.currentMember}명</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilesPage() {
  const router = useRouter();
  const [editTarget, setEditTarget] = useState<Profile | null>(null);
  const [teamsTarget, setTeamsTarget] = useState<Profile | null>(null);

  const { data: myTeams = [] } = useQuery<TeamResponse[]>({
    queryKey: ['myTeams'],
    queryFn: async () => {
      const { data } = await api.get('/api/teams/my');
      return data.data;
    },
  });

  const memberQueries = useQueries({
    queries: myTeams.map((team) => ({
      queryKey: ['memberMe', team.teamId],
      queryFn: async () => {
        const { data } = await api.get(`/api/members/me?teamId=${team.teamId}`);
        return data.data as MemberResponse;
      },
      enabled: !!team.teamId,
    })),
  });

  const profiles: Profile[] = myTeams
    .map((team, i) => {
      const mem = memberQueries[i]?.data;
      if (!mem) return null;
      return {
        memId: mem.memId,
        memNic: mem.memNic,
        bio: '',
        teamId: team.teamId,
        teamName: team.teamName,
        currentMember: team.currentMember,
        colorIdx: i % GROUP_COLORS.length,
      };
    })
    .filter(Boolean) as Profile[];

  return (
    <div className="w-full h-screen bg-white flex flex-col max-w-[390px] mx-auto shadow-sm overflow-hidden">
      {editTarget && <EditModal profile={editTarget} onClose={() => setEditTarget(null)} />}
      {teamsTarget && <UsedTeamsModal profile={teamsTarget} onClose={() => setTeamsTarget(null)} />}

      <header className="flex items-center px-4 h-[52px] shrink-0 border-b border-zinc-100">
        <button onClick={() => router.back()} className="p-1 text-zinc-500 mr-2">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-[17px] font-bold tracking-tight">프로필 관리</span>
      </header>

      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        {profiles.length === 0 ? (
          <p className="text-center text-[13px] text-zinc-400 py-16">가입된 모임이 없습니다.</p>
        ) : (
          profiles.map((profile) => (
            <div key={profile.memId} className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100">
              <div
                className="w-12 h-12 rounded-full shrink-0 flex items-center justify-center text-[18px] font-bold text-zinc-700"
                style={{ backgroundColor: GROUP_COLORS[profile.colorIdx] }}
              >
                {profile.memNic[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-zinc-900 truncate">{profile.memNic}</p>
                <p className="text-[12px] text-zinc-400 truncate">{profile.bio || '한줄 소개를 입력해주세요'}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setEditTarget(profile)}
                  className="text-[12px] font-medium text-[#3B3EFF] border border-[#3B3EFF] rounded-lg px-3 py-1.5"
                >
                  수정
                </button>
                <button
                  onClick={() => setTeamsTarget(profile)}
                  className="w-8 h-8 border border-[#3B3EFF] rounded-lg flex items-center justify-center"
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#3B3EFF" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}