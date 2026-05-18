'use client';

import { useState } from 'react';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

type ScopeTab = '전체' | '공통' | '개인';
type LeaderTab = '공통' | '개인';
type StatusFilter = '전체' | '진행 중' | '완료';

interface MemberMe { memRole: string; memState: string; }

interface Mission {
  id: string;
  scope: '공통' | '개인';
  authType: 'AI인증' | '수동인증';
  title: string;
  subtitle: string;
  status: '가능' | '대기' | '실패' | '완료';
  deadline: string | null;
  kind: '폼미션' | '자유미션';
  submitCount?: number;
}

const MOCK_MISSIONS: Mission[] = [
  { id: '1', scope: '공통', authType: 'AI인증',   title: '한강, 채식주의자 독서인증!', subtitle: '책 사진 찍고 인증하기', status: '가능', deadline: '1시간', kind: '폼미션',  submitCount: 3 },
  { id: '2', scope: '개인', authType: '수동인증', title: '독서 후 감상문 작성하기!',   subtitle: '감상문 파일 업로드',    status: '대기', deadline: '30분',  kind: '자유미션', submitCount: 1 },
  { id: '3', scope: '공통', authType: '수동인증', title: '독서 후 감상문 작성하기!',   subtitle: '감상문 파일 업로드',    status: '가능', deadline: '3일',   kind: '폼미션',  submitCount: 5 },
  { id: '4', scope: '개인', authType: 'AI인증',   title: '카프카, 변신 독서인증!',     subtitle: '책 사진 찍고 인증하기', status: '대기', deadline: null,   kind: '자유미션', submitCount: 2 },
  { id: '5', scope: '개인', authType: '수동인증', title: '독서 후 감상문 작성하기!',   subtitle: '감상문 파일 업로드',    status: '실패', deadline: null,   kind: '자유미션', submitCount: 0 },
  { id: '6', scope: '개인', authType: '수동인증', title: '독서 후 감상문 작성하기!',   subtitle: '감상문 파일 업로드',    status: '실패', deadline: null,   kind: '폼미션',  submitCount: 0 },
  { id: '7', scope: '개인', authType: 'AI인증',   title: '카프카, 변신 독서인증!',     subtitle: '책 사진 찍고 인증하기', status: '완료', deadline: null,   kind: '자유미션', submitCount: 3 },
  { id: '8', scope: '공통', authType: '수동인증', title: '한강, 채식주의자 독서인증!', subtitle: '책 사진 찍고 인증하기', status: '완료', deadline: null,  kind: '폼미션',  submitCount: 6 },
];

const MOCK_MEMBERS = [
  { id: 'M1', name: '김철수', initial: '김' },
  { id: 'M2', name: '이영희', initial: '이' },
  { id: 'M3', name: '박지수', initial: '박' },
];

const SCOPE_COLOR: Record<string, string> = { 공통: '#FF9E6A', 개인: '#E5638C' };
const AUTH_COLOR: Record<string, string> = { 'AI인증': '#3B3EFF', '수동인증': '#31DBD5' };

function deadlineColor(deadline: string | null): string {
  if (!deadline) return 'text-zinc-400';
  if (deadline.includes('분') || deadline.includes('시간')) return 'text-[#f97316]';
  const days = Number(deadline.replace(/[^0-9]/g, ''));
  return days <= 3 ? 'text-[#f97316]' : 'text-[#3B3EFF]';
}

function Badges({ scope, authType }: { scope: string; authType: string }) {
  return (
    <div className="flex gap-1 mb-1">
      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: SCOPE_COLOR[scope] }}>{scope}</span>
      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: AUTH_COLOR[authType] }}>{authType}</span>
    </div>
  );
}

