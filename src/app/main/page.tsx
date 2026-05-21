'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

const GROUP_COLORS = ['#fde68a', '#bfdbfe', '#bbf7d0', '#fecaca', '#ddd6fe', '#fed7aa'];

interface MyMissionResponse {
  missionId: number;
  missionTitle: string;
  missionContent: string;
  missionType: string;
  missionStartDtm: string;
  missionEndDtm: string;
  teamId: string;
  teamName: string;
  submissionState: string | null;
}

function calcDeadline(endDtm: string): string | null {
  const diff = new Date(endDtm).getTime() - Date.now();
  if (diff <= 0) return null;
  const mins = Math.ceil(diff / 60000);
  if (mins < 60) return `${mins}분`;
  const hours = Math.ceil(diff / 3600000);
  if (hours < 24) return `${hours}시간`;
  return `${Math.ceil(diff / 86400000)}일`;
}

function missionStatus(m: MyMissionResponse): '가능' | '대기' | '완료' | '실패' {
  if (m.submissionState === 'P') return '대기';
  if (m.submissionState === 'A') return '완료';
  if (m.submissionState === 'R') return '실패';
  return '가능';
}

function missionHref(m: MyMissionResponse, status: '가능' | '대기' | '완료' | '실패'): string {
  const authType = m.missionType === 'I' ? 'AI인증' : '수동인증';
  const subtitle = `${m.missionStartDtm?.slice(0, 10)} ~ ${m.missionEndDtm?.slice(0, 10)}`;
  const params = new URLSearchParams({ authType, scope: '공통', title: m.missionTitle, subtitle });
  const base = `/${m.teamId}/missions/${m.missionId}`;
  return status === '가능' ? `${base}/verify?${params}` : `${base}/pending?${params}`;
}

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



const SCOPE_COLOR: Record<string, string> = { 공통: '#FF9E6A', 개인: '#E5638C' };
const AUTH_COLOR: Record<string, string> = { 'AI인증': '#3B3EFF', '수동인증': '#31DBD5' };

function deadlineColor(d: string | null) {
  if (!d) return 'text-zinc-400';
  if (d.includes('분') || d.includes('시간')) return 'text-[#f97316]';
  const days = Number(d.replace(/[^0-9]/g, ''));
  return days <= 3 ? 'text-[#f97316]' : 'text-[#3B3EFF]';
}

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

interface NewsResponse {
  newsId: number;
  targetType: string;
  targetId: number | null;
  newsContent: string;
  teamId: string;
}

interface CommentResponse {
  cmtId: number;
  cmtContent: string;
  cmtRegDtm: string;
  cmtModDtm: string;
  newsId: number;
  memId: string;
  memNic?: string;
  userImg?: string;
}

const TARGET_BG: Record<string, string> = {
  N: 'bg-amber-100',
  V: 'bg-[#EBEBFF]',
  E: 'bg-green-100',
  M: 'bg-purple-100',
  I: 'bg-blue-50',
  A: 'bg-rose-100',
};

