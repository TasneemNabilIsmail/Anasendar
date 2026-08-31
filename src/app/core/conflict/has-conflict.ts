import { EventRecord } from '../../shared/models/event.model';

export interface ConflictCandidate {
  profileId: string;
  startAt: Date;
  endAt: Date;
}

/**
 * Finds an existing event that time-overlaps the candidate, scoped to the
 * same profile only — different profiles are never in conflict with each
 * other. Back-to-back events (existing.endAt === candidate.startAt, or vice
 * versa) are not considered a conflict.
 */
export function hasConflict(
  existingEvents: readonly EventRecord[],
  candidate: ConflictCandidate,
  excludeEventId?: string,
): EventRecord | undefined {
  return existingEvents.find(
    (existing) =>
      existing.profileId === candidate.profileId &&
      existing.id !== excludeEventId &&
      existing.startAt < candidate.endAt &&
      existing.endAt > candidate.startAt,
  );
}
