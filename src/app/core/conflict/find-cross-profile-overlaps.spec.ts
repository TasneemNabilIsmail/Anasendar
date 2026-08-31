import { describe, expect, it } from 'vitest';
import { findCrossProfileOverlaps } from './find-cross-profile-overlaps';
import { EventRecord } from '../../shared/models/event.model';

function makeEvent(overrides: Partial<EventRecord>): EventRecord {
  return {
    id: 'e',
    profileId: 'mom',
    title: 'Event',
    startAt: new Date('2026-01-01T10:00:00Z'),
    endAt: new Date('2026-01-01T11:00:00Z'),
    ...overrides,
  };
}

describe('findCrossProfileOverlaps', () => {
  it('flags overlapping events across two different profiles', () => {
    const events = [
      makeEvent({ id: 'a', profileId: 'mom', startAt: new Date('2026-01-01T15:00:00Z'), endAt: new Date('2026-01-01T16:00:00Z') }),
      makeEvent({ id: 'b', profileId: 'kid-1', startAt: new Date('2026-01-01T15:30:00Z'), endAt: new Date('2026-01-01T16:30:00Z') }),
    ];
    const overlaps = findCrossProfileOverlaps(events);
    expect(overlaps).toHaveLength(1);
    expect([overlaps[0].a.id, overlaps[0].b.id].sort()).toEqual(['a', 'b']);
  });

  it('does not flag overlapping events within the same profile', () => {
    const events = [
      makeEvent({ id: 'a', profileId: 'mom', startAt: new Date('2026-01-01T15:00:00Z'), endAt: new Date('2026-01-01T16:00:00Z') }),
      makeEvent({ id: 'b', profileId: 'mom', startAt: new Date('2026-01-01T15:30:00Z'), endAt: new Date('2026-01-01T16:30:00Z') }),
    ];
    expect(findCrossProfileOverlaps(events)).toHaveLength(0);
  });

  it('does not flag events on different profiles that do not overlap in time', () => {
    const events = [
      makeEvent({ id: 'a', profileId: 'mom', startAt: new Date('2026-01-01T09:00:00Z'), endAt: new Date('2026-01-01T10:00:00Z') }),
      makeEvent({ id: 'b', profileId: 'kid-1', startAt: new Date('2026-01-01T15:00:00Z'), endAt: new Date('2026-01-01T16:00:00Z') }),
    ];
    expect(findCrossProfileOverlaps(events)).toHaveLength(0);
  });
});
