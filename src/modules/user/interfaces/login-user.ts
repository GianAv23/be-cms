export interface UserPayload {
  sub: string;
  uniqueUUID: string;
  date: Date;
  role: string[];
}

export interface LoginRessponse {
  access_token: string;
}
