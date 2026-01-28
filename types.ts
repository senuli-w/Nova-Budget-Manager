import { Banknote, Utensils, Car, ShoppingBag, Home, Zap, Film, HeartPulse, ArrowRightLeft, MoreHorizontal, LucideIcon } from 'lucide-react';

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  TRANSFER = 'TRANSFER'
}

export enum CategoryType {
  SALARY = 'Salary',
  FOOD = 'Food',
  TRANSPORT = 'Transport',
  SHOPPING = 'Shopping',
  HOUSING = 'Housing',
  UTILITIES = 'Utilities',
  ENTERTAINMENT = 'Entertainment',
  HEALTH = 'Health',
  TRANSFER = 'Transfer',
  OTHER = 'Other'
}

export const CategoryColors: Record<CategoryType, string> = {
  [CategoryType.SALARY]: '#10b981', // Emerald 500
  [CategoryType.FOOD]: '#ef4444', // Red 500
  [CategoryType.TRANSPORT]: '#f59e0b', // Amber 500
  [CategoryType.SHOPPING]: '#eab308', // Yellow 500
  [CategoryType.HOUSING]: '#3b82f6', // Blue 500
  [CategoryType.UTILITIES]: '#6366f1', // Indigo 500
  [CategoryType.ENTERTAINMENT]: '#8b5cf6', // Violet 500
  [CategoryType.HEALTH]: '#ec4899', // Pink 500
  [CategoryType.TRANSFER]: '#a855f7', // Purple 500
  [CategoryType.OTHER]: '#64748b', // Slate 500
};

export const CategoryIcons: Record<CategoryType, LucideIcon> = {
  [CategoryType.SALARY]: Banknote,
  [CategoryType.FOOD]: Utensils,
  [CategoryType.TRANSPORT]: Car,
  [CategoryType.SHOPPING]: ShoppingBag,
  [CategoryType.HOUSING]: Home,
  [CategoryType.UTILITIES]: Zap,
  [CategoryType.ENTERTAINMENT]: Film,
  [CategoryType.HEALTH]: HeartPulse,
  [CategoryType.TRANSFER]: ArrowRightLeft,
  [CategoryType.OTHER]: MoreHorizontal,
};

export interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  color?: string;
  createdAt: number;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: CategoryType | string;
  accountId: string;
  toAccountId?: string; // For transfers
  date: number; // Timestamp
  description: string;
  serviceFee?: number; // Only for transfers
  createdAt: number;
}

export interface Budget {
  id: string;
  category: CategoryType | string;
  limit: number;
  spent: number; // Calculated field
  month: string; // Format "YYYY-MM"
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
}