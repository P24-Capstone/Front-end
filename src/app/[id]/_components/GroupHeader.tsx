'use client';

import { useRouter, usePathname } from 'next/navigation';

export default function GroupHeader() {
  const router = useRouter();
  const pathname = usePathname();

  const segments = pathname.split('/');
  let backHref = '/main';
  if (segments.length === 4) {
    if (pathname.includes('/events/')) backHref = `/${segments[1]}/events`;
    else if (pathname.includes('/notices/')) backHref = `/${segments[1]}/notices`;
  }

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 bg-white">
      <div className="flex items-center gap-2">
        <button onClick={() => router.push(backHref)} className="p-1 text-zinc-500">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-[17px] font-bold tracking-tight">모임명</span>
      </div>
      <button className="p-1 text-zinc-700">
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </header>
  );
}
