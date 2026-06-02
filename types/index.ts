export interface User {
  id: string;
  name: string;
  email: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: "income" | "expense";
  icon?: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string;
  category_name?: string;
  category_icon?: string;
  amount: number;
  type: "income" | "expense";
  note?: string;
  transaction_date: string;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  category_name?: string;
  category_icon?: string;
  limit_amount: number;
  period: "monthly" | "weekly";
  spent: number;
  created_at: string;
  updated_at: string;
}

export interface TransactionListResponse {
  data: Transaction[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CategorySummary {
  category_id: string;
  category_name: string;
  type: "income" | "expense";
  total: number;
}

export interface MonthlySummary {
  month: string;
  income: number;
  expense: number;
}

export interface SummaryResponse {
  total_income: number;
  total_expense: number;
  balance: number;
  by_category: CategorySummary[];
  monthly: MonthlySummary[];
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface TransactionFilter {
  type?: string;
  category_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  page_size?: number;
}
