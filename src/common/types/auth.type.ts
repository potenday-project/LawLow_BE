export interface UserPayloadInfo {
  id: number;
  name: string;
  email: string;
  profileImage: string;
}

export interface PassportGoogleUser {
  user: {
    id: string;
    name: string;
    email: string;
    photo: string;
  };
}

export interface CreateUserInfo {
  id: string;
  email: string;
  name: string;
  photo: string;
}