function MissionCard({ m, onVerify, onViewPending, onViewCompleted, onViewFailed }: {
  m: Mission;
  onVerify?: () => void;
  onViewPending?: () => void;
  onViewCompleted?: () => void;
  onViewFailed?: () => void;
}) {
  const isDone = m.status === '실패' || m.status === '완료';
  return (
    <div className="bg-white rounded-lg px-4 py-3 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-full shrink-0 ${isDone ? 'bg-zinc-300' : 'bg-zinc-200'}`} />
      <div className="flex-1 min-w-0">
        <Badges scope={m.scope} authType={m.authType} />
        <p className="text-[12px] font-medium text-zinc-800 leading-tight">{m.title}</p>
        <p className="text-[11px] text-zinc-400 mt-1">{m.subtitle}</p>
      </div>
      <div className="shrink-0 flex flex-col items-end gap-2">
        {m.status === '가능' && (
          <>
            <p className="text-[12px]"><span className="text-zinc-800">마감까지 </span><span className={deadlineColor(m.deadline)}>{m.deadline}</span></p>
            <button onClick={onVerify} className="text-[12px] font-semibold text-white bg-[#3B3EFF] rounded-lg px-3.5 py-1.5 flex items-center gap-1 whitespace-nowrap">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              인증하기
            </button>
          </>
        )}
        {m.status === '대기' && (
          <>
            <p className="text-[12px]">{m.deadline ? <><span className="text-zinc-800">마감까지 </span><span className={deadlineColor(m.deadline)}>{m.deadline}</span></> : <span className="text-zinc-400">마감</span>}</p>
            <button onClick={onViewPending} className="text-[12px] font-semibold text-white bg-[#3B3EFF] rounded-lg px-3.5 py-1.5 flex items-center gap-1 whitespace-nowrap">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              승인 대기
            </button>
          </>
        )}
        {m.status === '실패' && (
          <>
            <span className="text-[12px] text-zinc-400">마감</span>
            <button onClick={onViewFailed} className="text-[12px] font-semibold text-[#3B3EFF] bg-white border border-[#3B3EFF] rounded-lg px-3.5 py-1.5 flex items-center gap-1 whitespace-nowrap">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              인증 실패
            </button>
          </>
        )}
        {m.status === '완료' && (
          <>
            <span className="text-[12px] text-zinc-400">마감</span>
            <button onClick={onViewCompleted} className="text-[12px] font-medium text-zinc-400 bg-zinc-100 rounded-lg px-3.5 py-1.5 flex items-center gap-1 whitespace-nowrap">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
              인증 완료
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function LeaderCard({ m, onViewSubmissions, showCount = true }: { m: Mission; onViewSubmissions?: () => void; showCount?: boolean }) {
  return (
    <div className="bg-white rounded-lg px-4 py-3 flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-zinc-200 shrink-0" />
      <div className="flex-1 min-w-0">
        <Badges scope={m.scope} authType={m.authType} />
        <p className="text-[12px] font-medium text-zinc-800 leading-tight">{m.title}</p>
        <p className="text-[11px] text-zinc-400 mt-1">{m.subtitle}</p>
      </div>
      <div className="shrink-0 flex flex-col items-end gap-2">
        {m.status === '완료' || !m.deadline
          ? <span className="text-[12px] text-zinc-400">마감</span>
          : <p className="text-[12px]"><span className="text-zinc-800">마감까지 </span><span className={deadlineColor(m.deadline)}>{m.deadline}</span></p>
        }
        <button onClick={onViewSubmissions} className="text-[12px] font-semibold text-white bg-[#3B3EFF] rounded-lg px-3.5 py-1.5 whitespace-nowrap">
          제출 확인{showCount ? ` ${m.submitCount ?? 0}` : ''}
        </button>
      </div>
    </div>
  );
}

function StatusBar({ value, onChange }: { value: StatusFilter; onChange: (v: StatusFilter) => void }) {
  const filters: StatusFilter[] = ['전체', '진행 중', '완료'];
  return (
    <div className="flex items-center justify-center mb-3">
      {filters.map((f, i) => (
        <div key={f} className="flex items-center">
          <button onClick={() => onChange(f)} className={`text-[13px] px-2 ${value === f ? 'font-semibold text-zinc-900' : 'text-zinc-400'}`}>{f}</button>
          {i < filters.length - 1 && <span className="text-zinc-300 text-[13px]">|</span>}
        </div>
      ))}
    </div>
  );
}

export default function MissionsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [scopeTab, setScopeTab] = useState<ScopeTab>('전체');
  const [leaderTab, setLeaderTab] = useState<LeaderTab>('공통');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('전체');
  const [showPopup, setShowPopup] = useState(false);
  const [devLeader, setDevLeader] = useState<boolean | null>(null);

  const { data: myMember } = useQuery<MemberMe>({
    queryKey: ['memberMe', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/members/me?teamId=${id}`);
      return data.data;
    },
    enabled: !!id,
  });

  const isLeader = myMember?.memRole === 'L' && myMember?.memState === 'A';
  const showLeader = devLeader !== null ? devLeader : isLeader;

  const mFiltered = MOCK_MISSIONS.filter((m) => {
    if (scopeTab === '공통' && m.scope !== '공통') return false;
    if (scopeTab === '개인' && m.scope !== '개인') return false;
    if (statusFilter === '진행 중' && m.status !== '가능' && m.status !== '대기' && m.status !== '실패') return false;
    if (statusFilter === '완료' && m.status !== '완료') return false;
    return true;
  });

  const applyStatus = (list: Mission[]) => list.filter((m) => {
    if (statusFilter === '진행 중') return m.status === '가능' || m.status === '대기' || m.status === '실패';
    if (statusFilter === '완료') return m.status === '완료';
    return true;
  });

  const lCommon = applyStatus(MOCK_MISSIONS.filter((m) => m.scope === '공통'));
  const lPersonal = applyStatus(MOCK_MISSIONS.filter((m) => m.scope === '개인')).slice(0, 3);

  const submissionsHref = (m: Mission) =>
    `/${id}/missions/${m.id}/submissions?authType=${encodeURIComponent(m.authType)}&scope=${encodeURIComponent(m.scope)}&title=${encodeURIComponent(m.title)}&subtitle=${encodeURIComponent(m.subtitle)}`;
  const submissionDetailHref = (m: Mission, memberName: string) =>
    `/${id}/missions/${m.id}/submissions/1?authType=${encodeURIComponent(m.authType)}&scope=${encodeURIComponent(m.scope)}&title=${encodeURIComponent(m.title)}&subtitle=${encodeURIComponent(m.subtitle)}&memberName=${encodeURIComponent(memberName)}&aiResult=`;
  const verifyHref = (m: Mission) =>
    `/${id}/missions/${m.id}/verify?authType=${encodeURIComponent(m.authType)}&scope=${encodeURIComponent(m.scope)}&title=${encodeURIComponent(m.title)}&subtitle=${encodeURIComponent(m.subtitle)}`;
  const pendingHref = (m: Mission, status = '') =>
    `/${id}/missions/${m.id}/pending?${status ? `status=${status}&` : ''}authType=${encodeURIComponent(m.authType)}&scope=${encodeURIComponent(m.scope)}&title=${encodeURIComponent(m.title)}&subtitle=${encodeURIComponent(m.subtitle)}`;

  return (
    <div className="flex flex-col min-h-full">
      {/* 개발용 뷰 토글 */}
      <div className="flex items-center gap-2 -mx-4 px-4 py-1.5 bg-yellow-50 border-b border-yellow-200">
        <span className="text-[11px] text-yellow-700 font-medium">개발용:</span>
        <button onClick={() => setDevLeader(false)} className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium transition-colors ${devLeader === false ? 'bg-yellow-400 text-white' : 'text-yellow-600'}`}>멤버</button>
        <button onClick={() => setDevLeader(true)} className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium transition-colors ${devLeader === true ? 'bg-yellow-400 text-white' : 'text-yellow-600'}`}>팀장</button>
      </div>

      {showLeader ? (
        <>
          {/* 팀장: 공통/개인 탭 */}
          <div className="sticky top-0 z-10 bg-white -mx-4">
            <div className="flex border-b border-zinc-200">
              {(['공통', '개인'] as LeaderTab[]).map((t) => (
                <button key={t} onClick={() => setLeaderTab(t)}
                  className={`flex-1 flex justify-center text-[13px] font-medium transition-colors ${leaderTab === t ? 'text-zinc-900' : 'text-zinc-400'}`}>
                  <span className={`inline-block py-2.5 -mb-px ${leaderTab === t ? 'border-b-2 border-zinc-900' : ''}`}>{t}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 -mx-4 -mb-5 bg-zinc-100 px-4 pt-4 pb-24 space-y-3">
            <StatusBar value={statusFilter} onChange={setStatusFilter} />

            {leaderTab === '공통' && (
              lCommon.length === 0
                ? <p className="text-center text-[13px] text-zinc-400 py-10">미션이 없습니다.</p>
                : lCommon.map((m) => <LeaderCard key={m.id} m={m} onViewSubmissions={() => router.push(submissionsHref(m))} />)
            )}

            {leaderTab === '개인' && (
              MOCK_MEMBERS.length === 0
                ? <p className="text-center text-[13px] text-zinc-400 py-10">미션이 없습니다.</p>
                : MOCK_MEMBERS.map((mem) => (
                  <div key={mem.id} className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-7 h-7 rounded-full bg-[#C4B5FD] flex items-center justify-center shrink-0">
                        <span className="text-[11px] font-bold text-white">{mem.initial}</span>
                      </div>
                      <span className="text-[13px] font-semibold text-zinc-800">{mem.name}</span>
                    </div>
                    {lPersonal.map((m) => <LeaderCard key={m.id} m={m} showCount={false} onViewSubmissions={() => router.push(submissionDetailHref(m, mem.name))} />)}
                  </div>
                ))
            )}
          </div>
        </>
      ) : (
        <>
          {/* 멤버: 전체/공통/개인 탭 */}
          <div className="sticky top-0 z-10 bg-white -mx-4">
            <div className="flex border-b border-zinc-200">
              {(['전체', '공통', '개인'] as ScopeTab[]).map((t) => (
                <button key={t} onClick={() => setScopeTab(t)}
                  className={`flex-1 flex justify-center text-[13px] font-medium transition-colors ${scopeTab === t ? 'text-zinc-900' : 'text-zinc-400'}`}>
                  <span className={`inline-block py-2.5 -mb-px ${scopeTab === t ? 'border-b-2 border-zinc-900' : ''}`}>{t}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 -mx-4 -mb-5 bg-zinc-100 px-4 pt-4 pb-24 space-y-3">
            <StatusBar value={statusFilter} onChange={setStatusFilter} />
            {mFiltered.length === 0
              ? <p className="text-center text-[13px] text-zinc-400 py-10">미션이 없습니다.</p>
              : mFiltered.map((m) => (
                <MissionCard key={m.id} m={m}
                  onVerify={() => router.push(verifyHref(m))}
                  onViewPending={() => router.push(pendingHref(m))}
                  onViewCompleted={() => router.push(pendingHref(m, 'completed'))}
                  onViewFailed={() => router.push(pendingHref(m, 'failed'))}
                />
              ))
            }
          </div>
        </>
      )}

      {/* 팀장 전용 플로팅 버튼 */}
      {showLeader && (
        <button
          onClick={() => setShowPopup(true)}
          className="fixed bottom-[80px] w-12 h-12 bg-[#3B3EFF] rounded-full flex items-center justify-center shadow-lg z-20"
          style={{ right: 'calc(50% - 195px + 24px)' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      )}

      {showPopup && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowPopup(false)} />
          <div className="fixed z-50 bg-white rounded-xl shadow-xl w-[180px] overflow-hidden border border-zinc-100"
            style={{ bottom: 'calc(80px + 56px)', right: 'calc(50% - 195px + 16px)' }}>
            <button onClick={() => { setShowPopup(false); router.push(`/${id}/missions/new?kind=free`); }}
              className="w-full flex items-center gap-2.5 px-4 py-3 active:bg-zinc-50 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span className="text-[13px] font-semibold text-zinc-900">자유형식 미션</span>
            </button>
            <div className="h-px bg-zinc-100" />
            <button onClick={() => { setShowPopup(false); router.push(`/${id}/missions/new?kind=form`); }}
              className="w-full flex items-center gap-2.5 px-4 py-3 active:bg-zinc-50 transition-colors">
              <div className="relative w-[18px] h-[18px] flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="5" />
                  <path d="M3 21v-1a9 9 0 0 1 9-9h0a9 9 0 0 1 9 9v1" />
                </svg>
                <span className="absolute bottom-0 right-0 text-[6px] font-black leading-none bg-white text-zinc-800">AI</span>
              </div>
              <span className="text-[13px] font-semibold text-zinc-900">자동 폼 미션</span>
            </button>
          </div>
        </>
      )}

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