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
