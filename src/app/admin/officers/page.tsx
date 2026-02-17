import Link from 'next/link'
import { getAllOfficers, deleteOfficer } from '@/actions/admin'
import styles from './officers.module.css'

export default async function OfficersPage() {
    const officers = await getAllOfficers()

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Ward Officers</h1>
                <Link href="/admin/officers/new" className={styles.addBtn}>
                    + Add New Officer
                </Link>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Assigned Ward</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {officers.map(officer => (
                            <tr key={officer.id}>
                                <td>{officer.citizenProfile?.fullName || officer.email?.split('@')[0]}</td>
                                <td>{officer.email}</td>
                                <td>{officer.officerProfile?.ward?.name || 'Unassigned'}</td>
                                <td>
                                    <span className={officer.isActive ? styles.active : styles.inactive}>
                                        {officer.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td>
                                    {/* We can use a form for delete action */}
                                    <form action={async () => {
                                        'use server'
                                        await deleteOfficer(officer.id)
                                    }}>
                                        <button type="submit" className={styles.deleteBtn}>Delete</button>
                                    </form>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
