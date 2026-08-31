import { Component, Inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { IonChip, IonLabel } from '@ionic/angular';
import { Observable } from 'rxjs';
import { Profile } from '../../../shared/models/profile.model';
import { PROFILES_REPOSITORY } from '../../data/profiles-repository.token';
import { ProfilesRepository } from '../../data/profiles-repository.model';
import { ActiveProfileService } from '../active-profile.service';

/** Netflix-style row of profile chips for switching whose calendar is active. */
@Component({
  selector: 'app-profile-switcher',
  standalone: true,
  imports: [AsyncPipe, IonChip, IonLabel],
  templateUrl: './profile-switcher.component.html',
  styleUrl: './profile-switcher.component.scss',
})
export class ProfileSwitcherComponent {
  readonly profiles$: Observable<Profile[]>;
  readonly activeProfile$: Observable<Profile | undefined>;

  constructor(
    @Inject(PROFILES_REPOSITORY) profilesRepo: ProfilesRepository,
    private readonly activeProfileService: ActiveProfileService,
  ) {
    this.profiles$ = profilesRepo.list();
    this.activeProfile$ = this.activeProfileService.activeProfile$;
  }

  select(profile: Profile): void {
    this.activeProfileService.setActiveProfile(profile.id);
  }
}
