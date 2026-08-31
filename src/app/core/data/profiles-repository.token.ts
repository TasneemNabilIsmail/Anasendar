import { InjectionToken } from '@angular/core';
import { ProfilesRepository } from './profiles-repository.model';

export const PROFILES_REPOSITORY = new InjectionToken<ProfilesRepository>('PROFILES_REPOSITORY');
