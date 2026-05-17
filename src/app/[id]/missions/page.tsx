'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

interface MissionResponse {
  missionId: number;
  missionTitle: string;
  missionContent: string;
  missionType: string;
  verifyPrompt: string;
  missionStartDtm: string;
  missionEndDtm: string;
  teamId: string;
}

interface MemberResponse {
  memRole: string;
  memState: string;
}

const INPUT_CLS = 'w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-[14px] text-zinc-800 placeholder:text-zinc-300 outline-none focus:border-[#3B3EFF] transition-colors bg-white';

function getDaysLeft(endDtm: string): number | null {
  const diff = Math.ceil((new Date(endDtm).getTime() - Date.now()) / 86400000);
  return diff > 0 ? diff : null;
}

function MissionTypeLabel({ type }: { type: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    T: { label: '텍스트', cls: 'bg-blue-50 text-blue-600' },
    I: { label: '이미지', cls: 'bg-purple-50 text-purple-600' },
    B: { label: '텍스트+이미지', cls: 'bg-indigo-50 text-indigo-600' },
  };
  const info = map[type] ?? { label: type, cls: 'bg-zinc-100 text-zinc-500' };
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${info.cls}`}>
      {info.label}
    </span>
  );
}

function CreateModal({
  teamId,
  onClose,
  onCreated,
}: {
  teamId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [missionType, setMissionType] = useState('T');
  const [verifyPrompt, setVerifyPrompt] = useState('');
  const [startDtm, setStartDtm] = useState(new Date().toISOString().slice(0, 16));
  const [endDtm, setEndDtm] = useState('');

  const createMutation = useMutation({
    mutationFn: () =>
      api.post('/api/missions', {
        missionTitle: title.trim(),
        missionContent: content.trim(),
        missionType,
        verifyPrompt: verifyPrompt.trim(),
        missionStartDtm: startDtm.replace('T', ' ') + ':00',
        missionEndDtm: (endDtm.replace('T', ' ') + ':00'),
        teamId,
      }),
    onSuccess: () => onCreated(),
  });

  const isDisabled = !title.trim() || !content.trim() || !endDtm;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
      <div className="bg-white rounded-t-2xl w-full max-w-[390px] p-5 pb-8 flex flex-col gap-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[16px] font-bold text-zinc-900">미션 생성</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div>
          <label className="block text-[12px] font-medium text-zinc-500 mb-1">미션 제목</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예) 매일 30분 운동하기" className={INPUT_CLS} />
        </div>

        <div>
          <label className="block text-[12px] font-medium text-zinc-500 mb-1">미션 내용</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="미션에 대한 설명을 입력하세요"
            rows={2}
            className={`${INPUT_CLS} resize-none`}
          />
        </div>

        <div>
          <label className="block text-[12px] font-medium text-zinc-500 mb-1.5">인증 방식</label>
          <div className="flex gap-2">
            {[['T', '텍스트'], ['I', '이미지'], ['B', '텍스트+이미지']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setMissionType(val)}
                className={`flex-1 py-1.5 rounded-lg text-[12px] font-medium border transition-colors ${missionType === val ? 'bg-[#3B3EFF] border-[#3B3EFF] text-white' : 'bg-white border-zinc-200 text-zinc-500'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[12px] font-medium text-zinc-500 mb-1">AI 검증 기준 <span className="font-normal text-zinc-300">(선택)</span></label>
          <input value={verifyPrompt} onChange={(e) => setVerifyPrompt(e.target.value)} placeholder="예) 운동 중인 모습이 사진에 있어야 함" className={INPUT_CLS} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[12px] font-medium text-zinc-500 mb-1">시작일시</label>
            <input type="datetime-local" value={startDtm} onChange={(e) => setStartDtm(e.target.value)} className={INPUT_CLS} />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-zinc-500 mb-1">종료일시</label>
            <input type="datetime-local" value={endDtm} onChange={(e) => setEndDtm(e.target.value)} className={INPUT_CLS} />
          </div>
        </div>

        {createMutation.isError && (
          <p className="text-[12px] text-red-500">미션 생성에 실패했습니다.</p>
        )}

        <button
          disabled={isDisabled || createMutation.isPending}
          onClick={() => createMutation.mutate()}
          className={`w-full py-3 rounded-xl text-[15px] font-semibold transition-colors ${isDisabled || createMutation.isPending ? 'bg-zinc-300 text-white' : 'bg-[#3B3EFF] text-white'}`}
        >
          {createMutation.isPending ? '생성 중...' : '미션 생성'}
        </button>
      </div>
    </div>
  );
}

