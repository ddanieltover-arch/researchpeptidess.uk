import { User, UserRole } from '../types';

export const DEMO_USERS: Record<UserRole, User> = {
  CUSTOMER: {
    id: 'usr_academic_01',
    email: 'dr.harrison@oxford-bioresearch.ac.uk',
    name: 'Dr. Alistair Harrison',
    role: 'CUSTOMER',
    institution: 'Department of Molecular Pharmacology',
    vatNumber: 'GB 123 4567 89',
    phone: '+44 7700 900123',
    createdAt: '2026-01-15T10:00:00Z',
  },
  ADMIN: {
    id: 'usr_admin_master',
    email: 'lab.director@researchpeptidess.uk',
    name: 'Chief Scientific Officer (Admin)',
    role: 'ADMIN',
    institution: 'Research Peptides UK Laboratory Services',
    phone: '+44 20 7946 0991',
    createdAt: '2025-11-01T08:00:00Z',
  },
  ANALYST: {
    id: 'usr_analyst_01',
    email: 'qc.analyst@researchpeptidess.uk',
    name: 'Quality Assurance Analyst',
    role: 'ANALYST',
    institution: 'Analytical Chemistry Core',
    createdAt: '2026-02-01T09:00:00Z',
  },
};

export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  if (userRole === 'ADMIN') return true;
  if (userRole === 'ANALYST' && requiredRole === 'ANALYST') return true;
  if (userRole === 'CUSTOMER' && requiredRole === 'CUSTOMER') return true;
  return false;
}
