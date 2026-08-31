import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'calendar',
    pathMatch: 'full',
  },
  {
    path: 'calendar',
    loadComponent: () => import('./features/calendar/calendar-page/calendar-page.component').then((m) => m.CalendarPageComponent),
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/calendar/dashboard-page/dashboard-page.component').then((m) => m.DashboardPageComponent),
  },
  {
    path: 'profiles',
    loadComponent: () => import('./features/profiles/manage-profiles.page').then((m) => m.ManageProfilesPage),
  },
  {
    path: 'events/new',
    loadComponent: () => import('./features/event-form/event-form.page').then((m) => m.EventFormPage),
  },
  {
    path: 'events/:id/edit',
    loadComponent: () => import('./features/event-form/event-form.page').then((m) => m.EventFormPage),
  },
];
