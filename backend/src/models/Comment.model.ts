import mongoose, { Schema, Document } from 'mongoose';
import { IComment } from '../types';

export interface ICommentDocument extends Document, Omit<IComment, '_id'> {}

const CommentSchema = new Schema<ICommentDocument>({
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  recipeId: {
    type: mongoose.Types.ObjectId,
    ref: 'Recipe',
    required: true
  },
  userId: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true,
    trim: true,
  },
  userAvatar: {
    type: String,
    default: 'https://picsum.photos/200/200'
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  likes: {
    type: Number,
    default: 0
  },
  likedBy:[{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  isEdited: {
    type: Boolean,
    default: false
  }
},
{
  timestamps: true,
  toJSON: {
    transform: (_doc: any, ret: any) => {
      ret._id = ret._id.toString();
      ret.recipeId = ret.recipeId.toString();
      ret.userId = ret.userId.toString();
      ret.likedBy = ret.likedBy.map((id: any) => id.toString());
      return ret;
    }
  }
});

// CommentSchema.index({ recipeId: 1, createdAt: -1 });
// CommentSchema.index({ userId: 1 });

export const CommentModel = mongoose.model<ICommentDocument>('Comment', CommentSchema);