'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { label: '홈', href: 'home' },
  { label: '멤버', href: 'members' },
  { label: '일정', href: 'events' },
  { label: '투표', href: 'votes' },
  { label: '공지', href: 'notices' },
  { label: '미션', href: 'missions' },
  { label: '기록', href: 'minutes' },
  { label: '소식', href: 'news' },
];

export default function GroupNav({ groupId }: { groupId: string }) {
  const pathname = usePathname();

  const segments = pathname.split('/');
  const isDetailPage =
    segments.length >= 4 &&
    (pathname.includes('/events/') || pathname.includes('/notices/') || pathname.includes('/votes/') || pathname.includes('/minutes/'));
  if (isDetailPage) return null;

  return (
    <nav className="flex overflow-x-auto border-b border-zinc-100 bg-white" style={{ scrollbarWidth: 'none' }}>
      {TABS.map((tab) => {
        const href = `/${groupId}/${tab.href}`;
        const isActive = pathname === href;
        return (
          <Link
            key={tab.href}
            href={href}
            className={`shrink-0 px-4 py-2.5 text-[13px] font-medium transition-colors whitespace-nowrap ${isActive
              ? 'text-black border-b-2 border-black -mb-px'
              : 'text-zinc-400'
              }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
