export enum PhoneTypes {
  MOBILE,
  HOME
}

export interface JWTPayload {
  id: string;
  email: string;
  firstName: string,
  lastName: string,
  roleId: number;
}