// Shapes returned by the API and used by the UI. Money is always integer cents.

export interface GroupSummary {
  id: string;
  name: string;
  createdAt: string;
  memberCount: number;
  expenseCount: number;
}

export interface MemberView {
  id: string;
  name: string;
  createdAt: string;
}

export interface ShareView {
  memberId: string;
  memberName: string;
  position: number;
  amountCents: number;
}

export interface ExpenseView {
  id: string;
  description: string;
  amountCents: number;
  payerId: string;
  payerName: string;
  createdAt: string;
  shares: ShareView[];
}

export interface BalanceView {
  memberId: string;
  name: string;
  paidCents: number;
  shareCents: number;
  balanceCents: number;
}

export interface TransferView {
  fromMemberId: string;
  fromName: string;
  toMemberId: string;
  toName: string;
  amountCents: number;
}

export interface GroupDetail {
  id: string;
  name: string;
  createdAt: string;
  members: MemberView[];
  expenses: ExpenseView[];
  balances: BalanceView[];
  balanceSumCents: number;
  settlements: TransferView[];
  totalSpentCents: number;
}

export interface ApiError {
  error: string;
  field?: string;
}
