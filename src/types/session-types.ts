export interface WristbandSessionMetadata {
  email: string;
  supabaseToken: string;
  role: WristbandRole;
  // Add other Wristband session metadata here in the future, if necessary.
}

export interface WristbandRole {
  id: string;
  name: string;
  displayName: string;
}
