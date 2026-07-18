export type Identity = {
  userId: string;
  email: string;
  name: string;
};

export type AuthenticatedSession = {
  user: {
    id: string;
    email: string;
    emailVerified: boolean;
    name: string;
  };
};
