import { onchainTable, primaryKey } from "@ponder/core";

// Market table - stores created markets
export const market = onchainTable("market", (t) => ({
  loanToken: t.hex().notNull(),
  collateralToken: t.hex().notNull(),
  interestRate: t.bigint().notNull(),
  LTV: t.bigint().notNull(),
}), (table) => ({
  pk: primaryKey({ columns: [table.loanToken, table.collateralToken] })
}));

// Lend Position table - stores user deposit positions
export const lendPosition = onchainTable("lend_position", (t) => ({
  loanToken: t.hex().notNull(),
  collateralToken: t.hex().notNull(),
  user: t.hex().notNull(),
  amount: t.bigint().notNull(),
  shares: t.bigint().notNull(),
}), (table) => ({
  pk: primaryKey({ columns: [table.loanToken, table.collateralToken, table.user] })
}));

// Borrow Position table - stores user borrow positions
export const borrowPosition = onchainTable("borrow_position", (t) => ({
  loanToken: t.hex().notNull(),
  collateralToken: t.hex().notNull(),
  user: t.hex().notNull(),
  amount: t.bigint().notNull(),
  shares: t.bigint().notNull(),
  collateralAmount: t.bigint().notNull(),
}), (table) => ({
  pk: primaryKey({ columns: [table.loanToken, table.collateralToken, table.user] })
}));
