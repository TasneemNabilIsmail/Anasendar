import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonMenuButton,
  IonBadge,
  IonList,
  IonItem,
  IonLabel,
} from '@ionic/angular';
import {
  CalendarPreviousViewDirective,
  CalendarTodayDirective,
  CalendarNextViewDirective,
  CalendarMonthViewComponent,
  CalendarWeekViewComponent,
  CalendarDayViewComponent,
  CalendarDatePipe,
  CalendarEvent,
  CalendarView,
  DateAdapter,
  provideCalendar,
} from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { combineLatest, map } from 'rxjs';
import { EVENTS_REPOSITORY } from '../../../core/data/events-repository.token';
import { EventsRepository } from '../../../core/data/events-repository.model';
import { PROFILES_REPOSITORY } from '../../../core/data/profiles-repository.token';
import { ProfilesRepository } from '../../../core/data/profiles-repository.model';
import { Profile } from '../../../shared/models/profile.model';
import { EventMeta, toCalendarEvent } from '../../../core/calendar/to-calendar-event';
import { findCrossProfileOverlaps, OverlapPair } from '../../../core/conflict/find-cross-profile-overlaps';

/** Read-only view of every profile's calendar together, plus a list of cross-profile time overlaps. */
@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonMenuButton,
    IonBadge,
    IonList,
    IonItem,
    IonLabel,
    CalendarPreviousViewDirective,
    CalendarTodayDirective,
    CalendarNextViewDirective,
    CalendarMonthViewComponent,
    CalendarWeekViewComponent,
    CalendarDayViewComponent,
    CalendarDatePipe,
  ],
  providers: [provideCalendar({ provide: DateAdapter, useFactory: adapterFactory })],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
})
export class DashboardPageComponent {
  private readonly router = inject(Router);
  private readonly eventsRepo = inject<EventsRepository>(EVENTS_REPOSITORY);
  private readonly profilesRepo = inject<ProfilesRepository>(PROFILES_REPOSITORY);

  readonly CalendarView = CalendarView;
  view: CalendarView = CalendarView.Week;
  viewDate = new Date();

  readonly profiles = toSignal(this.profilesRepo.list(), { initialValue: [] as Profile[] });

  readonly events = toSignal(
    combineLatest([this.eventsRepo.listAll(), this.profilesRepo.list()]).pipe(
      map(([events, profiles]) =>
        events.map((event) => toCalendarEvent(event, profiles.find((p) => p.id === event.profileId), true)),
      ),
    ),
    { initialValue: [] as CalendarEvent<EventMeta>[] },
  );

  readonly overlaps = toSignal(this.eventsRepo.listAll().pipe(map((events) => findCrossProfileOverlaps(events))), {
    initialValue: [] as OverlapPair[],
  });

  setView(view: CalendarView): void {
    this.view = view;
  }

  profileFor(profileId: string): Profile | undefined {
    return this.profiles().find((profile) => profile.id === profileId);
  }

  onEventClicked(event: CalendarEvent<EventMeta>): void {
    if (!event.meta) return;
    this.router.navigate(['/events', event.meta.eventId, 'edit']);
  }
}
