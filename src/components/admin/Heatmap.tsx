'use client'

import React from 'react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
    Treemap
} from 'recharts'
import styles from './Heatmap.module.css'

interface WardStatus {
    id: string
    name: string
    district: string
    total: number
    [key: string]: string | number
}

interface HeatmapProps {
    data: WardStatus[]
    history?: { date: string; count: number }[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload
        return (
            <div className={styles.tooltip}>
                <p className={styles.tooltipLabel}>{data.name}</p>
                <p className={styles.tooltipDistrict}>{data.district}</p>
                <p className={styles.tooltipValue}>
                    Complaints: <span className={styles.value}>{data.total}</span>
                </p>
                <p className={styles.tooltipStatus}>
                    {data.total === 0 ? 'Silent Zone (Excellent)' :
                        data.total < 5 ? 'Quiet Zone' :
                            data.total > 20 ? 'High Intensity' : 'Moderate Activity'}
                </p>
            </div>
        )
    }
    return null
}

export default function Heatmap({ data, history }: HeatmapProps) {
    // Sort data: Silent (low) to Loud (high)
    const sortedData = [...data].sort((a, b) => a.total - b.total)
    const maxTotal = Math.max(...data.map(d => d.total), 1)

    const getColor = (value: number) => {
        const ratio = value / maxTotal
        // Green (120) to Red (0)
        const hue = Math.max(0, 120 - (ratio * 120))
        return `hsl(${hue}, 70%, 45%)`
    }

    // TreeMap data requires a specific structure, but BarChart is clearer for "Silent Zones" ranking

    return (
        <div className={styles.chartContainer}>
            <div className={styles.chartHeader}>
                <h2>Complaint Intensity by Ward (Silent to Loud)</h2>
                <div className={styles.legendWrapper}>
                    <span className={styles.legendItem}><span className={styles.dot} style={{ background: 'hsl(120, 70%, 45%)' }}></span> Silent</span>
                    <span className={styles.legendItem}><span className={styles.dot} style={{ background: 'hsl(0, 70%, 45%)' }}></span> Intense</span>
                </div>
            </div>

            <div style={{ width: '100%', height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={sortedData}
                        margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 100,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                        <XAxis
                            dataKey="name"
                            angle={-45}
                            textAnchor="end"
                            interval={0}
                            height={80}
                            tick={{ fontSize: 10 }}
                        />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                        <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                            {sortedData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={getColor(entry.total)} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <h3>Silent Zones</h3>
                    <p className={styles.statValue}>{data.filter(d => d.total === 0).length}</p>
                    <p className={styles.statSub}>Wards with 0 complaints</p>
                </div>
                <div className={styles.statCard}>
                    <h3>Total Complaints</h3>
                    <p className={styles.statValue}>{data.reduce((sum, d) => sum + d.total, 0)}</p>
                </div>
                <div className={styles.statCard}>
                    <h3>Avg per Ward</h3>
                    <p className={styles.statValue}>{(data.reduce((sum, d) => sum + d.total, 0) / (data.length || 1)).toFixed(1)}</p>
                </div>
            </div>

            {history && (
                <div className={styles.calendarWrapper}>
                    <h3>Activity Log (Last 365 Days)</h3>
                    <div className={styles.calendarGrid}>
                        {history.map((day) => {
                            // Level 0-4
                            let level = 0
                            if (day.count > 0) level = 1
                            if (day.count > 5) level = 2
                            if (day.count > 10) level = 3
                            if (day.count > 20) level = 4

                            return (
                                <div
                                    key={day.date}
                                    className={`${styles.dayCell} ${styles[`level${level}`]}`}
                                    title={`${day.date}: ${day.count} complaints`}
                                ></div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
