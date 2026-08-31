import { InjectionToken } from '@angular/core';
import { EventsRepository } from './events-repository.model';

/**
 * DI seam between features and persistence. Swap the provider for an
 * HttpEventsRepository once a backend exists — nothing that injects this
 * token needs to change.
 */
export const EVENTS_REPOSITORY = new InjectionToken<EventsRepository>('EVENTS_REPOSITORY');
