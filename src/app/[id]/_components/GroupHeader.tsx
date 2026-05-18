'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { useHeaderSlotStore } from '@/store/headerSlot';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

interface MemberMe {
  memId: string;
  memNic: string;
  memRole: string;
  memState: string;
}

export default function GroupHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const id = params?.id as string;
  const { editSlot, pageHeader } = useHeaderSlotStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: teamName } = useQuery({
    queryKey: ['groupName', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/teams/${id}`);
      return data.data.teamName as string;
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

  const initial = myMember?.memNic?.[0] ?? '?';

  const leaveMutation = useMutation({
    mutationFn: () => api.delete(`/api/members/${myMember?.memId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myTeams'] });
      router.push('/main');
    },
  });

  const handleLeave = () => {
    if (confirm('정말 이 모임을 탈퇴하시겠습니까?')) {
      leaveMutation.mutate();
    }
  };

  const handleBack = () => {
    const parts = pathname.split('/').filter(Boolean);
    const isDetailPage = parts.length >= 3; // e.g., /[id]/events/123

    if (pathname.includes('/new') || pathname.includes('/create') || pathname.includes('/info') || isDetailPage) {
      router.back();
    } else {
      router.push('/main');
    }
  };


  return (
    <>
      <header className="flex items-center justify-between px-4 h-[52px] shrink-0 border-b border-zinc-100 bg-white">
        <div className="flex items-center gap-2">
          <button onClick={handleBack} className="p-1 text-zinc-500">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-[17px] font-bold tracking-tight">
            {pageHeader ? pageHeader.title : (teamName || '모임명')}
          </span>
        </div>

        {editSlot ? (
          editSlot.editing ? (
            <div className="flex items-center gap-2">
              <button
                onClick={editSlot.onCancel}
                className="text-[13px] font-medium text-zinc-500 border border-zinc-200 rounded-lg px-3 py-1"
              >
                취소
              </button>
              <button
                onClick={editSlot.onSave}
                className="text-[13px] font-semibold text-white bg-[#3B3EFF] rounded-lg px-3 py-1"
              >
                저장
              </button>
            </div>
          ) : (
            <button onClick={editSlot.onEdit} className="p-1 text-zinc-600">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 0l.172.172a2 2 0 010 2.828L12 16H9v-3z" />
              </svg>
            </button>
          )
        ) : pageHeader?.hideHamburger ? (
          <div className="w-7" />
        ) : (
          <button onClick={() => setMenuOpen(true)} className="p-1 text-zinc-700">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
      </header>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div className="fixed top-[52px] right-4 z-50 bg-white rounded-xl shadow-xl w-[190px] overflow-hidden border border-zinc-100"
            style={{ right: 'calc(50% - 195px + 16px)' }}>

            {/* 모임 내 프로필 */}
            <div className="flex items-center gap-2.5 px-3.5 py-3 border-b border-zinc-100">
              <div className="w-8 h-8 rounded-full bg-[#C4B5FD] flex items-center justify-center shrink-0">
                <span className="text-[13px] font-bold text-white">{initial}</span>
              </div>
              <p className="text-[13px] font-bold text-zinc-900 truncate">{myMember?.memNic ?? '...'}</p>
            </div>

            {/* 모임 정보 */}
            <Link
              href={`/${id}/info`}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 px-4 py-3 border-b border-zinc-100 hover:bg-zinc-50"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span className="text-[13px] font-medium text-zinc-800">모임 정보</span>
            </Link>

            {/* 모임내 프로필 */}
            {myMember && (
              <Link
                href={`/${id}/members/${myMember.memId}`}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-3 border-b border-zinc-100 hover:bg-zinc-50"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
                <span className="text-[13px] font-medium text-zinc-800">모임 프로필</span>
              </Link>
            )}

            {/* 모임 탈퇴 */}
            <button
              onClick={handleLeave}
              disabled={leaveMutation.isPending}
              className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-zinc-50"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              <span className="text-[13px] font-medium text-red-500">모임 탈퇴</span>
            </button>
          </div>
        </>
      )}
    </>
  );
}