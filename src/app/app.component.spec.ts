import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router, RouterLink } from '@angular/router';

import { AppComponent } from './app.component';
import { EVENTS_REPOSITORY } from './core/data/events-repository.token';
import { PROFILES_REPOSITORY } from './core/data/profiles-repository.token';
import { LocalStorageEventsRepository } from './core/data/local-storage-events-repository.service';
import { LocalStorageProfilesRepository } from './core/data/local-storage-profiles-repository.service';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        { provide: EVENTS_REPOSITORY, useClass: LocalStorageEventsRepository },
        { provide: PROFILES_REPOSITORY, useClass: LocalStorageProfilesRepository },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should have menu labels', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    // ion-label is a scoped Stencil component whose slot content is relocated
    // asynchronously, so wait for hydration before reading textContent (ROU-10799).
    await fixture.whenStable();
    const app = fixture.nativeElement;
    const menuItems = app.querySelectorAll('ion-label');
    expect(menuItems.length).toEqual(3);
    expect(menuItems[0].innerHTML).toContain('My Calendar');
    expect(menuItems[1].innerHTML).toContain('Family Dashboard');
    expect(menuItems[2].innerHTML).toContain('Family Members');
  });

  it('should have urls', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const app = fixture.nativeElement;
    expect(app.querySelectorAll('ion-item').length).toEqual(3);
    // Ionic applies the rendered href through its own async write queue, so
    // reading the DOM attribute is flaky (FW-6264). Assert the routerLink
    // binding directly, which resolves synchronously.
    const router = TestBed.inject(Router);
    const links = fixture.debugElement
      .queryAll(By.directive(RouterLink))
      .map((el) => el.injector.get(RouterLink));
    expect(links.length).toEqual(3);
    expect(router.serializeUrl(links[0].urlTree!)).toEqual('/calendar');
    expect(router.serializeUrl(links[1].urlTree!)).toEqual('/dashboard');
    expect(router.serializeUrl(links[2].urlTree!)).toEqual('/profiles');
  });
});
