import { Types, Document } from 'mongoose';

export interface IUser {
  _id?: Types.ObjectId;
  username: string;
  email: string;
  password: string;
  avatar?: string;
  bio?: string;
  savedRecipes?: Types.ObjectId[];
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
  savedRecipes?: string[];
  favorites?: string[];
  recipeCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface IUserListItem {
  _id: string;
  username: string;
  avatar?: string;
  bio?: string;
  recipeCount: number;
}
