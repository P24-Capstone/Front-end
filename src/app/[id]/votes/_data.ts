const MEETING_DATE_DESC = '이번 정기모임 날짜 정하려고 투표 올립니다! 참석 가능한 날짜 모두 선택해주세요 🙌 가능한 인원이 가장 많은 날로 확정할게요.';

export interface Voter {
  id: string;
  name: string;
}

export interface VoteOptionResult {
  optionId: string;
  voters: Voter[];
}

export interface VoteOption {
  id: string;
  label: string;
}

export interface Vote {
  id: string;
  title: string;
  description: string;
  totalVotes: number;
  daysLeft: number | null;
  hasVoted: boolean;
  options: VoteOption[];
  totalMembers?: number;
  results?: VoteOptionResult[];
  nonParticipants?: Voter[];
  tieBreaker?: '재투표 진행' | '팀장 임의 결정';
  status?: '팀장확정대기' | '재투표 중';
  retryDaysLeft?: number;
}

export const VOTES: Vote[] = [
  {
    id: '1',
    title: '4월 모임 날짜',
    description: MEETING_DATE_DESC,
    totalVotes: 12,
    daysLeft: 10,
    hasVoted: false,
    options: [
      { id: 'a', label: '2026년 4월 9일 (목)' },
      { id: 'b', label: '2026년 4월 14일 (화)' },
      { id: 'c', label: '2026년 4월 19일 (일)' },
    ],
  },
  {
    id: '2',
    title: '5월 모임 날짜',
    description: '5월 정기모임 날짜를 정해요! 편하신 날짜 모두 선택해 주세요.',
    totalVotes: 12,
    daysLeft: 40,
    hasVoted: true,
    options: [
      { id: 'a', label: '2026년 5월 7일 (목)' },
      { id: 'b', label: '2026년 5월 14일 (목)' },
      { id: 'c', label: '2026년 5월 21일 (목)' },
    ],
  },
  {
    id: '3',
    title: '6월 모임 날짜',
    description: '6월 정기모임 날짜를 정해요! 편하신 날짜 모두 선택해 주세요.',
    totalVotes: 12,
    daysLeft: 70,
    hasVoted: false,
    options: [
      { id: 'a', label: '2026년 6월 4일 (목)' },
      { id: 'b', label: '2026년 6월 11일 (목)' },
      { id: 'c', label: '2026년 6월 18일 (목)' },
    ],
  },
  {
    id: '4',
    title: '3월 모임 날짜',
    description: MEETING_DATE_DESC,
    totalVotes: 12,
    daysLeft: null,
    hasVoted: true,
    totalMembers: 5,
    options: [
      { id: 'a', label: '2026년 3월 5일 (목)' },
      { id: 'b', label: '2026년 3월 12일 (목)' },
      { id: 'c', label: '2026년 3월 19일 (목)' },
    ],
    results: [
      { optionId: 'a', voters: [{ id: '1', name: '김민준' }, { id: '2', name: '이서연' }, { id: '3', name: '박지훈' }, { id: '4', name: '나' }] },
      { optionId: 'b', voters: [{ id: '1', name: '김민준' }, { id: '2', name: '이서연' }, { id: '3', name: '박지훈' }] },
      { optionId: 'c', voters: [{ id: '1', name: '김민준' }] },
    ],
    nonParticipants: [{ id: '5', name: '최유진' }],
  },
  {
    id: '5',
    title: '2월 모임 날짜',
    description: MEETING_DATE_DESC,
    totalVotes: 9,
    daysLeft: null,
    hasVoted: true,
    totalMembers: 5,
    tieBreaker: '팀장 임의 결정',
    status: '팀장확정대기',
    options: [
      { id: 'a', label: '2026년 2월 5일 (목)' },
      { id: 'b', label: '2026년 2월 12일 (목)' },
      { id: 'c', label: '2026년 2월 19일 (목)' },
    ],
    results: [
      { optionId: 'a', voters: [{ id: '1', name: '김민준' }, { id: '2', name: '이서연' }, { id: '3', name: '박지호' }, { id: '4', name: '최유나' }] },
      { optionId: 'b', voters: [{ id: '1', name: '김민준' }, { id: '6', name: '이현우' }, { id: '7', name: '박다은' }, { id: '8', name: '최나희' }] },
      { optionId: 'c', voters: [{ id: '2', name: '이서연' }] },
    ],
    nonParticipants: [],
  },
  {
    id: '6',
    title: '1월 모임 날짜',
    description: '1월 정기모임 날짜를 정해요! 편하신 날짜 모두 선택해 주세요.',
    totalVotes: 8,
    daysLeft: null,
    hasVoted: true,
    totalMembers: 5,
    tieBreaker: '재투표 진행',
    status: '재투표 중',
    retryDaysLeft: 3,
    options: [
      { id: 'a', label: '2026년 1월 8일 (목)' },
      { id: 'b', label: '2026년 1월 15일 (목)' },
      { id: 'c', label: '2026년 1월 22일 (목)' },
    ],
    results: [
      { optionId: 'a', voters: [{ id: '1', name: '김민준' }, { id: '2', name: '이서연' }, { id: '3', name: '박지훈' }] },
      { optionId: 'b', voters: [{ id: '1', name: '김민준' }, { id: '2', name: '이서연' }, { id: '3', name: '박지훈' }] },
      { optionId: 'c', voters: [{ id: '4', name: '최유진' }, { id: '5', name: '나' }] },
    ],
    nonParticipants: [],
  },
];
