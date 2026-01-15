import { ponder } from "@/generated";

// =============================================================================
// MarketCreated Event Handler
// =============================================================================
ponder.on("PBALend:MarketCreated", async ({ event, context }) => {
  const { loanToken, collateralToken, interestRate, LTV } = event.args;
  const id = `${loanToken}-${collateralToken}`;

  await context.db.market.upsert({
    id,
    create: {
      loanToken,
      collateralToken,
      interestRate,
      LTV,
    },
    update: {},
  });

  console.log("PBALend: MarketCreated", {
    loanToken,
    collateralToken,
    interestRate: interestRate.toString(),
    LTV: LTV.toString(),
  });
});

// =============================================================================
// Deposit Event Handler
// =============================================================================
ponder.on("PBALend:Deposit", async ({ event, context }) => {
  const { loanToken, collateralToken, user, amount, shares } = event.args;
  const id = `${loanToken}-${collateralToken}-${user}`;

  const currentPosition = await context.db.lendPosition.findUnique({ id });

  if (!currentPosition) {
    await context.db.lendPosition.create({
      id,
      data: {
        loanToken,
        collateralToken,
        user,
        amount,
        shares,
      },
    });
  } else {
    await context.db.lendPosition.update({
      id,
      data: {
        amount: currentPosition.amount + amount,
        shares: currentPosition.shares + shares,
      },
    });
  }

  console.log("PBALend: Deposit", {
    loanToken,
    collateralToken,
    user,
    amount: amount.toString(),
    shares: shares.toString(),
  });
});

// =============================================================================
// Borrow Event Handler
// =============================================================================
ponder.on("PBALend:Borrow", async ({ event, context }) => {
  const { loanToken, collateralToken, user, amount, shares, collateralAmount } = event.args;
  const id = `${loanToken}-${collateralToken}-${user}`;

  const currentPosition = await context.db.borrowPosition.findUnique({ id });

  if (!currentPosition) {
    await context.db.borrowPosition.create({
      id,
      data: {
        loanToken,
        collateralToken,
        user,
        amount,
        shares,
        collateralAmount,
      },
    });
  } else {
    await context.db.borrowPosition.update({
      id,
      data: {
        amount: currentPosition.amount + amount,
        shares: currentPosition.shares + shares,
        collateralAmount: currentPosition.collateralAmount + collateralAmount,
      },
    });
  }

  console.log("PBALend: Borrow", {
    loanToken,
    collateralToken,
    user,
    amount: amount.toString(),
    shares: shares.toString(),
    collateralAmount: collateralAmount.toString(),
  });
});

// =============================================================================
// Repay Event Handler (HOMEWORK)
// =============================================================================
ponder.on("PBALend:Repay", async ({ event, context }) => {
  const { loanToken, collateralToken, user, shares, amount } = event.args;
  const id = `${loanToken}-${collateralToken}-${user}`;

  const currentPosition = await context.db.borrowPosition.findUnique({ id });

  if (currentPosition) {
    const newAmount = currentPosition.amount - amount;
    const newShares = currentPosition.shares - shares;

    await context.db.borrowPosition.update({
      id,
      data: {
        amount: newAmount > BigInt(0) ? newAmount : BigInt(0),
        shares: newShares > BigInt(0) ? newShares : BigInt(0),
      },
    });
  }

  console.log("PBALend: Repay", {
    loanToken,
    collateralToken,
    user,
    shares: shares.toString(),
    amount: amount.toString(),
  });
});

// =============================================================================
// Withdraw Event Handler (HOMEWORK)
// =============================================================================
ponder.on("PBALend:Withdraw", async ({ event, context }) => {
  const { loanToken, collateralToken, user, amount, shares } = event.args;
  const id = `${loanToken}-${collateralToken}-${user}`;

  const currentPosition = await context.db.lendPosition.findUnique({ id });

  if (currentPosition) {
    const newAmount = currentPosition.amount - amount;
    const newShares = currentPosition.shares - shares;

    await context.db.lendPosition.update({
      id,
      data: {
        amount: newAmount > BigInt(0) ? newAmount : BigInt(0),
        shares: newShares > BigInt(0) ? newShares : BigInt(0),
      },
    });
  }

  console.log("PBALend: Withdraw", {
    loanToken,
    collateralToken,
    user,
    amount: amount.toString(),
    shares: shares.toString(),
  });
});

// =============================================================================
// WithdrawCollateral Event Handler (HOMEWORK)
// =============================================================================
ponder.on("PBALend:WithdrawCollateral", async ({ event, context }) => {
  const { loanToken, collateralToken, user, amount } = event.args;
  const id = `${loanToken}-${collateralToken}-${user}`;

  const currentPosition = await context.db.borrowPosition.findUnique({ id });

  if (currentPosition) {
    const newCollateralAmount = currentPosition.collateralAmount - amount;

    await context.db.borrowPosition.update({
      id,
      data: {
        collateralAmount: newCollateralAmount > BigInt(0) ? newCollateralAmount : BigInt(0),
      },
    });
  }

  console.log("PBALend: WithdrawCollateral", {
    loanToken,
    collateralToken,
    user,
    amount: amount.toString(),
  });
});
