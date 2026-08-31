import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonNote,
} from '@ionic/angular';
import { take } from 'rxjs';
import { EVENTS_REPOSITORY } from '../../core/data/events-repository.token';
import { EventsRepository, ConflictError } from '../../core/data/events-repository.model';
import { ActiveProfileService } from '../../core/profile/active-profile.service';
import { EventRecord } from '../../shared/models/event.model';

const REMINDER_OPTIONS = [0, 5, 10, 15, 30, 60];

@Component({
  selector: 'app-event-form-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
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
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonNote,
  ],
  templateUrl: './event-form.page.html',
  styleUrl: './event-form.page.scss',
})
export class EventFormPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly eventsRepo = inject<EventsRepository>(EVENTS_REPOSITORY);
  private readonly activeProfileService = inject(ActiveProfileService);

  readonly reminderOptions = REMINDER_OPTIONS;

  editingEvent: EventRecord | null = null;
  errorMessage = '';

  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    description: [''],
    location: [''],
    startAt: ['', Validators.required],
    endAt: ['', Validators.required],
    reminderMinutesBefore: [10],
  });

  get isEditMode(): boolean {
    return this.editingEvent !== null;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadForEdit(id);
      return;
    }

    const prefillDate = this.route.snapshot.queryParamMap.get('date');
    if (prefillDate) {
      const start = new Date(prefillDate);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      this.form.patchValue({ startAt: toLocalInputValue(start), endAt: toLocalInputValue(end) });
    }
  }

  private loadForEdit(id: string): void {
    this.eventsRepo
      .listAll()
      .pipe(take(1))
      .subscribe((events) => {
        const event = events.find((e) => e.id === id);
        if (!event) {
          this.router.navigate(['/calendar']);
          return;
        }
        this.editingEvent = event;
        this.form.patchValue({
          title: event.title,
          description: event.description ?? '',
          location: event.location ?? '',
          startAt: toLocalInputValue(event.startAt),
          endAt: toLocalInputValue(event.endAt),
          reminderMinutesBefore: event.reminderMinutesBefore ?? 0,
        });
      });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.errorMessage = '';

    const raw = this.form.getRawValue();
    const input = {
      title: raw.title,
      description: raw.description || undefined,
      location: raw.location || undefined,
      startAt: new Date(raw.startAt),
      endAt: new Date(raw.endAt),
      reminderMinutesBefore: raw.reminderMinutesBefore > 0 ? raw.reminderMinutesBefore : undefined,
    };

    const save$ = this.editingEvent
      ? this.eventsRepo.update(this.editingEvent.id, input)
      : this.eventsRepo.create(this.getActiveProfileIdSync(), input);

    save$.subscribe({
      next: () => this.router.navigate(['/calendar']),
      error: (err: unknown) => {
        this.errorMessage = err instanceof ConflictError || err instanceof Error ? err.message : 'Something went wrong.';
      },
    });
  }

  delete(): void {
    if (!this.editingEvent) return;
    this.eventsRepo.remove(this.editingEvent.id).subscribe(() => this.router.navigate(['/calendar']));
  }

  // activeProfile$ is built from two BehaviorSubjects, so it always emits synchronously on subscribe.
  private getActiveProfileIdSync(): string {
    let id = '';
    this.activeProfileService.activeProfile$.pipe(take(1)).subscribe((profile) => {
      id = profile?.id ?? '';
    });
    return id;
  }
}

function toLocalInputValue(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
