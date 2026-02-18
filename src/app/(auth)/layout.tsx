import React from 'react'
import styles from './auth.module.css'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className={styles.container}>
            <div className={styles.leftPanel}>
                <div className={styles.brandContent}>
                    <h1 className={styles.brandTitle}>Greivanced</h1>
                    <p className={styles.brandTagline}>
                        Your voice matters. Report civic issues, track progress, and help build a better community.
                    </p>
                    <div className={styles.features}>
                        <div className={styles.feature}>
                            <span className={styles.featureIcon}>📋</span>
                            <span>File complaints & track in real-time</span>
                        </div>
                        <div className={styles.feature}>
                            <span className={styles.featureIcon}>🏛️</span>
                            <span>Ward-based officer management</span>
                        </div>
                        <div className={styles.feature}>
                            <span className={styles.featureIcon}>📊</span>
                            <span>Transparent resolution tracking</span>
                        </div>
                    </div>
                </div>
            </div>
            <div className={styles.rightPanel}>
                <div className={styles.card}>
                    {children}
                </div>
            </div>
        </div>
    )
}
