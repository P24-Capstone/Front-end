export interface MinuteTag {
  label: string;
  className: string;
}

export interface Minute {
  id: string;
  title: string;
  tags: MinuteTag[];
  createdAt: string;
  updatedAt: string;
}

function tag(label: string): MinuteTag {
  return { label, className: 'bg-zinc-100 text-zinc-500' };
}

export interface ScriptEntry {
  time: string;
  speaker: number;
  text: string;
}

export interface MinuteDetail {
  id: string;
  title: string;
  date: string;
  duration: string;
  hashTags: string[];
  summary: string;
  keyPoints: string[];
  script: ScriptEntry[];
  info: {
    creator: string;
    createdAt: string;
    audioFile: string;
    fileLength: string;
    fileSize: string;
  };
}

export const MINUTE_DETAILS: Record<string, MinuteDetail> = {
  '1': {
    id: '1',
    title: '사랑의 기술 독서토론 — 사랑은 감정인가 능력인가',
    date: '2026.04.14',
    duration: '1시간 14분',
    hashTags: ['자기수용', '관계'],
    summary: '에리히 프롬이 말하는 사랑을 \'빠지는 것\'이 아닌 \'실천하는 능력\'으로 보는 관점을 중심으로 토론이 이어졌습니다.\n\n참여자들은 현대 사회에서 사랑이 소비재처럼 다뤄지고 있다는 프롬의 비판에 공감하면서도, 능동적 사랑을 실천하는 것이 현실에서 얼마나 어려운지에 대해 솔직한 이야기를 나눴습니다.',
    keyPoints: [
      '사랑을 기술로 본다는 것이 처음엔 낯설었지만 읽을수록 설득력 있다는 의견 다수',
      '자기 자신을 사랑하지 못하면 타인도 사랑할 수 없다는 명제에 대한 찬반 토론',
      '형제애, 모성애, 에로스적 사랑의 구분이 실생활에서 어떻게 작동하는지 경험 공유',
      '집중, 인내, 훈련 없이는 사랑도 깊어질 수 없다는 프롬의 주장에 대한 논의',
      '다음 책으로 알랭 드 보통의 낭만적 연애와 그 후의 일상 제안 — 다수 동의',
    ],
    script: [
      { time: '00:00', speaker: 1, text: '자 시작할게요. 사랑의 기술 다들 읽어오셨죠? 첫인상이 어땠어요?' },
      { time: '00:08', speaker: 2, text: '제목 보고 연애 조언서인 줄 알았는데 완전 달랐어요. 철학책에 가깝더라고요.' },
      { time: '00:40', speaker: 3, text: '저는 첫 챕터에서 충격받았어요. 어떻게 사랑받을까의 문제로만 접근한다는 부분이요.' },
      { time: '01:12', speaker: 4, text: '사랑받기 위해 매력적으로 보이려는 것, 그게 기본 태도였던 것 같아요.' },
      { time: '02:05', speaker: 1, text: '맞아요. 프롬은 그걸 뒤집어서 사랑은 능력이고 기술이라고 하잖아요.' },
      { time: '03:20', speaker: 2, text: '근데 그 말이 처음엔 너무 차갑게 느껴졌어요. 사랑이 감정이 아니라 노력이라니.' },
      { time: '04:15', speaker: 3, text: '저도 그랬는데 읽다 보니까 오히려 더 진지하게 대하게 되는 것 같더라고요.' },
      { time: '05:30', speaker: 4, text: '자기 자신을 사랑해야 타인도 사랑할 수 있다는 부분이 제일 와닿았어요.' },
    ],
    info: {
      creator: '김리더',
      createdAt: '2026.04.14 오후 12:34',
      audioFile: '6월_정기모임.mp4',
      fileLength: '1시간 5분 35초',
      fileSize: '36.7MB',
    },
  },
};

export const MINUTES: Minute[] = [
  {
    id: '1',
    title: '한강, 채식주의자 독서인증!',
    tags: [tag('해리포터'), tag('소설'), tag('독서')],
    createdAt: '2026-05-09',
    updatedAt: '2026-05-09',
  },
  {
    id: '2',
    title: '한강, 채식주의자 독서인증!',
    tags: [tag('해리포터'), tag('소설'), tag('독서')],
    createdAt: '2026-05-08',
    updatedAt: '2026-05-08',
  },
  {
    id: '3',
    title: '기시미 이치로, 삶을 변화시키는 용기!',
    tags: [tag('미움 받을 용기'), tag('비소설'), tag('독서')],
    createdAt: '2026-04-20',
    updatedAt: '2026-04-21',
  },
  {
    id: '4',
    title: '채사장, 현대 사회를 이해하는 키!',
    tags: [tag('지적 대화를 위한 넓고 얕은 지식'), tag('비소설'), tag('독서')],
    createdAt: '2026-04-16',
    updatedAt: '2026-04-16',
  },
  {
    id: '5',
    title: '톨스토이, 인생에 대한 깊은 성찰!',
    tags: [tag('안나 카레니나'), tag('소설'), tag('독서')],
    createdAt: '2026-04-12',
    updatedAt: '2026-04-13',
  },
  {
    id: '6',
    title: '조지 오웰, 전체주의에 대한 경고!',
    tags: [tag('1984'), tag('소설'), tag('독서')],
    createdAt: '2026-04-08',
    updatedAt: '2026-04-09',
  },
  {
    id: '7',
    title: '스티븐 코비, 7가지 습관!',
    tags: [tag('자기발상'), tag('비소설'), tag('독서')],
    createdAt: '2026-04-05',
    updatedAt: '2026-04-05',
  },
];
