'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  userImgId: number | null;
  imgFileKey: string | null;
}

const STATE_LABELS: Record<string, string> = {
  A: '활동 중',
  W: '가입 대기',
  R: '가입 거절',
};

const STATE_DOT: Record<string, string> = {
  A: 'bg-green-500',
  W: 'bg-yellow-400',
  R: 'bg-red-500',
};

interface UserImgItem {
  imgId: number;
  imgFileKey: string;
}

function EditModal({
  member,
  onClose,
  onSave,
  isPending,
}: {
  member: MemberResponse;
  onClose: () => void;
  onSave: (nick: string, bio: string, imgId: number | null) => void;
  isPending: boolean;
}) {
  const [nick, setNick] = useState(member.memNic ?? '');
  const [bio, setBio] = useState('');
  const [selectedImgId, setSelectedImgId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const { data: images, refetch: refetchImages } = useQuery<UserImgItem[]>({
    queryKey: ['myImages'],
    queryFn: async () => {
      const { data } = await api.get('/api/users/me/images');
      return data.data as UserImgItem[];
    },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-[320px] p-6 shadow-xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h3 className="text-[16px] font-bold text-zinc-900 text-center mb-5">프로필 수정</h3>

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
          <div className="flex flex-wrap gap-2 p-2 bg-zinc-50 border border-zinc-200 rounded-xl min-h-[72px] my-3">
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
                    <img src={img.imgFileKey} alt="프로필" className="w-full h-full object-cover mb-3" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <span className="text-[13px] font-medium text-zinc-600 w-16 shrink-0">닉네임</span>
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
          onClick={() => onSave(nick, bio, selectedImgId)}
          disabled={isPending}
          className="w-full bg-[#3B3EFF] text-white text-[14px] font-semibold rounded-xl py-2.5 disabled:opacity-60"
        >
          완료
        </button>
      </div>
    </div>
  );
}

export default function MemberDetailPage() {
  const { id, memberId } = useParams<{ id: string; memberId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showKickConfirm, setShowKickConfirm] = useState(false);

  const { data: myMembership } = useQuery({
    queryKey: ['memberMe', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/members/me?teamId=${id}`);
      return data.data as MemberResponse;
    },
    enabled: !!id,
  });

  const isLeader = myMembership?.memRole === 'L' && myMembership?.memState === 'A';

  const { data: member, isLoading } = useQuery({
    queryKey: ['member', memberId],
    queryFn: async () => {
      const { data } = await api.get(`/api/members/${memberId}`);
      return data.data as MemberResponse;
    },
    enabled: !!memberId,
  });

  const isOwnProfile = member?.memId === myMembership?.memId;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['members', id] });
    queryClient.invalidateQueries({ queryKey: ['member', memberId] });
    queryClient.invalidateQueries({ queryKey: ['memberMe', id] });
  };

  const approveMutation = useMutation({
    mutationFn: () => api.patch(`/api/members/${memberId}/approve`),
    onSuccess: () => { invalidate(); router.back(); },
  });

  const rejectMutation = useMutation({
    mutationFn: () => api.patch(`/api/members/${memberId}/reject`),
    onSuccess: () => { invalidate(); router.back(); },
  });

  const saveMutation = useMutation({
    mutationFn: ({ nick, bio, imgId }: { nick: string; bio: string; imgId: number | null }) =>
      api.patch(`/api/members/${memberId}`, {
        memNic: nick,
        ...(bio && { memBio: bio }),
        ...(imgId !== null && { userImgId: imgId }),
      }),
    onSuccess: () => { invalidate(); setShowEditModal(false); },
  });

  const kickMutation = useMutation({
    mutationFn: () => api.delete(`/api/members/${memberId}`),
    onSuccess: () => { invalidate(); router.back(); },
  });

  if (isLoading) {
    return <div className="text-center py-20 text-zinc-500 text-sm">불러오는 중...</div>;
  }

  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-[14px] text-zinc-400">멤버 정보를 찾을 수 없습니다.</p>
        <button onClick={() => router.back()} className="text-[13px] text-blue-500">돌아가기</button>
      </div>
    );
  }

  const canActOnMember = isLeader && member.memState === 'W';

  return (
    <div className="pt-6 px-1">
      {showKickConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-[300px] p-6 shadow-xl">
            <h3 className="text-[16px] font-bold text-zinc-900 text-center mb-2">멤버 강퇴</h3>
            <p className="text-[13px] text-zinc-500 text-center mb-6">
              <span className="font-semibold text-zinc-800">{member.memNic}</span> 님을 모임에서 강퇴하시겠습니까?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowKickConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-[14px] font-medium text-zinc-600 border border-zinc-200"
              >
                취소
              </button>
              <button
                onClick={() => kickMutation.mutate()}
                disabled={kickMutation.isPending}
                className="flex-1 py-2.5 rounded-xl text-[14px] font-semibold text-white bg-red-500 disabled:opacity-60"
              >
                강퇴
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <EditModal
          member={member}
          onClose={() => setShowEditModal(false)}
          onSave={(nick, bio, imgId) => saveMutation.mutate({ nick, bio, imgId })}
          isPending={saveMutation.isPending}
        />
      )}

      {/* 프로필 상단 */}
      <div className="flex items-center gap-4 pb-8 border-b border-zinc-100">
        <div className="w-20 h-20 rounded-full bg-[#C4B5FD] flex items-center justify-center text-[24px] font-bold text-white shrink-0 overflow-hidden">
          {member.imgFileKey ? (
            <img src={member.imgFileKey} alt="프로필" className="w-full h-full object-cover" />
          ) : (
            member.memNic ? member.memNic[0] : '?'
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-[20px] font-bold text-zinc-900 truncate">{member.memNic}</h1>
            {member.memRole === 'L' && (
              <span className="text-[11px] font-semibold text-white bg-[#3B3EFF] rounded-full px-2 py-0.5 shrink-0">
                리더
              </span>
            )}
          </div>
          <p className="text-[13px] text-zinc-500">
            {member.memRole === 'L' ? '모임장' : '일반 멤버'}
          </p>
        </div>

        {isOwnProfile && (
          <button
            onClick={() => setShowEditModal(true)}
            className="text-[13px] font-medium text-zinc-500 border border-zinc-200 rounded-lg px-3 py-1 shrink-0"
          >
            수정
          </button>
        )}
      </div>

      {/* 상세 정보 */}
      <div className="py-6 space-y-5">
        <div>
          <p className="text-[12px] font-semibold text-zinc-400 mb-1">가입 신청일</p>
          <p className="text-[14px] font-medium text-zinc-800">{member.regDtm}</p>
        </div>
        {member.procDtm && (
          <div>
            <p className="text-[12px] font-semibold text-zinc-400 mb-1">처리일</p>
            <p className="text-[14px] font-medium text-zinc-800">{member.procDtm}</p>
          </div>
        )}
        <div>
          <p className="text-[12px] font-semibold text-zinc-400 mb-1">상태</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`w-2 h-2 rounded-full ${STATE_DOT[member.memState] ?? 'bg-zinc-400'}`} />
            <span className="text-[14px] font-medium text-zinc-800">
              {STATE_LABELS[member.memState] ?? member.memState}
            </span>
          </div>
        </div>
      </div>

      {canActOnMember && (
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => rejectMutation.mutate()}
            disabled={approveMutation.isPending || rejectMutation.isPending}
            className="flex-1 py-3 rounded-xl text-[14px] font-semibold border border-zinc-200 text-zinc-600 disabled:opacity-50"
          >
            거절
          </button>
          <button
            onClick={() => approveMutation.mutate()}
            disabled={approveMutation.isPending || rejectMutation.isPending}
            className="flex-1 py-3 rounded-xl text-[14px] font-semibold bg-[#3B3EFF] text-white disabled:opacity-50"
          >
            승인
          </button>
        </div>
      )}

      {isLeader && !isOwnProfile && member.memState === 'A' && (
        <div className="pt-2">
          <button
            onClick={() => setShowKickConfirm(true)}
            className="w-full py-3 rounded-xl text-[14px] font-semibold text-red-500 border border-red-200"
          >
            강퇴
          </button>
        </div>
      )}
    </div>
  );
}