import { SetMetadata } from '@nestjs/common';

export const AUDIT_METADATA_KEY = 'audit_metadata';

export interface AuditMetadata {
  action: string;
  targetType: string;
}

export const Audit = (action: string, targetType: string) =>
  SetMetadata(AUDIT_METADATA_KEY, { action, targetType });
