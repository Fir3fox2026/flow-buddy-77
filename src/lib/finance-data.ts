export type TxKind = "income" | "fixed" | "variable";
export type TxStatus = "paid" | "pending";
export type Category = "food" | "transport" | "leisure" | "other" | "income" | "subscription";

export interface Transaction {
  id: string;
  title: string;
  amount: number; // positive for income, positive expenses (we sign by kind)
  kind: TxKind;
  category: Category;
  date: string; // ISO
  status: TxStatus;
}

const today = new Date();
const d = (offset: number) => {
  const x = new Date(today);
  x.setDate(x.getDate() + offset);
  return x.toISOString();
};

export const initialTransactions: Transaction[] = [
  { id: "t1", title: "Salário", amount: 6800, kind: "income", category: "income", date: d(-15), status: "paid" },
  { id: "t2", title: "Aluguel", amount: 1850, kind: "fixed", category: "subscription", date: d(-10), status: "paid" },
  { id: "t3", title: "Netflix", amount: 55, kind: "fixed", category: "subscription", date: d(-8), status: "paid" },
  { id: "t4", title: "Spotify", amount: 22, kind: "fixed", category: "subscription", date: d(-5), status: "paid" },
  { id: "t5", title: "Mercado", amount: 320, kind: "variable", category: "food", date: d(-4), status: "paid" },
  { id: "t6", title: "Uber", amount: 38, kind: "variable", category: "transport", date: d(-3), status: "paid" },
  { id: "t7", title: "Cinema", amount: 65, kind: "variable", category: "leisure", date: d(-2), status: "paid" },
  { id: "t8", title: "Café", amount: 18, kind: "variable", category: "food", date: d(-1), status: "paid" },
  // future / pending
  { id: "t9", title: "Internet", amount: 120, kind: "fixed", category: "subscription", date: d(3), status: "pending" },
  { id: "t10", title: "Academia", amount: 95, kind: "fixed", category: "subscription", date: d(5), status: "pending" },
  { id: "t11", title: "Freelance", amount: 1200, kind: "income", category: "income", date: d(8), status: "pending" },
  { id: "t12", title: "Energia", amount: 180, kind: "fixed", category: "subscription", date: d(12), status: "pending" },
];

export const categoryLabel: Record<Category, string> = {
  food: "Alimentação",
  transport: "Transporte",
  leisure: "Lazer",
  other: "Outros",
  income: "Receita",
  subscription: "Assinatura",
};

export function signedAmount(t: Transaction): number {
  return t.kind === "income" ? t.amount : -t.amount;
}

export function isExpense(t: Transaction): boolean {
  return t.kind !== "income";
}

export function endOfMonth(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
}

export function startOfMonth(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0);
}

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
