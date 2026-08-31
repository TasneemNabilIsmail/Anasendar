import { Observable } from 'rxjs';
import { EventInput, EventRecord } from '../../shared/models/event.model';

/**
 * Thrown by create()/update() when the candidate time range overlaps an
 * existing event for the same profile. Mirrors the shape a future HTTP
 * repository would build from a backend's 409 response, so callers don't
 * need to change when a real API replaces local storage.
 */
export class ConflictError extends Error {
  constructor(public readonly conflictingEvent: EventRecord) {
    super(
      `Conflicts with "${conflictingEvent.title}" (${conflictingEvent.startAt.toLocaleString()} – ${conflictingEvent.endAt.toLocaleString()})`,
    );
    this.name = 'ConflictError';
  }
}

export interface EventsRepository {
  /** Events for a single profile's own calendar. */
  list(profileId: string): Observable<EventRecord[]>;
  /** Every event across every profile — powers the family dashboard. */
  listAll(): Observable<EventRecord[]>;
  create(profileId: string, input: EventInput): Observable<EventRecord>;
  update(id: string, input: EventInput): Observable<EventRecord>;
  remove(id: string): Observable<void>;
  markReminderSent(id: string, sentAt: Date): Observable<void>;
}
