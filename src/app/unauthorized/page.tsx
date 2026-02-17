import Link from 'next/link'

export default function UnauthorizedPage() {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            gap: '1rem'
        }}>
            <h1 style={{ color: '#dc2626' }}>Access Denied</h1>
            <p>You do not have permission to view this page.</p>
            <Link href="/" style={{
                color: '#2563eb',
                textDecoration: 'underline'
            }}>
                Return Home
            </Link>
        </div>
    )
}
