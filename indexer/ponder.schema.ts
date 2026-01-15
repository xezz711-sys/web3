import { createSchema } from "@ponder/core";

export default createSchema((p) => ({
  market: p.createTable({
    id: p.string(),
    loanToken: p.hex(),
    collateralToken: p.hex(),
    interestRate: p.bigint(),
    LTV: p.bigint(),
  }),
  lendPosition: p.createTable({
    id: p.string(),
    loanToken: p.hex(),
    collateralToken: p.hex(),
    user: p.hex(),
    amount: p.bigint(),
    shares: p.bigint(),
  }),
  borrowPosition: p.createTable({
    id: p.string(),
    loanToken: p.hex(),
    collateralToken: p.hex(),
    user: p.hex(),
    amount: p.bigint(),
    shares: p.bigint(),
    collateralAmount: p.bigint(),
  }),
}));
