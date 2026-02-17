import { getAllWards } from '@/actions/admin'
import styles from './wards.module.css'

export default async function WardsPage() {
    const wards = await getAllWards()

    return (
        <div className={styles.container}>
            <h1>Wards Overview</h1>

            <div className={styles.grid}>
                {wards.map(ward => (
                    <div key={ward.id} className={styles.card}>
                        <h2>{ward.name}</h2>
                        <div className={styles.meta}>
                            <p>Officers: {ward._count.officers}</p>
                            <p>Complaints: {ward._count.complaints}</p>
                        </div>
                        <div className={styles.district}>District: {ward.district.name}</div>
                    </div>
                ))}
            </div>
        </div>
    )
}
