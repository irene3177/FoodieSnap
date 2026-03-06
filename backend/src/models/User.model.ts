import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUserDocument } from '../types';

const UserSchema = new Schema<IUserDocument>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  avatar: {
    type: String,
    default: 'https://picsum.photos/200/200'
  },
  bio: {
    type: String,
    trim: true,
    maxlength: 200,
    default: ''
  },
  savedRecipes: [{
    type: Schema.Types.ObjectId,
    ref: 'Recipe'
  }],
  favorites: [{
    type: String
  }]
},
{
  timestamps: true,
  toJSON: {
    transform: (_doc: any, ret: any) => {
      ret._id = ret._id.toString();
      ret.savedRecipes = ret.savedRecipes?.map((id: any) => id.toString());
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  }
});

UserSchema.pre('save', async function() {
  if (!this.isModified('password')) return;

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error: any) {
    throw error;
  }
});

UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const UserModel = mongoose.model<IUserDocument>('User', UserSchema);