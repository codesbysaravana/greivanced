import Link from 'next/link'
import styles from './landing.module.css'

export default function LandingPage() {
  return (
    <div className={styles.container}>
      <main className={styles.hero}>
        <h1 className={styles.title}>CivicResolve</h1>
        <p className={styles.subtitle}>
          Empowering citizens and officers to build a better community.
          Report issues, track progress, and resolve grievances efficiently.
        </p>

        <div className={styles.actions}>
          <Link href="/login" className={styles.btn}>
            Login to Dashboard
          </Link>
          <Link href="/register" className={styles.btnOutline}>
            Citizen Registration
          </Link>
        </div>
      </main>

      <footer className={styles.footer}>
        &copy; {new Date().getFullYear()} CivicResolve. Government of India.
      </footer>
    </div>
  )
}
