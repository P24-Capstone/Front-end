export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="flex items-center justify-center h-14 border-b border-gray-200">
        <span className="font-semibold text-base">CrewWise</span>
      </header>
      <main className="flex-1 flex flex-col items-center">
        <div className="w-full max-w-[390px] flex-1 flex flex-col">
          {children}
        </div>
      </main>
      <footer className="flex items-center justify-center gap-3 py-4 border-t border-gray-200">
        <span className="text-xs font-semibold text-gray-500">CrewWise</span>
        <span className="text-xs text-gray-400">Copyright © 2026 CrewWise Corp. All Rights Reserved.</span>
      </footer>
    </div>
  )
}