export default function MissionsPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [tab, setTab] = useState<'전체' | '진행중' | '종료'>('전체');

  const { data: myMembership } = useQuery({
    queryKey: ['members', 'me', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/members/me?teamId=${id}`);
      return data.data as MemberResponse;
    },
    enabled: !!id,
  });

  const isLeader = myMembership?.memRole === 'L' && myMembership?.memState === 'A';

  const { data: missions = [], isLoading } = useQuery({
    queryKey: ['missions', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/missions?teamId=${id}`);
      return data.data as MissionResponse[];
    },
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: (missionId: number) => api.delete(`/api/missions/${missionId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['missions', id] }),
  });

  const filtered = missions.filter((m) => {
    const active = getDaysLeft(m.missionEndDtm) !== null;
    if (tab === '진행중') return active;
    if (tab === '종료') return !active;
    return true;
  });

  return (
    <div className="flex flex-col min-h-full">
      {showCreate && (
        <CreateModal
          teamId={id}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            queryClient.invalidateQueries({ queryKey: ['missions', id] });
            setShowCreate(false);
          }}
        />
      )}

      {/* 탭 */}
      <div className="flex border-b border-zinc-200 -mx-4 sticky top-0 z-10 bg-white">
        {(['전체', '진행중', '종료'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 flex justify-center text-[13px] font-medium transition-colors whitespace-nowrap ${tab === t ? 'text-zinc-900' : 'text-zinc-400'}`}
          >
            <span className={`inline-block py-2.5 -mb-px ${tab === t ? 'border-b-2 border-zinc-900' : ''}`}>
              {t}
            </span>
          </button>
        ))}
      </div>

      <div className="flex-1 -mx-4 -mb-5 bg-zinc-100 px-4 pt-4 pb-28">
        {isLoading && <p className="text-center text-[13px] text-zinc-400 py-10">불러오는 중...</p>}
        {!isLoading && filtered.length === 0 && (
          <p className="text-center text-[13px] text-zinc-400 py-10">미션이 없습니다.</p>
        )}

        <div className="space-y-3">
          {filtered.map((mission) => {
            const daysLeft = getDaysLeft(mission.missionEndDtm);
            const isActive = daysLeft !== null;

            return (
              <div key={mission.missionId} className="bg-white rounded-xl px-4 py-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                      <MissionTypeLabel type={mission.missionType} />
                      {isActive ? (
                        <span className="text-[11px] font-semibold text-[#3B3EFF]">D-{daysLeft}</span>
                      ) : (
                        <span className="text-[11px] font-semibold text-zinc-400">종료</span>
                      )}
                    </div>
                    <p className="text-[15px] font-bold text-zinc-900">{mission.missionTitle}</p>
                  </div>
                  {isLeader && (
                    <button
                      onClick={() => deleteMutation.mutate(mission.missionId)}
                      disabled={deleteMutation.isPending}
                      className="shrink-0 w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 hover:bg-red-50 hover:text-red-400 transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                <p className="text-[13px] text-zinc-500 leading-relaxed mb-3">{mission.missionContent}</p>
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span>{mission.missionStartDtm?.slice(0, 10)} ~ {mission.missionEndDtm?.slice(0, 10)}</span>
                </div>
              </div>
            );
          })}
        </div>

        {isLeader && (
          <button
            onClick={() => setShowCreate(true)}
            className="fixed bottom-6 bg-[#3B3EFF] text-white text-[13px] font-semibold px-4 py-2.5 rounded-full shadow-lg flex items-center gap-1.5"
            style={{ right: 'max(1rem, calc((100vw - 390px) / 2 + 1rem))' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
            </svg>
            미션 생성
          </button>
        )}
      </div>
    </div>
  );
}
