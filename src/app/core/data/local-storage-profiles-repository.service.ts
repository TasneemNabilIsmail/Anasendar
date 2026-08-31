import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { Profile, ProfileInput } from '../../shared/models/profile.model';
import { ProfilesRepository } from './profiles-repository.model';

const STORAGE_KEY = 'calendar.profiles';
const DEFAULT_PROFILE_NAME = 'Me';
const DEFAULT_PROFILE_COLOR = '#3B82F6';

@Injectable({ providedIn: 'root' })
export class LocalStorageProfilesRepository implements ProfilesRepository {
  private readonly profiles$ = new BehaviorSubject<Profile[]>(this.readFromStorage());

  list(): Observable<Profile[]> {
    return this.profiles$.asObservable();
  }

  create(input: ProfileInput): Observable<Profile> {
    const profile: Profile = { id: crypto.randomUUID(), isDefault: false, ...input };
    this.persist([...this.profiles$.value, profile]);
    return of(profile);
  }

  update(id: string, input: ProfileInput): Observable<Profile> {
    const existing = this.profiles$.value.find((profile) => profile.id === id);
    if (!existing) {
      return throwError(() => new Error('Profile not found.'));
    }
    const updated: Profile = { ...existing, ...input };
    this.persist(this.profiles$.value.map((profile) => (profile.id === id ? updated : profile)));
    return of(updated);
  }

  remove(id: string): Observable<void> {
    const remaining = this.profiles$.value.filter((profile) => profile.id !== id);
    // Never let the family end up with zero profiles — reseed the default if the last one is removed.
    this.persist(remaining.length > 0 ? remaining : [this.buildDefaultProfile()]);
    return of(undefined);
  }

  private persist(profiles: Profile[]): void {
    this.profiles$.next(profiles);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  }

  private readFromStorage(): Profile[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed: Profile[] = JSON.parse(raw);
        if (parsed.length > 0) return parsed;
      } catch {
        // fall through to reseed
      }
    }
    const seeded = [this.buildDefaultProfile()];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }

  private buildDefaultProfile(): Profile {
    return {
      id: crypto.randomUUID(),
      displayName: DEFAULT_PROFILE_NAME,
      colorHex: DEFAULT_PROFILE_COLOR,
      isDefault: true,
    };
  }
}
