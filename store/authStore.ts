import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name: string
}

interface AuthState {
  user: User | null
  isLoggedIn: boolean
  token: string | null
  login: (user: User, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoggedIn: false,
      token: null,
      login: (user, token) => set({ user, isLoggedIn: true, token }),
      logout: () => set({ user: null, isLoggedIn: false, token: null }),
    }),
    { name: 'auth-storage' }
  )
)
