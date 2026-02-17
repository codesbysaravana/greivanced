import React from 'react'
import Link from 'next/link'
import styles from './DashboardLayout.module.css'
import { Role } from '@prisma/client'
import { logout } from '@/actions/auth'

interface DashboardLayoutProps {
    children: React.ReactNode
    role: Role
    userName: string
}

const SIDEBAR_LINKS = {
    [Role.ADMIN]: [
        { label: 'Overview', href: '/admin/dashboard' },
        { label: 'Complaints', href: '/admin/complaints' },
        { label: 'Officers', href: '/admin/officers' },
        { label: 'Wards', href: '/admin/wards' },
    ],
    [Role.OFFICER]: [
        { label: 'My Ward', href: '/officer/dashboard' },
        // { label: 'Pending', href: '/officer/pending' }, // Assuming these pages exist or will exist
        // { label: 'Resolved', href: '/officer/resolved' },
    ],
    [Role.CITIZEN]: [
        { label: 'My Complaints', href: '/citizen/dashboard' },
        { label: 'New Complaint', href: '/citizen/new-complaint' },
    ],
}

export default function DashboardLayout({ children, role, userName }: DashboardLayoutProps) {
    return (
        <div className={styles.container}>
            <aside className={styles.sidebar}>
                <div className={styles.brand}>
                    <h2>CivicResolve</h2>
                    <span className={styles.roleBadge}>{role}</span>
                </div>

                <nav className={styles.nav}>
                    {SIDEBAR_LINKS[role]?.map((link) => (
                        <Link key={link.href} href={link.href} className={styles.navLink}>
                            {link.label}
                        </Link>
                    ))}
                </nav>

                <div className={styles.userProfile}>
                    <p>Welcome, {userName}</p>
                    <form action={logout}>
                        <button type="submit" className={styles.logoutBtn}>Logout</button>
                    </form>
                </div>
            </aside>

            <main className={styles.main}>
                {children}
            </main>
        </div>
    )
}
