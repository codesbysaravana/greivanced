'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './DashboardLayout.module.css'
import { logout } from '@/actions/auth'
import {
    LayoutDashboard,
    ClipboardList,
    Users,
    Map,
    MessageSquare,
    PlusCircle,
    Search,
    LogOut,
    User as UserIcon,
    Shield,
    Briefcase,
    UserCircle
} from 'lucide-react'

// Define the Role type locally to avoid importing from @prisma/client in a client component
type RoleType = 'ADMIN' | 'OFFICER' | 'CITIZEN'

interface DashboardLayoutProps {
    children: React.ReactNode
    role: string // Accept as string
    userName: string
}

const SIDEBAR_LINKS: Record<string, any[]> = {
    ADMIN: [
        { label: 'Overview', href: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'Complaints', href: '/admin/complaints', icon: ClipboardList },
        { label: 'Officers', href: '/admin/officers', icon: Users },
        { label: 'Wards', href: '/admin/wards', icon: Map },
    ],
    OFFICER: [
        { label: 'My Ward', href: '/officer/dashboard', icon: LayoutDashboard },
    ],
    CITIZEN: [
        { label: 'My Complaints', href: '/citizen/dashboard', icon: ClipboardList },
        { label: 'Track Status', href: '/citizen/track', icon: Search },
        { label: 'New Complaint', href: '/citizen/new-complaint', icon: PlusCircle },
    ],
}


export default function DashboardLayout({ children, role, userName }: DashboardLayoutProps) {
    const pathname = usePathname()
    console.log(`[DashboardLayout] Rendering for role: ${role}, user: ${userName}, path: ${pathname}`)

    const getRoleIcon = () => {
        switch (role) {
            case 'ADMIN': return <Shield size={16} />
            case 'OFFICER': return <Briefcase size={16} />
            case 'CITIZEN': return <UserCircle size={16} />
            default: return null
        }
    }

    return (
        <div className={styles.container}>
            <aside className={styles.sidebar}>
                <div className={styles.brand}>
                    <div className={styles.logoBox}>CR</div>
                    <div className={styles.brandText}>
                        <h2>CivicResolve</h2>
                        <span className={`${styles.roleBadge} ${styles[`role_${role}`]}`}>
                            {getRoleIcon()}
                            {role}
                        </span>
                    </div>
                </div>

                <nav className={styles.nav}>
                    {SIDEBAR_LINKS[role]?.map((link) => {
                        const Icon = link.icon
                        const isActive = pathname === link.href
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
                            >
                                <Icon size={20} />
                                <span>{link.label}</span>
                            </Link>
                        )
                    })}
                </nav>

                <div className={styles.userProfile}>
                    <div className={styles.userInfo}>
                        <div className={styles.userAvatar}>
                            <UserIcon size={18} />
                        </div>
                        <div className={styles.userDetails}>
                            <span className={styles.userName}>{userName?.split('@')[0] || 'User'}</span>
                            <span className={styles.userEmail}>{userName || ''}</span>
                        </div>
                    </div>
                    <form action={logout}>
                        <button type="submit" className={styles.logoutBtn}>
                            <LogOut size={16} />
                            <span>Logout</span>
                        </button>
                    </form>
                </div>
            </aside>

            <main className={styles.main}>
                <div className={styles.content}>
                    {children}
                </div>
            </main>
        </div>
    )
}
