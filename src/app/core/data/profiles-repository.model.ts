import { Observable } from 'rxjs';
import { Profile, ProfileInput } from '../../shared/models/profile.model';

export interface ProfilesRepository {
  list(): Observable<Profile[]>;
  create(input: ProfileInput): Observable<Profile>;
  update(id: string, input: ProfileInput): Observable<Profile>;
  remove(id: string): Observable<void>;
}
