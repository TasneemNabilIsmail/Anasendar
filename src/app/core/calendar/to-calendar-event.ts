import { CalendarEvent } from 'angular-calendar';
import { EventRecord } from '../../shared/models/event.model';
import { Profile } from '../../shared/models/profile.model';

export interface EventMeta {
  eventId: string;
  profileId: string;
}

/** Maps a domain EventRecord to angular-calendar's CalendarEvent, colored by owning profile. */
export function toCalendarEvent(
  event: EventRecord,
  profile: Profile | undefined,
  includeProfileName = false,
): CalendarEvent<EventMeta> {
  const color = profile?.colorHex ?? '#3B82F6';
  const title = includeProfileName && profile ? `${event.title} (${profile.displayName})` : event.title;
  return {
    id: event.id,
    title,
    start: event.startAt,
    end: event.endAt,
    color: { primary: color, secondary: `${color}33` },
    meta: { eventId: event.id, profileId: event.profileId },
  };
}
