interface Group {
  id: string
  name: string
  memberCount: number
}

// TODO: 백엔드 API 연결 시 아래 주석을 해제하고 임시 데이터를 삭제하세요
// async function getGroups(): Promise<Group[]> {
//   const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups`)
//   if (!res.ok) throw new Error('모임 목록을 불러오지 못했습니다')
//   const data = await res.json()
//   return data.data
// }

// 임시 가짜 데이터 (백엔드 연결 전까지 사용)
const mockGroups: Group[] = [
  { id: '1', name: '상대대 독서 모임', memberCount: 14 },
  { id: '2', name: '배 사진찍는 모임', memberCount: 14 },
  { id: '3', name: '배 사진찍는 모임', memberCount: 14 },
  { id: '4', name: '배 사진찍는 모임', memberCount: 14 },
  { id: '5', name: '배 사진찍는 모임', memberCount: 14 },
  { id: '6', name: '배 사진찍는 모임', memberCount: 14 },
  { id: '7', name: '배 사진찍는 모임', memberCount: 14 },
]

export default function GroupsPage() {
  const groups = mockGroups

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-4 h-14 border-b border-gray-200">
        <span className="font-semibold text-base">CrewWise</span>
        <div className="flex items-center gap-3">
          <button className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </button>
          <button className="flex flex-col gap-1.5 justify-center">
            <span className="block w-5 h-0.5 bg-gray-600" />
            <span className="block w-5 h-0.5 bg-gray-600" />
            <span className="block w-5 h-0.5 bg-gray-600" />
          </button>
        </div>
      </header>

      {/* 본문 */}
      <main className="flex-1 px-4 py-6">
        <h1 className="text-lg font-bold mb-4">내 모임</h1>

        <div className="max-w-[700px] mx-auto">
          <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,110px)] justify-center">
            {/* 새 모임 만들기 */}
            <button className="aspect-square flex flex-col items-center justify-center gap-1 border-2 border-blue-400 rounded-xl bg-blue-50 text-blue-500">
              <span className="text-3xl font-light leading-none">+</span>
              <span className="text-xs text-center leading-tight">새 모임<br />만들기</span>
            </button>

            {/* 모임 카드 목록 */}
            {groups.map((group) => (
              <div
                key={group.id}
                className="aspect-square flex flex-col rounded-xl overflow-hidden border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex-1 bg-gray-100 flex items-center justify-center text-3xl">
                  🍐
                </div>
                <div className="p-1.5">
                  <p className="text-xs font-medium truncate">{group.name}</p>
                  <p className="text-xs text-gray-400">모임원 {group.memberCount}명</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
