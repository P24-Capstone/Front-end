'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

type SortType = '최근순' | '제목순';

export interface Notice {
  id: string;
  title: string;
  date: string;
  author: string;
  content: string;
  isPinned: boolean;
  isRequired: boolean;
}

export const NOTICES: Notice[] = [
  {
    id: '1',
    title: '환영합니다! 독서모임 안내',
    date: '2026.02.10',
    author: '김민준',
    content: '독서 모임에 오신 것을 환영합니다!\n\n매월 1권의 책을 선정하여 함께 읽고 이야기 나눕니다.\n정기 모임은 매월 두 번째 수요일 오후 7시에 진행됩니다.',
    isPinned: true,
    isRequired: true,
  },
  {
    id: '2',
    title: '회비 운영 공지',
    date: '2026.02.10',
    author: '이서연',
    content: '월 회비는 5,000원이며 매월 첫째 주 모임 시 걷습니다.\n회비는 간식비와 모임 장소 대관료로 사용됩니다.',
    isPinned: true,
    isRequired: true,
  },
  {
    id: '3',
    title: '토론 주제 공유해드립니다',
    date: '2026.02.10',
    author: '박지호',
    content: '이번 달 토론 주제를 공유드립니다.\n\n1. 주인공의 선택에 동의하시나요?\n2. 책에서 가장 인상 깊었던 장면은 무엇인가요?\n3. 작가가 전달하려는 메시지는 무엇이라 생각하시나요?',
    isPinned: false,
    isRequired: false,
  },
  {
    id: '4',
    title: '정기 모임 안내',
    date: '2026.02.10',
    author: '김민준',
    content: '이번 달 정기 모임 일정을 안내드립니다.\n\n일시: 2월 12일(수) 오후 7시\n장소: 강남구 카페 라운지\n\n많은 참여 바랍니다.',
    isPinned: false,
    isRequired: true,
  },
  {
    id: '5',
    title: '이번주 읽기 인증 안내',
    date: '2026.02.10',
    author: '최유진',
    content: '이번 주 읽기 인증을 카카오톡 단체방에 올려주세요.\n\n인증 방법: 읽은 페이지가 보이도록 사진 촬영 후 업로드\n마감: 이번 주 일요일 자정',
    isPinned: false,
    isRequired: false,
  },
];

function sortNotices(notices: Notice[], sort: SortType): Notice[] {
  const pinned = notices.filter((n) => n.isPinned);
  const rest = notices.filter((n) => !n.isPinned);
  const sorted = [...rest].sort((a, b) =>
    sort === '제목순' ? a.title.localeCompare(b.title) : b.date.localeCompare(a.date)
  );
  return [...pinned, ...sorted];
}

function PinIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="17" x2="12" y2="22" />
      <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
    </svg>
  );
}

export default function NoticesPage() {
  const { id } = useParams<{ id: string }>();
  const [sort, setSort] = useState<SortType>('최근순');

  const sorted = sortNotices(NOTICES, sort);

  return (
    <div>
      {/* 정렬 */}
      <div className="flex items-center justify-center mb-1 pb-3 border-b border-zinc-100">
        <button
          onClick={() => setSort('최근순')}
          className={`text-[13px] px-2 ${sort === '최근순' ? 'font-semibold text-zinc-900' : 'text-zinc-400'}`}
        >
          최근순
        </button>
        <span className="text-zinc-300 text-[13px]">|</span>
        <button
          onClick={() => setSort('제목순')}
          className={`text-[13px] px-2 ${sort === '제목순' ? 'font-semibold text-zinc-900' : 'text-zinc-400'}`}
        >
          제목순
        </button>
      </div>

      {/* 공지 목록 */}
      <div>
        {sorted.map((notice) => (
          <Link
            key={notice.id}
            href={`/${id}/notices/${notice.id}`}
            className="flex items-start justify-between py-4 border-b border-zinc-100 gap-2"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                {notice.isRequired && (
                  <span className="text-[11px] font-semibold text-white bg-blue-500 rounded-full px-2 py-0.5 shrink-0">
                    필독
                  </span>
                )}
                <p className="text-[14px] font-medium text-zinc-900">{notice.title}</p>
              </div>
              <p className="text-[12px] text-zinc-400 mt-1">{notice.date}</p>
            </div>
            {notice.isPinned && (
              <div className="shrink-0 mt-0.5">
                <PinIcon />
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
