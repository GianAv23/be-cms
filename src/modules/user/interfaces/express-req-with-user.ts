import { Request as ExpressRequest } from 'express';
import { UserPayload } from './login-user';

export interface ExpressRequestWithUser extends ExpressRequest {
  user: UserPayload & { iat: number; exp: number };
}
