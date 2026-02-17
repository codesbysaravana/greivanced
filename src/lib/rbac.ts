import { Role } from '@prisma/client'

export { Role as UserRole }

export const ROLE_PERMISSIONS = {
    [Role.ADMIN]: ['manage_users', 'view_all_complaints', 'manage_wards', 'view_escalations'],
    [Role.OFFICER]: ['view_ward_complaints', 'update_complaint_status'],
    [Role.CITIZEN]: ['create_complaint', 'view_my_complaints'],
}

export function hasPermission(role: Role, permission: string): boolean {
    return (ROLE_PERMISSIONS[role] as string[])?.includes(permission) || false
}
