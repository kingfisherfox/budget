export type Category = {
  id: string;
  name: string;
  color: string | null;
  sortOrder: number;
  createdAt: string;
  budget: { monthlyAmount: string } | null;
};

export type RecurringSubcategory = {
  id: string;
  name: string;
  sortOrder: number;
};

export type Expense = {
  id: string;
  name: string;
  categoryId: string;
  amount: string;
  date: string;
  note: string | null;
  recurringExpenseId: string | null;
  recurringSubcategoryId: string | null;
  createdAt: string;
  category: { id: string; name: string };
};

export type RecurringStatus = {
  id: string;
  name: string;
  categoryId: string;
  defaultAmount: string | null;
  isCommon: boolean;
  sortOrder: number;
  category: { id: string; name: string };
  subcategories: RecurringSubcategory[];
  completed: boolean;
};

export type RecurringTemplate = {
  id: string;
  name: string;
  categoryId: string;
  defaultAmount: string | null;
  isCommon: boolean;
  sortOrder: number;
  createdAt: string;
  category: { id: string; name: string };
  subcategories: RecurringSubcategory[];
};

export type WishlistItem = {
  id: string;
  name: string;
  categoryId: string;
  amount: string;
  note: string | null;
  createdAt: string;
  category: { id: string; name: string };
};

export type DashboardResponse = {
  month: string;
  currencyCode: string;
  categories: {
    categoryId: string;
    name: string;
    color: string | null;
    budget: number;
    actual: number;
    variancePercent: number | null;
  }[];
  dailySpend: { date: string; total: number }[];
  totals: { budget: number; actual: number };
};

export type AppSettings = {
  userId: string;
  currencyCode: string;
  timeZone: string;
  domainName: string;
};
