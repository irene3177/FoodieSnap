import { Types, Document } from 'mongoose';

export interface IUser {
  _id?: Types.ObjectId;
  username: string;
  email: string;
  password: string;
  avatar?: string;
  bio?: string;
  createdRecipes?: Types.ObjectId[];
  favorites?: Types.ObjectId[];
  followers?: Types.ObjectId[];
  following?: Types.ObjectId[];
}

export interface IUserDocument extends Document, Omit<IUser, '_id'> {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IUserResponse {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  createdRecipes?: string[];
  favorites?: string[];
  followers?: string[];
  following?: string[];
  recipeCount?: number;
  followersCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface IUserListItem {
  _id: string;
  username: string;
  avatar?: string;
  bio?: string;
  recipeCount: number;
  isFollowing?: boolean;
}
