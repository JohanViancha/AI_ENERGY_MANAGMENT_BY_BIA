import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { User } from 'firebase/auth'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '@/context/auth-provider'
import { useAuth } from '@/hooks/use-auth'
import { queryClient } from '@/lib/query-client'

type AuthListener = (user: User | null) => void

const firebaseMocks = vi.hoisted(() => ({
  onAuthStateChanged: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
}))

vi.mock('firebase/auth', () => firebaseMocks)
vi.mock('@/lib/firebase', () => ({ auth: { name: 'auth-mock' } }))

let emitAuthState: AuthListener
const unsubscribe = vi.fn()

function Consumer() {
  const { user, isLoading, login, logout } = useAuth()
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="email">{user?.email ?? 'sin-usuario'}</span>
      <button onClick={() => login('a@b.com', 'secreto1')}>login</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  )
}

function renderProvider() {
  return render(
    <AuthProvider>
      <Consumer />
    </AuthProvider>,
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    firebaseMocks.onAuthStateChanged.mockImplementation((_auth, listener: AuthListener) => {
      emitAuthState = listener
      return unsubscribe
    })
  })

  it('keeps isLoading true until onAuthStateChanged fires', () => {
    renderProvider()

    expect(screen.getByTestId('loading')).toHaveTextContent('true')

    act(() => emitAuthState(null))

    expect(screen.getByTestId('loading')).toHaveTextContent('false')
  })

  it('exposes the user delivered by onAuthStateChanged', () => {
    renderProvider()

    act(() => emitAuthState({ email: 'a@b.com' } as User))

    expect(screen.getByTestId('email')).toHaveTextContent('a@b.com')
  })

  it('clears the query cache when the user becomes null', () => {
    const clearSpy = vi.spyOn(queryClient, 'clear')
    renderProvider()

    act(() => emitAuthState({ email: 'a@b.com' } as User))
    expect(clearSpy).not.toHaveBeenCalled()

    act(() => emitAuthState(null))
    expect(clearSpy).toHaveBeenCalledTimes(1)
  })

  it('calls signInWithEmailAndPassword on login', async () => {
    firebaseMocks.signInWithEmailAndPassword.mockResolvedValue(undefined)
    renderProvider()

    await userEvent.click(screen.getByText('login'))

    expect(firebaseMocks.signInWithEmailAndPassword).toHaveBeenCalledWith(
      { name: 'auth-mock' },
      'a@b.com',
      'secreto1',
    )
  })

  it('calls signOut on logout', async () => {
    firebaseMocks.signOut.mockResolvedValue(undefined)
    renderProvider()

    await userEvent.click(screen.getByText('logout'))

    expect(firebaseMocks.signOut).toHaveBeenCalledWith({ name: 'auth-mock' })
  })

  it('unsubscribes from onAuthStateChanged on unmount', () => {
    const { unmount } = renderProvider()

    unmount()

    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })
})