function NewsIcon({ type }: { type: string }) {
  if (type === 'N') return (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#d97706" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
  if (type === 'V') return (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#3B3EFF" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
  if (type === 'E') return (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth={2}>
      <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" />
      <path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
  if (type === 'M') return (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#9333ea" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
  if (type === 'I') return (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#3b82f6" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
  if (type === 'A') return (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#e11d48" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
  return (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#6b7280" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function getNewsLink(item: NewsResponse): string | null {
  if (item.targetId == null) return null;
  const base = `/${item.teamId}`;
  switch (item.targetType) {
    case 'N': return `${base}/notices/${item.targetId}`;
    case 'E': return `${base}/events/${item.targetId}`;
    case 'V': return `${base}/votes/${item.targetId}`;
    case 'I': return `${base}/minutes/${item.targetId}`;
    default: return null;
  }
}

function HomeNewsCard({ news, teamName, currentUserId }: { news: NewsResponse; teamName?: string; currentUserId: string }) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const queryClient = useQueryClient();

  const canComment = news.targetType === 'M' || news.targetType === 'A';
  const link = getNewsLink(news);
  const bgCls = TARGET_BG[news.targetType] ?? 'bg-zinc-100';

  const { data: comments = [], isLoading: loadingComments } = useQuery({
    queryKey: ['comments', news.newsId],
    queryFn: async () => {
      const { data } = await api.get(`/api/news/${news.newsId}/comments`);
      return data.data as CommentResponse[];
    },
    enabled: showComments && canComment,
  });

  const addCommentMutation = useMutation({
    mutationFn: () =>
      api.post('/api/news/comments', { newsId: news.newsId, cmtContent: commentText.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', news.newsId] });
      setCommentText('');
    },
  });

  const updateCommentMutation = useMutation({
    mutationFn: ({ cmtId, cmtContent }: { cmtId: number, cmtContent: string }) => api.put(`/api/news/comments/${cmtId}`, { cmtContent }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', news.newsId] });
      setEditingCommentId(null);
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (cmtId: number) => api.delete(`/api/news/comments/${cmtId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', news.newsId] }),
  });

  const inner = (
    <div className="flex items-start gap-3 px-3 py-3">
      <div className={`w-8 h-8 rounded-full ${bgCls} shrink-0 flex items-center justify-center`}>
        <NewsIcon type={news.targetType} />
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        {teamName && (
          <span className="inline-block text-[10px] font-semibold text-[#3B3EFF] bg-[#EBEBFF] px-1.5 py-0.5 rounded-full mb-1 truncate max-w-full">
            {teamName}
          </span>
        )}
        <p className="text-[13px] text-zinc-800 leading-snug">{news.newsContent}</p>
      </div>
      {link && (
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#a1a1aa" strokeWidth={2} className="shrink-0 mt-0.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      )}
    </div>
  );

  if (link) {
    return (
      <Link href={link} className="block bg-zinc-50 rounded-xl hover:bg-zinc-100 transition-colors">
        {inner}
      </Link>
    );
  }

  return (
    <div className="bg-zinc-50 rounded-xl overflow-hidden">
      {inner}
      {canComment && (
        <>
          <div className="px-3 pb-2 border-t border-zinc-100">
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1 text-[12px] text-zinc-400 mt-2"
            >
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {showComments ? '댓글 접어두기' : '댓글'}
            </button>
          </div>
          {showComments && (
            <div className="border-t border-zinc-100 px-3 py-3 flex flex-col gap-3">
              {loadingComments ? (
                <p className="text-[12px] text-zinc-400">불러오는 중...</p>
              ) : (
                <>
                  {comments.length === 0 && (
                    <p className="text-[12px] text-zinc-400">첫 댓글을 남겨보세요.</p>
                  )}
                  {comments.map((cmt) => {
                    const isMyComment = cmt.memId === currentUserId;
                    return (
                    <div key={cmt.cmtId} className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-zinc-200 shrink-0 flex items-center justify-center text-[10px] text-zinc-500 font-medium overflow-hidden">
                          {cmt.userImg && cmt.userImg !== 'default' ? (
                            <img src={cmt.userImg} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            (cmt.memNic || cmt.memId)?.slice(0, 1) || '?'
                          )}
                        </div>
                        {editingCommentId === cmt.cmtId ? (
                          <div className="flex-1 min-w-0 flex gap-2">
                            <input
                              value={editCommentText}
                              onChange={(e) => setEditCommentText(e.target.value)}
                              className="flex-1 border border-zinc-200 rounded px-2 py-1 text-[12px] outline-none focus:border-[#3B3EFF]"
                            />
                            <button onClick={() => updateCommentMutation.mutate({ cmtId: cmt.cmtId, cmtContent: editCommentText })} className="text-[11px] font-semibold text-[#3B3EFF] shrink-0">저장</button>
                            <button onClick={() => setEditingCommentId(null)} className="text-[11px] text-zinc-400 shrink-0">취소</button>
                          </div>
                        ) : (
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-semibold text-zinc-800 mb-0.5">{cmt.memNic || cmt.memId}</p>
                            <p className="text-[12px] text-zinc-700 leading-snug">{cmt.cmtContent}</p>
                            <p className="text-[10px] text-zinc-400 mt-0.5">{cmt.cmtRegDtm?.slice(0, 16)}</p>
                          </div>
                        )}
                      </div>
                      {isMyComment && editingCommentId !== cmt.cmtId && (
                        <div className="shrink-0 flex items-center gap-2 pt-0.5">
                          <button onClick={() => { setEditingCommentId(cmt.cmtId); setEditCommentText(cmt.cmtContent); }} className="text-[11px] text-zinc-400 hover:text-[#3B3EFF] transition-colors">
                            수정
                          </button>
                          <button
                            onClick={() => deleteCommentMutation.mutate(cmt.cmtId)}
                            className="text-[11px] text-zinc-400 hover:text-red-400 transition-colors"
                          >
                            삭제
                          </button>
                        </div>
                      )}
                    </div>
                  )})}
                </>
              )}
              <div className="flex gap-2">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && commentText.trim()) addCommentMutation.mutate(); }}
                  placeholder="댓글 입력..."
                  className="flex-1 border border-zinc-200 rounded-lg px-3 py-1.5 text-[13px] outline-none focus:border-[#3B3EFF] bg-white"
                />
                <button
                  disabled={!commentText.trim() || addCommentMutation.isPending}
                  onClick={() => addCommentMutation.mutate()}
                  className="px-3 py-1.5 bg-[#3B3EFF] text-white rounded-lg text-[12px] font-semibold disabled:bg-zinc-200 disabled:text-zinc-400"
                >
                  등록
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function MainPage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabType>('내 모임');
  const [missionFilter, setMissionFilter] = useState<MissionFilter>('전체');
  const [menuOpen, setMenuOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [newsLimit, setNewsLimit] = useState(5);
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
  const id = user?.userId || '';

  const { data: myTeams} = useQuery({
    queryKey: ['myTeams'],
    queryFn: async () => {
      const { data } = await api.get('/api/teams/my');
      return data.data as TeamResponse[];
    },
  });

  const { data: waitTeams } = useQuery({
    queryKey: ['waitTeams'],
    queryFn: async () => {
      const { data } = await api.get('/api/teams/my/waiting');
      return data.data as TeamResponse[];
    },
  });

  const teamNameMap = Object.fromEntries(
    (myTeams ?? []).map((t) => [t.teamId, t.teamName])
  );

  const { data: myMissions = [], isLoading: missionsLoading } = useQuery({
    queryKey: ['myMissions'],
    queryFn: async () => {
      const { data } = await api.get('/api/missions/my');
      return data.data as MyMissionResponse[];
    },
    enabled: tab === '미션',
  });

  const filteredMissions = myMissions.filter((m) => {
    const s = missionStatus(m);
    if (missionFilter === '전체') return true;
    if (missionFilter === '진행 중') return s !== '완료';
    return s === '완료';
  });

  const { data: news = [], isLoading } = useQuery({
    queryKey: ['news', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/news/all`);
      return data.data as NewsResponse[];
    },
    enabled: !!id,
  });

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
                    <div className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity relative">
                      {group.teamImg && group.teamImg !== 'default' && (
                        <img src={group.teamImg} alt={group.teamName} className="absolute inset-0 w-full h-full object-cover" />
                      )}
                      <div
                        className="absolute inset-0 w-full h-full flex items-end p-2"
                        style={{ backgroundColor: group.teamImg && group.teamImg !== 'default' ? 'rgba(0,0,0,0.4)' : GROUP_COLORS[i % GROUP_COLORS.length] }}
                      >
                        <div className="w-full relative z-10">
                          <p className={`text-[11px] font-semibold leading-tight truncate ${group.teamImg && group.teamImg !== 'default' ? 'text-white' : 'text-zinc-800'}`}>{group.teamName}</p>
                          <p className={`text-[10px] ${group.teamImg && group.teamImg !== 'default' ? 'text-zinc-200' : 'text-zinc-500'}`}>참여 인원 {group.currentMember}명</p>
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
                대기 중인 모임 <span className="text-zinc-400">({waitTeams?.length ?? 0}개)</span>
              </p>
              <div className="grid grid-cols-3 gap-2">
                {waitTeams && waitTeams.map((group, i) => (
                  <div key={group.teamId} className="aspect-square rounded-xl overflow-hidden opacity-60 relative">
                    {group.teamImg && group.teamImg !== 'default' && (
                      <img src={group.teamImg} alt={group.teamName} className="absolute inset-0 w-full h-full object-cover" />
                    )}
                    <div
                      className="absolute inset-0 w-full h-full flex items-end p-2"
                      style={{ backgroundColor: group.teamImg && group.teamImg !== 'default' ? 'rgba(0,0,0,0.4)' : GROUP_COLORS[i % GROUP_COLORS.length] }}
                    >
                      <div className="w-full relative z-10">
                        <p className={`text-[11px] font-semibold leading-tight truncate ${group.teamImg && group.teamImg !== 'default' ? 'text-white' : 'text-zinc-800'}`}>{group.teamName}</p>
                        <p className={`text-[10px] ${group.teamImg && group.teamImg !== 'default' ? 'text-zinc-200' : 'text-zinc-500'}`}>승인 대기 중</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {!waitTeams && <p className="text-center text-[13px] text-zinc-400 py-8">불러오는 중...</p>}
            </div>

            {/* 최근 소식 */}
            <div>
              <p className="text-[13px] font-semibold text-zinc-500 mb-3">최근 소식</p>
              <div className="space-y-2">
                {isLoading && (
                  <div className="p-3 rounded-xl bg-zinc-50 animate-pulse h-14" />
                )}
                {!isLoading && news.length === 0 && (
                  <p className="text-[13px] text-zinc-400 py-2">최근 소식이 없습니다.</p>
                )}
                {news.slice(0, newsLimit).map((item) => (
                  <HomeNewsCard key={item.newsId} news={item} teamName={teamNameMap[item.teamId]} currentUserId={id} />
                ))}
              </div>
              {news.length > newsLimit && (
                <button
                  onClick={() => setNewsLimit((prev) => prev + 5)}
                  className="w-full mt-2 py-2 text-[13px] text-zinc-500 hover:text-zinc-800 font-medium transition-colors"
                >
                  더보기
                </button>
              )}
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
              {missionsLoading ? (
                <p className="text-center text-[13px] text-zinc-400 py-10">불러오는 중...</p>
              ) : filteredMissions.length === 0 ? (
                <p className="text-center text-[13px] text-zinc-400 py-10">미션이 없습니다.</p>
              ) : (
                filteredMissions.map((m) => {
                  const status = missionStatus(m);
                  const deadline = calcDeadline(m.missionEndDtm);
                  const authType = m.missionType === 'I' ? 'AI인증' : '수동인증';
                  const href = missionHref(m, status);
                  return (
                    <div key={m.missionId} className="bg-white rounded-lg px-4 py-3 flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full shrink-0 ${status === '완료' || status === '실패' ? 'bg-zinc-300' : 'bg-zinc-200'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-zinc-400 font-medium mb-1">{m.teamName}</p>
                        <div className="flex gap-1 mb-1">
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: AUTH_COLOR[authType] }}>{authType}</span>
                        </div>
                        <p className="text-[12px] font-medium text-zinc-800 leading-tight">{m.missionTitle}</p>
                        <p className="text-[11px] text-zinc-400 mt-0.5">{m.missionContent}</p>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-2">
                        {status === '가능' && (
                          <>
                            {deadline && <p className="text-[12px]"><span className="text-zinc-800">마감까지 </span><span className={deadlineColor(deadline)}>{deadline}</span></p>}
                            <button onClick={() => router.push(href)} className="text-[12px] font-semibold text-white bg-[#3B3EFF] rounded-lg px-3.5 py-1.5 flex items-center gap-1 whitespace-nowrap">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                              인증하기
                            </button>
                          </>
                        )}
                        {status === '대기' && (
                          <>
                            {deadline ? <p className="text-[12px]"><span className="text-zinc-800">마감까지 </span><span className={deadlineColor(deadline)}>{deadline}</span></p> : <span className="text-[12px] text-zinc-400">마감</span>}
                            <button onClick={() => router.push(href)} className="text-[12px] font-semibold text-white bg-[#3B3EFF] rounded-lg px-3.5 py-1.5 flex items-center gap-1 whitespace-nowrap">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                              승인 대기
                            </button>
                          </>
                        )}
                        {status === '실패' && (
                          <>
                            <span className="text-[12px] text-zinc-400">마감</span>
                            <button onClick={() => router.push(href)} className="text-[12px] font-semibold text-[#3B3EFF] bg-white border border-[#3B3EFF] rounded-lg px-3.5 py-1.5 flex items-center gap-1 whitespace-nowrap">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                              인증 실패
                            </button>
                          </>
                        )}
                        {status === '완료' && (
                          <>
                            <span className="text-[12px] text-zinc-400">마감</span>
                            <button onClick={() => router.push(href)} className="text-[12px] font-medium text-zinc-400 bg-zinc-100 rounded-lg px-3.5 py-1.5 flex items-center gap-1 whitespace-nowrap">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
                              인증 완료
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
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