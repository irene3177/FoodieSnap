// scripts/migrate-users.ts
import mongoose from 'mongoose';
import { UserModel } from '../models/User.model';
import { config } from '../config';

async function migrateUsers() {
  await mongoose.connect(config.mongoUri);
  
  // Rename savedRecipes to createdRecipes for any users that have it
  const result = await UserModel.updateMany(
    { savedRecipes: { $exists: true } },
    { $rename: { savedRecipes: 'createdRecipes' } }
  );
  
  console.log(`✅ Migrated ${result.modifiedCount} users`);
  process.exit();
}

migrateUsers();