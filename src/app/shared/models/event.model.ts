export interface EventRecord {
  id: string;
  profileId: string;
  title: string;
  description?: string;
  location?: string;
  startAt: Date;
  endAt: Date;
  reminderMinutesBefore?: number;
  reminderSentAt?: Date;
}

export interface EventInput {
  title: string;
  description?: string;
  location?: string;
  startAt: Date;
  endAt: Date;
  reminderMinutesBefore?: number;
}
