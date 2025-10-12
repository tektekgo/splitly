import { Category, type User, type Group } from './types';
// MOCK_USERS_INITIAL and MOCK_GROUPS_INITIAL have been removed.
// Data will now be fetched from Firestore.

export const createNewUser = (name: string): User => {
    const newId = crypto.randomUUID();
    return {
        id: newId,
        name: name,
        avatarUrl: `https://i.pravatar.cc/150?u=${newId}`
    };
};


export const CATEGORIES: Category[] = [
  Category.FoodAndDrink,
  Category.Transportation,
  Category.Housing,
  Category.Entertainment,
  Category.Utilities,
  Category.Health,
  Category.PersonalCare,
  Category.Rent,
  Category.Shopping,
  Category.Groceries,
  Category.Payment,
  Category.Other,
];