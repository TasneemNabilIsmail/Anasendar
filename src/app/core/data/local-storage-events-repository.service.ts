import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, of, throwError } from 'rxjs';
import { EventInput, EventRecord } from '../../shared/models/event.model';
import { hasConflict } from '../conflict/has-conflict';
import { ConflictError, EventsRepository } from './events-repository.model';

const STORAGE_KEY = 'calendar.events';

interface StoredEvent extends Omit<EventRecord, 'startAt' | 'endAt' | 'reminderSentAt'> {
  startAt: string;
  endAt: string;
  reminderSentAt?: string;
}

@Injectable({ providedIn: 'root' })
export class LocalStorageEventsRepository implements EventsRepository {
  private readonly events$ = new BehaviorSubject<EventRecord[]>(this.readFromStorage());

  list(profileId: string): Observable<EventRecord[]> {
    return this.events$.pipe(map((events) => events.filter((event) => event.profileId === profileId)));
  }

  listAll(): Observable<EventRecord[]> {
    return this.events$.asObservable();
  }

  create(profileId: string, input: EventInput): Observable<EventRecord> {
    if (input.endAt <= input.startAt) {
      return throwError(() => new Error('End time must be after start time.'));
    }

    const conflict = hasConflict(this.events$.value, {
      profileId,
      startAt: input.startAt,
      endAt: input.endAt,
    });
    if (conflict) {
      return throwError(() => new ConflictError(conflict));
    }

    const record: EventRecord = { id: crypto.randomUUID(), profileId, ...input };
    this.persist([...this.events$.value, record]);
    return of(record);
  }

  update(id: string, input: EventInput): Observable<EventRecord> {
    const existing = this.events$.value.find((event) => event.id === id);
    if (!existing) {
      return throwError(() => new Error('Event not found.'));
    }
    if (input.endAt <= input.startAt) {
      return throwError(() => new Error('End time must be after start time.'));
    }

    const conflict = hasConflict(
      this.events$.value,
      { profileId: existing.profileId, startAt: input.startAt, endAt: input.endAt },
      id,
    );
    if (conflict) {
      return throwError(() => new ConflictError(conflict));
    }

    const updated: EventRecord = { ...existing, ...input };
    this.persist(this.events$.value.map((event) => (event.id === id ? updated : event)));
    return of(updated);
  }

  remove(id: string): Observable<void> {
    this.persist(this.events$.value.filter((event) => event.id !== id));
    return of(undefined);
  }

  markReminderSent(id: string, sentAt: Date): Observable<void> {
    this.persist(this.events$.value.map((event) => (event.id === id ? { ...event, reminderSentAt: sentAt } : event)));
    return of(undefined);
  }

  private persist(events: EventRecord[]): void {
    this.events$.next(events);
    const stored: StoredEvent[] = events.map((event) => ({
      ...event,
      startAt: event.startAt.toISOString(),
      endAt: event.endAt.toISOString(),
      reminderSentAt: event.reminderSentAt?.toISOString(),
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  }

  private readFromStorage(): EventRecord[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      const stored: StoredEvent[] = JSON.parse(raw);
      return stored.map((event) => ({
        ...event,
        startAt: new Date(event.startAt),
        endAt: new Date(event.endAt),
        reminderSentAt: event.reminderSentAt ? new Date(event.reminderSentAt) : undefined,
      }));
    } catch {
      return [];
    }
  }
}
