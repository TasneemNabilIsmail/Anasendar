import { EventRecord } from '../../shared/models/event.model';

export interface OverlapPair {
  a: EventRecord;
  b: EventRecord;
}

/**
 * Pairs of events belonging to *different* profiles whose time ranges
 * overlap. This is purely informational for the family dashboard — unlike
 * hasConflict(), it is never used to block saving an event.
 */
export function findCrossProfileOverlaps(events: readonly EventRecord[]): OverlapPair[] {
  const pairs: OverlapPair[] = [];
  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const a = events[i];
      const b = events[j];
      if (a.profileId === b.profileId) continue;
      if (a.startAt < b.endAt && a.endAt > b.startAt) {
        pairs.push({ a, b });
      }
    }
  }
  return pairs.sort((p1, p2) => p1.a.startAt.getTime() - p2.a.startAt.getTime());
}
