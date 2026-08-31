import { describe, expect, it } from 'vitest';
import { hasConflict } from './has-conflict';
import { EventRecord } from '../../shared/models/event.model';

function makeEvent(overrides: Partial<EventRecord>): EventRecord {
  return {
    id: 'e1',
    profileId: 'mom',
    title: 'Existing event',
    startAt: new Date('2026-01-01T10:00:00Z'),
    endAt: new Date('2026-01-01T11:00:00Z'),
    ...overrides,
  };
}

describe('hasConflict', () => {
  it('detects a candidate fully inside an existing event', () => {
    const existing = [makeEvent({})];
    const conflict = hasConflict(existing, {
      profileId: 'mom',
      startAt: new Date('2026-01-01T10:15:00Z'),
      endAt: new Date('2026-01-01T10:45:00Z'),
    });
    expect(conflict?.id).toBe('e1');
  });

  it('detects a candidate that partially overlaps the start', () => {
    const existing = [makeEvent({})];
    const conflict = hasConflict(existing, {
      profileId: 'mom',
      startAt: new Date('2026-01-01T09:30:00Z'),
      endAt: new Date('2026-01-01T10:30:00Z'),
    });
    expect(conflict?.id).toBe('e1');
  });

  it('detects a candidate that partially overlaps the end', () => {
    const existing = [makeEvent({})];
    const conflict = hasConflict(existing, {
      profileId: 'mom',
      startAt: new Date('2026-01-01T10:30:00Z'),
      endAt: new Date('2026-01-01T11:30:00Z'),
    });
    expect(conflict?.id).toBe('e1');
  });

  it('allows a back-to-back candidate that starts exactly when the existing event ends', () => {
    const existing = [makeEvent({})];
    const conflict = hasConflict(existing, {
      profileId: 'mom',
      startAt: new Date('2026-01-01T11:00:00Z'),
      endAt: new Date('2026-01-01T12:00:00Z'),
    });
    expect(conflict).toBeUndefined();
  });

  it('allows a back-to-back candidate that ends exactly when the existing event starts', () => {
    const existing = [makeEvent({})];
    const conflict = hasConflict(existing, {
      profileId: 'mom',
      startAt: new Date('2026-01-01T09:00:00Z'),
      endAt: new Date('2026-01-01T10:00:00Z'),
    });
    expect(conflict).toBeUndefined();
  });

  it('allows the same time range on a different profile', () => {
    const existing = [makeEvent({})];
    const conflict = hasConflict(existing, {
      profileId: 'kid-1',
      startAt: new Date('2026-01-01T10:00:00Z'),
      endAt: new Date('2026-01-01T11:00:00Z'),
    });
    expect(conflict).toBeUndefined();
  });

  it('excludes the event being updated from the conflict check', () => {
    const existing = [makeEvent({ id: 'e1' })];
    const conflict = hasConflict(
      existing,
      {
        profileId: 'mom',
        startAt: new Date('2026-01-01T10:00:00Z'),
        endAt: new Date('2026-01-01T11:00:00Z'),
      },
      'e1',
    );
    expect(conflict).toBeUndefined();
  });

  it('returns undefined when there is no overlap at all', () => {
    const existing = [makeEvent({})];
    const conflict = hasConflict(existing, {
      profileId: 'mom',
      startAt: new Date('2026-01-01T13:00:00Z'),
      endAt: new Date('2026-01-01T14:00:00Z'),
    });
    expect(conflict).toBeUndefined();
  });
});
