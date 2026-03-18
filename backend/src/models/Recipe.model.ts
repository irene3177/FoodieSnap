import mongoose, { Schema, Document } from 'mongoose';
import { IRecipe } from '../types';

export interface IRecipeDocument extends Document, Omit<IRecipe, '_id'> {}

const RecipeSchema = new Schema<IRecipeDocument>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  ingredients: [{
    type: String,
    required: true
  }],
  instructions: [{
    type: String,
    required: true
  }],
  imageUrl: {
    type: String,
    default: 'https://picsum.photos/400/300'
  },
  youtubeUrl: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    default: ''
  },
  area: {
    type: String,
    default: ''
  },
  tags: [{
    type: String,
    default: []
  }],
  cookingTime: {
    type: Number,
    min: 1
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  ratingCount: {
    type: Number,
    default: 0
  },
  source: {
    type: String,
    enum: ['user', 'theMealDB'],
    default: 'user'
  },
  sourceId: {
    type: String,
    sparse: true
  }
},
{
  timestamps: true,
  toJSON: {
    transform: (_doc: any, ret: any) => {
      ret._id = ret._id.toString();
      if (ret.author && typeof ret.author === 'object') {
          // Convert author ObjectId to string and include username and avatar for frontend
          ret.author = {
            _id: ret.author._id.toString(),
            username: ret.author.username,
            avatar: ret.author.avatar
          };
        }
      delete ret.__v;
      return ret;
    }
  }
});

// Create text index for search functionality 
RecipeSchema.index({ title: 'text', description: 'text' });

export const RecipeModel = mongoose.model<IRecipeDocument>('Recipe', RecipeSchema);