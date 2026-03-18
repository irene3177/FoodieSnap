import mongoose, { Schema, Document } from 'mongoose';

export interface IRatingDocument extends Document {
  recipeId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  value: number; // 1-5
  createdAt: Date;
  updatedAt: Date;
}

const RatingSchema = new Schema<IRatingDocument>({
  recipeId: {
    type: Schema.Types.ObjectId,
    ref: 'Recipe',
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  value: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  }
}, {
  timestamps: true
});

// Ensure one rating per user per recipe
RatingSchema.index({ recipeId: 1, userId: 1 }, { unique: true });

export const RatingModel = mongoose.model<IRatingDocument>('Rating', RatingSchema);