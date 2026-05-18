'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { useHeaderSlotStore } from '@/store/headerSlot';

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

interface MemberMe {
  memId: string;
  memNic: string;
  memRole: string;
  memState: string;
}

export default function GroupInfoPage() {
  const { id } = useParams<{ id: string }>();
  const { setPageHeader } = useHeaderSlotStore();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);

  const [teamName, setTeamName] = useState('');
  const [teamInfo, setTeamInfo] = useState('');
  const [teamCategory, setTeamCategory] = useState('');
  const [maxMembers, setMaxMembers] = useState('');
  const initialized = useRef(false);

  const { data: group, isLoading } = useQuery<Team>({
    queryKey: ['group', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/teams/${id}`);
      return data.data;
    },
    enabled: !!id,
  });

  const { data: myMember } = useQuery<MemberMe>({
    queryKey: ['memberMe', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/members/me?teamId=${id}`);
      return data.data;
    },
    enabled: !!id,
  });

  if (group && !initialized.current) {
    setTeamName(group.teamName);
    setTeamInfo(group.teamInfo ?? '');
    setTeamCategory(group.teamCategory ?? '');
    setMaxMembers(String(group.maxMembers));
    initialized.current = true;
  }

  const isLeader = myMember?.memRole === 'L' && myMember?.memState === 'A';

  const { mutate: save, isPending } = useMutation({
    mutationFn: () =>
      api.put(`/api/teams/${id}`, {
        teamId: id,
        teamName,
        teamInfo,
        teamCategory,
        maxMembers: Number(maxMembers),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', id] });
      queryClient.invalidateQueries({ queryKey: ['groupName', id] });
      setEditing(false);
    },
  });

  const handleCancel = () => {
    if (group) {
      setTeamName(group.teamName);
      setTeamInfo(group.teamInfo ?? '');
      setTeamCategory(group.teamCategory ?? '');
      setMaxMembers(String(group.maxMembers));
    }
    setEditing(false);
  };

  useEffect(() => {
    setPageHeader({ title: '모임 정보', hideHamburger: true });
    return () => setPageHeader(null);
  }, [setPageHeader]);

  if (isLoading) {
    return (
      <div className="pt-4 px-2 space-y-3">
        <div className="h-14 w-full bg-zinc-100 rounded animate-pulse" />
        <div className="h-32 bg-zinc-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!group) {
    return <p className="pt-8 text-center text-[13px] text-zinc-400">모임 정보를 불러오지 못했습니다.</p>;
  }

  return (
    <div className="pt-4 px-2 space-y-4">
      {/* 모임 이미지 + 이름 + 버튼 */}
      <div className="flex items-center gap-4">
        {group.teamImg ? (
          <img src={group.teamImg} alt={group.teamName} className="w-14 h-14 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-[#C4B5FD] flex items-center justify-center text-white text-xl font-bold shrink-0">
            {group.teamName[0]}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[17px] font-bold text-zinc-900 truncate">{group.teamName}</p>
          <p className="text-[13px] text-zinc-400">{group.teamCategory}</p>
        </div>
        {isLeader && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-[13px] font-medium text-zinc-500 border border-zinc-200 rounded-lg px-3 py-1 shrink-0"
          >
            수정
          </button>
        )}
        {isLeader && editing && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCancel}
              className="text-[13px] font-medium text-zinc-500 border border-zinc-200 rounded-lg px-3 py-1"
            >
              취소
            </button>
            <button
              onClick={() => save()}
              disabled={isPending}
              className="text-[13px] font-semibold text-white bg-[#3B3EFF] rounded-lg px-3 py-1 disabled:opacity-60"
            >
              완료
            </button>
          </div>
        )}
      </div>

      <div className="border-t border-zinc-100" />

      {/* 상세 정보 */}
      <div>
        {[
          { label: '모임 이름', value: teamName, set: setTeamName },
          { label: '소개', value: teamInfo, set: setTeamInfo },
        ].map(({ label, value, set }) => (
          <div key={label} className="flex items-center py-3 gap-4">
            <span className="text-[13px] text-zinc-400 w-20 shrink-0">{label}</span>
            {editing ? (
              <input
                type="text"
                value={value}
                onChange={(e) => set(e.target.value)}
                className="flex-1 text-[13px] text-zinc-800 border-b border-zinc-300 outline-none py-0.5 bg-transparent focus:border-[#3B3EFF]"
              />
            ) : (
              <span className="text-[13px] text-zinc-800">{value || '-'}</span>
            )}
          </div>
        ))}

        {/* 카테고리 */}
        <div className="flex items-center py-3 gap-4">
          <span className="text-[13px] text-zinc-400 w-20 shrink-0">카테고리</span>
          {editing ? (
            <select
              value={teamCategory}
              onChange={(e) => setTeamCategory(e.target.value)}
              className="flex-1 text-[13px] text-zinc-800 border-b border-zinc-300 outline-none py-0.5 bg-transparent focus:border-[#3B3EFF]"
            >
              {['독서', '스터디', '운동', '프로젝트', '친목', '기타'].map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          ) : (
            <span className="text-[13px] text-zinc-800">{teamCategory || '-'}</span>
          )}
        </div>

        {/* 최대 인원 */}
        <div className="flex items-center py-3 gap-4">
          <span className="text-[13px] text-zinc-400 w-20 shrink-0">최대 인원</span>
          {editing ? (
            <div className="flex items-center gap-3 flex-1">
              <input
                type="range"
                min="2"
                max="15"
                value={maxMembers}
                onChange={(e) => setMaxMembers(e.target.value)}
                className="flex-1 accent-[#3B3EFF]"
              />
              <span className="text-[13px] font-semibold text-zinc-800 w-10 text-right shrink-0">
                {maxMembers}명
              </span>
            </div>
          ) : (
            <span className="text-[13px] text-zinc-800">{maxMembers}명</span>
          )}
        </div>

        <div className="flex items-center py-3 gap-4">
          <span className="text-[13px] text-zinc-400 w-20 shrink-0">현재 인원</span>
          <span className="text-[13px] text-zinc-800">{group.currentMember}명</span>
        </div>
        <div className="flex items-center py-3 gap-4">
          <span className="text-[13px] text-zinc-400 w-20 shrink-0">초대코드</span>
          <span className="text-[13px] text-zinc-800 font-mono">{group.code}</span>
        </div>
      </div>
    </div>
  );
}