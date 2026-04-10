import mongoose from 'mongoose';

export const isValidObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

export const validateNumber = (
  value: any,
  defaultValue: number,
  min = 1,
  max = Infinity
) => {
  const num = Number(value);
  if (isNaN(num)) return defaultValue;
  return Math.min(max, Math.max(min, Math.floor(num)));
};