'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

const MOCK_MISSIONS = [
  { id: 1, groupName: '독서클럽',   scope: '공통', authType: 'AI인증',   title: '한강, 채식주의자 독서인증!', subtitle: '책 사진 찍고 인증하기', status: '가능', deadline: '1시간' },
  { id: 2, groupName: '러닝크루',   scope: '개인', authType: '수동인증', title: '독서 후 감상문 작성하기!',   subtitle: '감상문 파일 업로드',    status: '대기',  deadline: '30분'  },
  { id: 3, groupName: '독서클럽',   scope: '공통', authType: '수동인증', title: '독서 후 감상문 작성하기!',   subtitle: '감상문 파일 업로드',    status: '실패',  deadline: null    },
  { id: 4, groupName: '스터디그룹', scope: '개인', authType: 'AI인증',   title: '카프카, 변신 독서인증!',     subtitle: '책 사진 찍고 인증하기', status: '완료',  deadline: null    },
];


const SCOPE_COLOR: Record<string, string> = { 공통: '#FF9E6A', 개인: '#E5638C' };
const AUTH_COLOR: Record<string, string> = { 'AI인증': '#3B3EFF', '수동인증': '#31DBD5' };

function deadlineColor(d: string | null) {
  if (!d) return 'text-zinc-400';
  if (d.includes('분') || d.includes('시간')) return 'text-[#f97316]';
  const days = Number(d.replace(/[^0-9]/g, ''));
  return days <= 3 ? 'text-[#f97316]' : 'text-[#3B3EFF]';
}
=======
const NEWS_COLORS = ['#3B3EFF', '#FF9E6A', '#57B37A', '#E5638C', '#31DBD5'];

const NEWS_ITEMS = [
  { id: 1, group: '모임1', colorIdx: 0, content: '새 공지를 작성했어요', time: '10분 전' },
  { id: 2, group: '모임2', colorIdx: 1, content: '새 투표가 시작됐어요. 참여해보세요!', time: '1시간 전' },
  { id: 3, group: '모임1', colorIdx: 0, content: '이번 주 미션이 업데이트됐어요', time: '2시간 전' },
  { id: 4, group: '모임3', colorIdx: 2, content: '새 일정이 등록됐어요. 확인해보세요.', time: '어제' },
];


type TabType = '내 모임' | '미션';
type MissionFilter = '전체' | '진행 중' | '완료';

interface MenuPopupProps {
  onClose: () => void;
  name: string;
  email: string;
  initial: string;
}

function MenuPopup({ onClose, name, email, initial }: MenuPopupProps) {

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/auth/login';
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute top-[52px] right-4 z-50 bg-white rounded-xl shadow-xl w-[190px] overflow-hidden border border-zinc-100">
        {/* 프로필 */}
        <div className="flex items-center gap-2.5 px-3.5 py-3 border-b border-zinc-100">
          <div className="w-8 h-8 rounded-full bg-[#C4B5FD] flex items-center justify-center shrink-0">
            <span className="text-[13px] font-bold text-white">{initial}</span>
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-zinc-900 truncate">{name}</p>
            <p className="text-[11px] text-zinc-400 truncate">{email}</p>
          </div>
        </div>
        {/* 마이페이지 */}
        <Link href="/mypage" onClick={onClose} className="flex items-center gap-2.5 px-4 py-3 border-b border-zinc-100 hover:bg-zinc-50">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
          </svg>
          <span className="text-[13px] font-medium text-zinc-800">마이페이지</span>
        </Link>
        {/* 프로필 수정 */}
        <Link href="/mypage/profiles" onClick={onClose} className="flex items-center gap-2.5 px-4 py-3 border-b border-zinc-100 hover:bg-zinc-50">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span className="text-[13px] font-medium text-zinc-800">프로필 관리</span>
        </Link>
        {/* 로그아웃 */}
        <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-zinc-50">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          <span className="text-[13px] font-medium text-red-500">로그아웃</span>
        </button>
      </div>
    </>
  );
}

interface UserImgItem {
  imgId: number;
  imgFileKey: string;
}

function JoinByCodeModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [code, setCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [selectedImgId, setSelectedImgId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: images, refetch: refetchImages } = useQuery<UserImgItem[]>({
    queryKey: ['myImages'],
    queryFn: async () => {
      const { data } = await api.get('/api/users/me/images');
      return data.data as UserImgItem[];
    },
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      await api.post('/api/members/join/code', {
        code,
        memNic: nickname,
        ...(selectedImgId !== null && { userImgId: selectedImgId }),
      });
    },
    onSuccess: () => {
      alert('가입 신청이 완료되었습니다. 모임장의 승인을 기다려주세요!');
      onSuccess();
      onClose();
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || '가입에 실패했습니다.');
    }
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const { data: uploadRes } = await api.post('/api/files/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const imgFileKey: string = uploadRes.data;
      const { data: imgRes } = await api.post('/api/users/me/images', { imgFileKey });
      const newImg: UserImgItem = imgRes.data;
      setSelectedImgId(newImg.imgId);
      refetchImages();
    } catch {
      alert('이미지 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const displayImages = images ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-[320px] p-5 shadow-xl">
        <h3 className="text-[17px] font-bold text-zinc-900 mb-4">추천코드로 가입</h3>

        <div className="space-y-3 mb-5">
          <div>
            <label className="block text-[12px] font-medium text-zinc-600 mb-1">추천코드</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="8자리 코드 입력"
              className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-[14px] outline-none focus:border-[#3B3EFF]"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-zinc-600 mb-1">사용할 닉네임</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="모임에서 사용할 닉네임"
              className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-[14px] outline-none focus:border-[#3B3EFF]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[12px] font-medium text-zinc-600">프로필 이미지 선택</label>
              <label className="text-[11px] text-[#3B3EFF] font-medium cursor-pointer">
                {uploading ? '업로드 중...' : '+ 새 이미지 업로드'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={handleUpload}
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-2 p-2 bg-zinc-50 border border-zinc-200 rounded-xl min-h-[72px]">
              {displayImages.length === 0 && (
                <p className="text-[11px] text-zinc-400 m-auto">이미지가 없습니다. 업로드해주세요.</p>
              )}
              {displayImages.map((img) => {
                const isDefault = img.imgFileKey === 'default';
                const isSelected = selectedImgId === img.imgId;
                return (
                  <button
                    key={img.imgId}
                    type="button"
                    onClick={() => setSelectedImgId(img.imgId)}
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${isSelected ? 'border-[#3B3EFF] scale-105' : 'border-transparent'}`}
                  >
                    {isDefault ? (
                      <div className="w-full h-full bg-[#C4B5FD] flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                          <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                        </svg>
                      </div>
                    ) : (
                      <img src={img.imgFileKey} alt="프로필" className="w-full h-full object-cover" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 h-11 bg-zinc-100 text-zinc-600 rounded-xl text-[14px] font-medium"
          >
            취소
          </button>
          <button
            onClick={() => joinMutation.mutate()}
            disabled={!code.trim() || !nickname.trim() || joinMutation.isPending}
            className="flex-1 h-11 bg-[#3B3EFF] text-white rounded-xl text-[14px] font-medium disabled:bg-zinc-300"
          >
            {joinMutation.isPending ? '가입 중...' : '가입하기'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MainPage() {
  const [tab, setTab] = useState<TabType>('내 모임');
  const [missionFilter, setMissionFilter] = useState<MissionFilter>('전체');
  const [menuOpen, setMenuOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await api.get('/api/users/me');
      return data.data;
    },
  });

  const name = user?.userName || '사용자';
  const email = user?.userEmail || '';
  const initial = name[0] || '?';

  const { data: myTeams, isLoading } = useQuery({
    queryKey: ['myTeams'],
    queryFn: async () => {
      const { data } = await api.get('/api/teams/my');
      return data.data as TeamResponse[];
    },
  });


  const filteredMissions = MOCK_MISSIONS.filter((m) =>
    missionFilter === '진행 중'
      ? m.status === '가능' || m.status === '대기' || m.status === '실패'
      : m.status === '완료'
  );
=======
  const filteredMissions = missionFilter === '전체' ? MISSIONS : MISSIONS.filter((m) => m.status === missionFilter);


  return (
    <div className="w-full h-screen bg-white flex flex-col max-w-[390px] mx-auto shadow-sm relative">
      {menuOpen && <MenuPopup onClose={() => setMenuOpen(false)} name={name} email={email} initial={initial} />}
      {joinModalOpen && (
        <JoinByCodeModal
          onClose={() => setJoinModalOpen(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['myTeams'] })}
        />
      )}
      {/* 헤더 */}
      <header className="flex items-center justify-between px-4 h-[52px] shrink-0 border-b border-zinc-100 bg-white">
        <span className="text-[17px] font-bold tracking-tight">CrewWise</span>
        <div className="flex items-center gap-2">
          <button onClick={() => setMenuOpen(true)} className="w-7 h-7 rounded-full bg-[#C4B5FD] flex items-center justify-center shrink-0">
            <span className="text-[13px] font-bold text-white">{initial}</span>
          </button>
        </div>
      </header>

      {/* 탭바 */}
      <div className="flex border-b border-zinc-200 shrink-0">
        {(['내 모임', '미션'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 flex justify-center text-[14px] font-semibold transition-colors ${tab === t ? 'text-zinc-900' : 'text-zinc-400'}`}
          >
            <span className={`inline-block py-2.5 -mb-px ${tab === t ? 'border-b-2 border-zinc-900' : ''}`}>
              {t}
            </span>
          </button>
        ))}
      </div>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>

        {/* 내 모임 탭 */}
        {tab === '내 모임' && (
          <section className="px-4 pt-5 pb-8 flex flex-col gap-6">

            {/* 가입 중인 모임 */}
            <div>
              <p className="text-[13px] font-semibold text-zinc-500 mb-3">
                가입 중인 모임 <span className="text-[#3B3EFF]">({myTeams?.length ?? 0}개)</span>
              </p>
              <div className="grid grid-cols-3 gap-2">
                <Link href="/groups/new" className="group">
                  <div className="aspect-square rounded-xl border-2 border-dashed border-zinc-300 group-hover:border-[#3B3EFF] flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-zinc-200 group-hover:bg-[#3B3EFF] flex items-center justify-center transition-colors">
                      <span className="text-xl text-[#3B3EFF] group-hover:text-white font-light leading-none transition-colors">+</span>
                    </div>
                    <span className="text-[11px] font-medium text-zinc-800 group-hover:text-zinc-900 text-center leading-tight transition-colors">새 모임 만들기</span>
                  </div>
                </Link>
                {myTeams && myTeams.map((group, i) => (
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
                ))}
              </div>
              {isLoading && <p className="text-center text-[13px] text-zinc-400 py-8">불러오는 중...</p>}
            </div>

            {/* 대기 중인 모임 */}
            <div>
              <p className="text-[13px] font-semibold text-zinc-500 mb-3">
                대기 중인 모임 <span className="text-zinc-400">(0개)</span>
              </p>
              <p className="text-[13px] text-zinc-300 py-4 text-center">수락 대기 중인 모임이 없습니다.</p>
            </div>

            {/* 최근 소식 */}
            <div>
              <p className="text-[13px] font-semibold text-zinc-500 mb-3">최근 소식</p>
              <div className="space-y-2">
                {NEWS_ITEMS.map((item) => {
                  const color = NEWS_COLORS[item.colorIdx];
                  return (
                    <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50">
                      <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold"
                        style={{ backgroundColor: color }}>
                        {item.group[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full mb-0.5 text-white"
                          style={{ backgroundColor: color }}>
                          {item.group}
                        </span>
                        <p className="text-[13px] text-zinc-800 leading-snug">{item.content}</p>
                        <p className="text-[11px] text-zinc-400 mt-0.5">{item.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </section>
        )}

        {/* 미션 탭 */}
        {tab === '미션' && (
          <section className="pb-8 bg-zinc-100 min-h-full">
            {/* 정렬 */}
            <div className="flex items-center justify-center py-3 border-b border-zinc-100">
              <button
                onClick={() => setMissionFilter('전체')}
                className={`text-[13px] px-2 ${missionFilter === '전체' ? 'font-semibold text-zinc-900' : 'text-zinc-400'}`}
              >
                전체
              </button>
              <span className="text-zinc-300 text-[13px]">|</span>
              <button
                onClick={() => setMissionFilter('진행 중')}
                className={`text-[13px] px-2 ${missionFilter === '진행 중' ? 'font-semibold text-zinc-900' : 'text-zinc-400'}`}
              >
                진행 중
              </button>
              <span className="text-zinc-300 text-[13px]">|</span>
              <button
                onClick={() => setMissionFilter('완료')}
                className={`text-[13px] px-2 ${missionFilter === '완료' ? 'font-semibold text-zinc-900' : 'text-zinc-400'}`}
              >
                완료
              </button>
            </div>

            <div className="px-4 flex flex-col gap-2 pt-3">
              {filteredMissions.length === 0 ? (
                <p className="text-center text-[13px] text-zinc-400 py-10">미션이 없습니다.</p>
              ) : (
                filteredMissions.map((m) => (
                  <div key={m.id} className="bg-white rounded-lg px-4 py-3 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full shrink-0 ${m.status === '완료' || m.status === '실패' ? 'bg-zinc-300' : 'bg-zinc-200'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-zinc-400 font-medium mb-1">{m.groupName}</p>
                      <div className="flex gap-1 mb-1">
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: SCOPE_COLOR[m.scope] }}>{m.scope}</span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: AUTH_COLOR[m.authType] }}>{m.authType}</span>
                      </div>
                      <p className="text-[12px] font-medium text-zinc-800 leading-tight">{m.title}</p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">{m.subtitle}</p>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-2">
                      {m.status === '가능' && (
                        <>
                          <p className="text-[12px]"><span className="text-zinc-800">마감까지 </span><span className={deadlineColor(m.deadline)}>{m.deadline}</span></p>
                          <button className="text-[12px] font-semibold text-white bg-[#3B3EFF] rounded-lg px-3.5 py-1.5 flex items-center gap-1 whitespace-nowrap">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                            인증하기
                          </button>
                        </>
                      )}
                      {m.status === '대기' && (
                        <>
                          <p className="text-[12px]">{m.deadline ? <><span className="text-zinc-800">마감까지 </span><span className={deadlineColor(m.deadline)}>{m.deadline}</span></> : <span className="text-zinc-400">마감</span>}</p>
                          <button className="text-[12px] font-semibold text-white bg-[#3B3EFF] rounded-lg px-3.5 py-1.5 flex items-center gap-1 whitespace-nowrap">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                            승인 대기
                          </button>
                        </>
                      )}
                      {m.status === '실패' && (
                        <>
                          <span className="text-[12px] text-zinc-400">마감</span>
                          <button className="text-[12px] font-semibold text-[#3B3EFF] bg-white border border-[#3B3EFF] rounded-lg px-3.5 py-1.5 flex items-center gap-1 whitespace-nowrap">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                            인증 실패
                          </button>
                        </>
                      )}
                      {m.status === '완료' && (
                        <>
                          <span className="text-[12px] text-zinc-400">마감</span>
                          <button className="text-[12px] font-medium text-zinc-400 bg-zinc-100 rounded-lg px-3.5 py-1.5 flex items-center gap-1 whitespace-nowrap">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
                            인증 완료
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}
      </main>

      {/* 푸터 */}
      <footer className="py-3 px-4 border-t border-zinc-100 text-center shrink-0">
        <p className="text-[11px] text-zinc-400">© 2026 CrewWise Corp. All Rights Reserved</p>
      </footer>

      {/* 추천코드로 가입 플로팅 버튼 */}
      {tab === '내 모임' && (
        <button
          onClick={() => setJoinModalOpen(true)}
          className="fixed bottom-[20px] right-6 h-[46px] px-4 bg-[#3B3EFF] rounded-full flex items-center justify-center gap-2 shadow-xl hover:bg-blue-700 transition-colors z-20"
          style={{ right: 'calc(50% - 195px + 24px)', left: 'auto' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
          </svg>
          <span className="text-[14px] font-bold text-white">코드로 가입</span>
        </button>
      )}
    </div>
  );
}