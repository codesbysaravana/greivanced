'use client'

import { runEscalationCheck } from '@/actions/admin'
import { useActionState } from 'react'

type State = {
    success?: boolean
    count?: number
    error?: string
}

const initialState: State = {
    success: false,
    count: 0,
    error: ''
}

export default function EscalationControls() {
    // We need a wrapper to match the signature if needed, or just use the action directly if types align.
    // The action returns { success: boolean, count?: number, error?: string }
    // useActionState expects (state, payload) => state

    // transform action to match state signature
    const actionWrapper = async (): Promise<State> => {
        // We don't need formData for this action, but `useActionState`
        // provides it by default, so we simply ignore it.
        const result = await runEscalationCheck()
        return {
            success: result.success,
            count: result.count,
            error: result.error
        }
    }

    const [state, formAction, isPending] = useActionState(actionWrapper, initialState)

    return (
        <form action={formAction} style={{ display: 'inline' }}>
            <button
                type="submit"
                disabled={isPending}
                style={{
                    background: 'transparent',
                    border: '1px solid var(--danger-color)',
                    color: 'var(--danger-color)',
                    padding: '0.25rem 0.5rem',
                    borderRadius: 'var(--radius)',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    opacity: isPending ? 0.5 : 1
                }}
            >
                {isPending ? 'Running...' : 'Run Escalation Check'}
            </button>
            {state?.success && (
                <span style={{ marginLeft: '1rem', fontSize: '0.75rem', color: 'green' }}>
                    Ran successfully. Escalated: {state.count ?? 0}
                </span>
            )}
            {state?.error && (
                <span style={{ marginLeft: '1rem', fontSize: '0.75rem', color: 'red' }}>
                    Error: {state.error}
                </span>
            )}
        </form>
    )
}
