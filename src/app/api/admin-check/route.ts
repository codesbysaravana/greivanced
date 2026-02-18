import { NextResponse } from 'next/server';
import {
    getDashboardStats,
    getAllComplaints,
    getAllOfficers,
    getAllWards,
    getUrgentComplaints
} from '@/actions/admin';

export const dynamic = 'force-dynamic'; // prevent caching

export async function GET() {
    try {
        console.log('[AdminCheck] Starting admin routes integrity check...');

        const [stats, complaints, officers, wards, urgent] = await Promise.all([
            getDashboardStats(),
            getAllComplaints(),
            getAllOfficers(),
            getAllWards(),
            getUrgentComplaints()
        ]);

        const isAuthFailed = !stats && (!complaints || complaints.length === 0) && !urgent;

        return NextResponse.json({
            success: true,
            message: 'Admin routes checked.',
            auth_status: isAuthFailed ? 'LIKELY UNAUTHORIZED (Ensure you are logged in as ADMIN)' : 'AUTHORIZED',
            timestamp: new Date().toISOString(),
            results: {
                dashboardStats: stats,
                complaints: {
                    count: Array.isArray(complaints) ? complaints.length : 0,
                    sample: Array.isArray(complaints) ? complaints.slice(0, 2) : complaints
                },
                officers: {
                    count: Array.isArray(officers) ? officers.length : 0,
                    sample: Array.isArray(officers) ? officers.slice(0, 2) : officers
                },
                wards: {
                    count: Array.isArray(wards) ? wards.length : 0,
                    sample: Array.isArray(wards) ? wards.slice(0, 2) : wards
                },
                urgentIssues: urgent
            }
        });
    } catch (error: any) {
        console.error('[AdminCheck] Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
