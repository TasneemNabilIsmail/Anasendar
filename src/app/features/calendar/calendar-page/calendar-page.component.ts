import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AsyncPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonMenuButton,
  IonFab,
  IonFabButton,
  IonIcon,
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
import { addIcons } from 'ionicons';
import { add } from 'ionicons/icons';
import { map, of, switchMap } from 'rxjs';
import { EVENTS_REPOSITORY } from '../../../core/data/events-repository.token';
import { EventsRepository } from '../../../core/data/events-repository.model';
import { ActiveProfileService } from '../../../core/profile/active-profile.service';
import { ProfileSwitcherComponent } from '../../../core/profile/profile-switcher/profile-switcher.component';
import { EventMeta, toCalendarEvent } from '../../../core/calendar/to-calendar-event';

@Component({
  selector: 'app-calendar-page',
  standalone: true,
  imports: [
    AsyncPipe,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonMenuButton,
    IonFab,
    IonFabButton,
    IonIcon,
    CalendarPreviousViewDirective,
    CalendarTodayDirective,
    CalendarNextViewDirective,
    CalendarMonthViewComponent,
    CalendarWeekViewComponent,
    CalendarDayViewComponent,
    CalendarDatePipe,
    ProfileSwitcherComponent,
  ],
  providers: [provideCalendar({ provide: DateAdapter, useFactory: adapterFactory })],
  templateUrl: './calendar-page.component.html',
  styleUrl: './calendar-page.component.scss',
})
export class CalendarPageComponent {
  private readonly router = inject(Router);
  private readonly eventsRepo = inject<EventsRepository>(EVENTS_REPOSITORY);
  private readonly activeProfileService = inject(ActiveProfileService);

  readonly CalendarView = CalendarView;
  view: CalendarView = CalendarView.Week;
  viewDate = new Date();

  readonly activeProfile$ = this.activeProfileService.activeProfile$;

  readonly events = toSignal(
    this.activeProfile$.pipe(
      switchMap((profile) =>
        profile
          ? this.eventsRepo
              .list(profile.id)
              .pipe(map((events) => events.map((event) => toCalendarEvent(event, profile))))
          : of([] as CalendarEvent<EventMeta>[]),
      ),
    ),
    { initialValue: [] as CalendarEvent<EventMeta>[] },
  );

  constructor() {
    addIcons({ add });
  }

  setView(view: CalendarView): void {
    this.view = view;
  }

  onEventClicked(event: CalendarEvent<EventMeta>): void {
    if (!event.meta) return;
    this.router.navigate(['/events', event.meta.eventId, 'edit']);
  }

  createEvent(prefillDate?: Date): void {
    this.router.navigate(['/events/new'], prefillDate ? { queryParams: { date: prefillDate.toISOString() } } : {});
  }
}
