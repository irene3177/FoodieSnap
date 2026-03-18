import { Types } from 'mongoose';

export interface IComment {
  _id?: Types.ObjectId;
  text: string;
  recipeId: Types.ObjectId;
  userId: Types.ObjectId;
  userName: string;
  userAvatar?: string;
  rating?: number;
  likes: number;
  likedBy: Types.ObjectId[];
  isEdited: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICommentInput {
  text: string;
  recipeId: string;
  rating?: number;
}

export interface ICommentUpdateInput {
  text?: string;
  rating?: number;
}