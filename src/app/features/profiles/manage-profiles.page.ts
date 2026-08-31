import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
  IonBadge,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { checkmarkCircle, pencil, trash, close } from 'ionicons/icons';
import { take } from 'rxjs';
import { PROFILES_REPOSITORY } from '../../core/data/profiles-repository.token';
import { ProfilesRepository } from '../../core/data/profiles-repository.model';
import { EVENTS_REPOSITORY } from '../../core/data/events-repository.token';
import { EventsRepository } from '../../core/data/events-repository.model';
import { ActiveProfileService } from '../../core/profile/active-profile.service';
import { Profile } from '../../shared/models/profile.model';

const PALETTE = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

@Component({
  selector: 'app-manage-profiles-page',
  standalone: true,
  imports: [
    AsyncPipe,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonIcon,
    IonBadge,
  ],
  templateUrl: './manage-profiles.page.html',
  styleUrl: './manage-profiles.page.scss',
})
export class ManageProfilesPage {
  private readonly profilesRepo = inject<ProfilesRepository>(PROFILES_REPOSITORY);
  private readonly eventsRepo = inject<EventsRepository>(EVENTS_REPOSITORY);
  private readonly activeProfileService = inject(ActiveProfileService);

  readonly palette = PALETTE;
  readonly profiles = toSignal(this.profilesRepo.list(), { initialValue: [] as Profile[] });
  readonly activeProfile$ = this.activeProfileService.activeProfile$;

  newName = '';
  newColor = PALETTE[0];

  editingId: string | null = null;
  editingName = '';
  editingColor = '';

  constructor() {
    addIcons({ checkmarkCircle, pencil, trash, close });
  }

  addProfile(): void {
    const name = this.newName.trim();
    if (!name) return;
    this.profilesRepo.create({ displayName: name, colorHex: this.newColor }).subscribe();
    this.newName = '';
    this.newColor = PALETTE[Math.floor(Math.random() * PALETTE.length)];
  }

  startEdit(profile: Profile): void {
    this.editingId = profile.id;
    this.editingName = profile.displayName;
    this.editingColor = profile.colorHex;
  }

  cancelEdit(): void {
    this.editingId = null;
  }

  saveEdit(): void {
    if (!this.editingId) return;
    const name = this.editingName.trim();
    if (!name) return;
    this.profilesRepo.update(this.editingId, { displayName: name, colorHex: this.editingColor }).subscribe();
    this.editingId = null;
  }

  remove(profile: Profile): void {
    if (!confirm(`Remove ${profile.displayName}? This also deletes their events.`)) return;
    this.eventsRepo
      .list(profile.id)
      .pipe(take(1))
      .subscribe((events) => {
        events.forEach((event) => this.eventsRepo.remove(event.id).subscribe());
        this.profilesRepo.remove(profile.id).subscribe();
      });
  }

  selectActive(profile: Profile): void {
    this.activeProfileService.setActiveProfile(profile.id);
  }
}
