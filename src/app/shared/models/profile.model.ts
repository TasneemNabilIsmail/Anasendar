export interface Profile {
  id: string;
  displayName: string;
  colorHex: string;
  isDefault: boolean;
}

export interface ProfileInput {
  displayName: string;
  colorHex: string;
}
