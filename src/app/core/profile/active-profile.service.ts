import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, map } from 'rxjs';
import { Profile } from '../../shared/models/profile.model';
import { PROFILES_REPOSITORY } from '../data/profiles-repository.token';
import { ProfilesRepository } from '../data/profiles-repository.model';

const ACTIVE_PROFILE_KEY = 'calendar.activeProfileId';

@Injectable({ providedIn: 'root' })
export class ActiveProfileService {
  private readonly activeProfileId$ = new BehaviorSubject<string | null>(
    localStorage.getItem(ACTIVE_PROFILE_KEY),
  );

  readonly activeProfile$: Observable<Profile | undefined>;

  constructor(@Inject(PROFILES_REPOSITORY) private readonly profilesRepo: ProfilesRepository) {
    this.activeProfile$ = combineLatest([this.profilesRepo.list(), this.activeProfileId$]).pipe(
      map(([profiles, activeId]) => {
        const found = profiles.find((profile) => profile.id === activeId);
        if (found) return found;

        // Stored id is stale (deleted profile) or nothing selected yet — fall back
        // to the default profile, or the first one, and remember that choice.
        const fallback = profiles.find((profile) => profile.isDefault) ?? profiles[0];
        if (fallback && fallback.id !== activeId) {
          queueMicrotask(() => this.setActiveProfile(fallback.id));
        }
        return fallback;
      }),
    );
  }

  setActiveProfile(id: string): void {
    localStorage.setItem(ACTIVE_PROFILE_KEY, id);
    this.activeProfileId$.next(id);
  }
}
