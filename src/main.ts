import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withComponentInputBinding, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { EVENTS_REPOSITORY } from './app/core/data/events-repository.token';
import { LocalStorageEventsRepository } from './app/core/data/local-storage-events-repository.service';
import { PROFILES_REPOSITORY } from './app/core/data/profiles-repository.token';
import { LocalStorageProfilesRepository } from './app/core/data/local-storage-profiles-repository.service';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules), withComponentInputBinding()),
    // Local-storage-backed for now; swap for an Http* implementation once a backend exists.
    { provide: EVENTS_REPOSITORY, useClass: LocalStorageEventsRepository },
    { provide: PROFILES_REPOSITORY, useClass: LocalStorageProfilesRepository },
  ],
});
