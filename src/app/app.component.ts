import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  IonApp,
  IonSplitPane,
  IonMenu,
  IonContent,
  IonList,
  IonMenuToggle,
  IonItem,
  IonIcon,
  IonLabel,
  IonButton,
  IonRouterOutlet,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  calendarOutline,
  calendarSharp,
  peopleOutline,
  peopleSharp,
  personCircleOutline,
  personCircleSharp,
  chevronBack,
  chevronForward,
} from 'ionicons/icons';
import { ReminderWatcherService } from './core/voice/reminder-watcher.service';

const SIDEBAR_COLLAPSED_KEY = 'anasendar.sidebarCollapsed';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [
    RouterLink,
    RouterLinkActive,
    IonApp,
    IonSplitPane,
    IonMenu,
    IonContent,
    IonList,
    IonMenuToggle,
    IonItem,
    IonIcon,
    IonLabel,
    IonButton,
    IonRouterOutlet,
  ],
})
export class AppComponent {
  private readonly reminderWatcher = inject(ReminderWatcherService);

  protected readonly appPages = [
    { title: 'My Calendar', url: '/calendar', icon: 'calendar' },
    { title: 'Family Dashboard', url: '/dashboard', icon: 'people' },
    { title: 'Family Members', url: '/profiles', icon: 'person-circle' },
  ];

  protected readonly collapsed = signal(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true');

  constructor() {
    addIcons({
      calendarOutline,
      calendarSharp,
      peopleOutline,
      peopleSharp,
      personCircleOutline,
      personCircleSharp,
      chevronBack,
      chevronForward,
    });
    this.reminderWatcher.start();
  }

  toggleSidebar(): void {
    const next = !this.collapsed();
    this.collapsed.set(next);
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
  }
}
