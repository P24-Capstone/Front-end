export interface ScheduleEvent {
  id: string;
  title: string;
  month: string;
  dateNum: string;
  dateDay: string;
  year: string;
  time: string;
  location: string;
  memberCount: number;
  members: string[];
  description: string;
}

export const UPCOMING: ScheduleEvent[] = [
  {
    id: '1',
    title: '독서 모임 정기 모임',
    month: '4', dateNum: '12', dateDay: '수요일',
    year: '2026', time: '오후 03:00 ~ 오후 04:30',
    location: '매머드커피 삼육대점',
    memberCount: 5,
    members: ['김김김', '이이이', '박박박', '최최최', '정정정'],
    description: '같이 책 읽고 편하게 이야기 나누는 시간입니다!\n인상 깊었던 부분이나 느낀 점들을 자유롭게 공유하면 됩니다 :)',
  },
  {
    id: '2',
    title: '감상문 발표의 날',
    month: '4', dateNum: '20', dateDay: '목요일',
    year: '2026', time: '오후 07:00 ~ 오후 08:30',
    location: '스타벅스 건대입구점',
    memberCount: 4,
    members: ['김김김', '이이이', '박박박', '최최최'],
    description: '이번 달 읽은 책에 대한 감상문을 각자 발표하는 시간입니다.\n5분 내외로 준비해 오세요.',
  },
  {
    id: '3',
    title: '이달의 책 선정 투표',
    month: '4', dateNum: '27', dateDay: '목요일',
    year: '2026', time: '오후 06:00 ~ 오후 07:00',
    location: '온라인 (Zoom)',
    memberCount: 5,
    members: ['김김김', '이이이', '박박박', '최최최', '정정정'],
    description: '다음 달 읽을 책을 함께 선정합니다.\n각자 추천 도서 1권씩 준비해 주세요.',
  },
  {
    id: '4',
    title: '5월 정기 모임',
    month: '5', dateNum: '17', dateDay: '월요일',
    year: '2026', time: '오후 03:00 ~ 오후 04:30',
    location: '매머드커피 삼육대점',
    memberCount: 5,
    members: ['김김김', '이이이', '박박박', '최최최', '정정정'],
    description: '5월 정기 모임입니다. 이번 달 읽은 책 이야기를 나눠요.',
  },
  {
    id: '5',
    title: '야외 독서 모임',
    month: '6', dateNum: '28', dateDay: '수요일',
    year: '2026', time: '오전 10:00 ~ 오후 12:00',
    location: '서울숲 피크닉 구역',
    memberCount: 5,
    members: ['김김김', '이이이', '박박박', '최최최', '정정정'],
    description: '날씨 좋은 날 야외에서 함께 독서해요!\n돗자리와 읽을 책을 챙겨오세요.',
  },
];

export const PAST: ScheduleEvent[] = [
  {
    id: 'p1',
    title: '3월 정기 모임',
    month: '3', dateNum: '05', dateDay: '화요일',
    year: '2026', time: '오후 03:00 ~ 오후 04:30',
    location: '매머드커피 삼육대점',
    memberCount: 4,
    members: ['김김김', '이이이', '박박박', '최최최'],
    description: '3월 정기 모임이었습니다.',
  },
  {
    id: 'p2',
    title: '2월 책 감상 나눔',
    month: '2', dateNum: '19', dateDay: '수요일',
    year: '2026', time: '오후 03:00 ~ 오후 04:30',
    location: '매머드커피 삼육대점',
    memberCount: 5,
    members: ['김김김', '이이이', '박박박', '최최최', '정정정'],
    description: '2월에 읽은 책의 감상을 나눴습니다.',
  },
  {
    id: 'p3',
    title: '1월 정기 모임',
    month: '1', dateNum: '08', dateDay: '목요일',
    year: '2026', time: '오후 03:00 ~ 오후 04:30',
    location: '매머드커피 삼육대점',
    memberCount: 5,
    members: ['김김김', '이이이', '박박박', '최최최', '정정정'],
    description: '새해 첫 정기 모임이었습니다.',
  },
];

export const ALL_EVENTS = [...UPCOMING, ...PAST];
