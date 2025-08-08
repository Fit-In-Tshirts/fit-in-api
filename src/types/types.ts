export enum PhoneTypes {
  MOBILE,
  HOME
}

export interface JWTPayload {
  id: string;
  email: string;
  roleId: number;
}