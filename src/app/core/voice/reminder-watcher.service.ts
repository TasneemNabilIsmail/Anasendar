import { Inject, Injectable } from '@angular/core';
import { subMinutes } from 'date-fns';
import { combineLatest, take } from 'rxjs';
import { EventRecord } from '../../shared/models/event.model';
import { Profile } from '../../shared/models/profile.model';
import { EVENTS_REPOSITORY } from '../data/events-repository.token';
import { EventsRepository } from '../data/events-repository.model';
import { PROFILES_REPOSITORY } from '../data/profiles-repository.token';
import { ProfilesRepository } from '../data/profiles-repository.model';
import { TtsService } from './tts.service';

const CHECK_INTERVAL_MS = 20_000;

/**
 * Polls for due reminders while the app is open and speaks them aloud.
 * There is no backend/push yet, so this only works in-tab — a reminder for
 * an event that starts while the tab is closed simply won't fire until the
 * app is reopened. Server-driven push (so reminders fire even when closed)
 * is deferred to the backend phase.
 */
@Injectable({ providedIn: 'root' })
export class ReminderWatcherService {
  private timer?: ReturnType<typeof setInterval>;

  constructor(
    @Inject(EVENTS_REPOSITORY) private readonly eventsRepo: EventsRepository,
    @Inject(PROFILES_REPOSITORY) private readonly profilesRepo: ProfilesRepository,
    private readonly tts: TtsService,
  ) {}

  start(): void {
    if (this.timer) return;
    this.requestNotificationPermission();
    this.checkDueReminders();
    this.timer = setInterval(() => this.checkDueReminders(), CHECK_INTERVAL_MS);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }

  private checkDueReminders(): void {
    combineLatest([this.eventsRepo.listAll(), this.profilesRepo.list()])
      .pipe(take(1))
      .subscribe(([events, profiles]) => this.announceDue(events, profiles));
  }

  private announceDue(events: EventRecord[], profiles: Profile[]): void {
    const now = new Date();
    for (const event of events) {
      if (!event.reminderMinutesBefore || event.reminderSentAt) continue;

      const fireAt = subMinutes(event.startAt, event.reminderMinutesBefore);
      // Not due yet, or the event already started (reload after the fact) — skip.
      if (now < fireAt || now > event.startAt) continue;

      this.announce(event, profiles);
      this.eventsRepo.markReminderSent(event.id, now).subscribe();
    }
  }

  private announce(event: EventRecord, profiles: Profile[]): void {
    const profile = profiles.find((p) => p.id === event.profileId);
    const who = profile ? `${profile.displayName}: ` : '';
    const message = `Reminder. ${who}${event.title} starts in ${event.reminderMinutesBefore} minutes.`;
    this.tts.speak(message);
    this.showBrowserNotification(event.title, message);
  }

  private showBrowserNotification(title: string, body: string): void {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    new Notification(title, { body });
  }

  private requestNotificationPermission(): void {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }
}
