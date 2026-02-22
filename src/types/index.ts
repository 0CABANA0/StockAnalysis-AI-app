export type UserRole = "user" | "admin";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface PortfolioItem {
  id: string;
  user_id: string;
  stock_symbol: string;
  quantity: number;
  avg_price: number;
  created_at: string;
}
