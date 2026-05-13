'use client';

import { useRouter, usePathname, useParams } from 'next/navigation';
import { useHeaderSlotStore } from '@/store/headerSlot';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function GroupHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const id = params?.id as string;
  const { editSlot, pageHeader } = useHeaderSlotStore();

  const { data: teamName } = useQuery({
    queryKey: ['groupName', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/teams/${id}`);
      return data.data.teamName as string;
    },
    enabled: !!id,
  });

  const segments = pathname.split('/');
  let backHref = '/main';
  if (segments.length >= 4) {
    if (pathname.includes('/events/')) backHref = `/${segments[1]}/events`;
    else if (pathname.includes('/notices/')) backHref = `/${segments[1]}/notices`;
    else if (pathname.includes('/votes/')) backHref = `/${segments[1]}/votes`;
    else if (pathname.includes('/minutes/')) backHref = `/${segments[1]}/minutes`;
    else if (pathname.includes('/missions/')) backHref = `/${segments[1]}/missions`;
  }

  return (
    <header className="flex items-center justify-between px-4 h-[52px] shrink-0 border-b border-zinc-100 bg-white">
      <div className="flex items-center gap-2">
        <button onClick={() => router.push(backHref)} className="p-1 text-zinc-500">
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
        <button className="p-1 text-zinc-700">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}
    </header>
  );
}