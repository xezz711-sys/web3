import { ponder } from "@/generated";
import * as schema from "../ponder.schema";

// =============================================================================
// MarketCreated Event Handler
// =============================================================================
ponder.on("PBALend:MarketCreated", async ({ event, context }) => {
  const { loanToken, collateralToken, interestRate, LTV } = event.args;

  await context.db.insert(schema.market).values({
    loanToken,
    collateralToken,
    interestRate,
    LTV,
  }).onConflictDoNothing();

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

  const currentPosition = await context.db.find(schema.lendPosition, {
    loanToken,
    collateralToken,
    user,
  });

  if (!currentPosition) {
    // Insert new position
    await context.db.insert(schema.lendPosition).values({
      loanToken,
      collateralToken,
      user,
      amount,
      shares,
    }).onConflictDoNothing();
  } else {
    // Update existing position
    await context.db.update(schema.lendPosition, {
      loanToken,
      collateralToken,
      user,
    }).set({
      amount: currentPosition.amount + amount,
      shares: currentPosition.shares + shares,
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

  const currentPosition = await context.db.find(schema.borrowPosition, {
    loanToken,
    collateralToken,
    user,
  });

  if (!currentPosition) {
    // Insert new position
    await context.db.insert(schema.borrowPosition).values({
      loanToken,
      collateralToken,
      user,
      amount,
      shares,
      collateralAmount,
    }).onConflictDoNothing();
  } else {
    // Update existing position
    await context.db.update(schema.borrowPosition, {
      loanToken,
      collateralToken,
      user,
    }).set({
      amount: currentPosition.amount + amount,
      shares: currentPosition.shares + shares,
      collateralAmount: currentPosition.collateralAmount + collateralAmount,
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

  const currentPosition = await context.db.find(schema.borrowPosition, {
    loanToken,
    collateralToken,
    user,
  });

  if (currentPosition) {
    // Decrease borrow position
    const newAmount = currentPosition.amount - amount;
    const newShares = currentPosition.shares - shares;

    if (newShares <= BigInt(0)) {
      // Position fully repaid - could delete or set to zero
      await context.db.update(schema.borrowPosition, {
        loanToken,
        collateralToken,
        user,
      }).set({
        amount: BigInt(0),
        shares: BigInt(0),
      });
    } else {
      await context.db.update(schema.borrowPosition, {
        loanToken,
        collateralToken,
        user,
      }).set({
        amount: newAmount > BigInt(0) ? newAmount : BigInt(0),
        shares: newShares,
      });
    }
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

  const currentPosition = await context.db.find(schema.lendPosition, {
    loanToken,
    collateralToken,
    user,
  });

  if (currentPosition) {
    // Decrease lend position
    const newAmount = currentPosition.amount - amount;
    const newShares = currentPosition.shares - shares;

    if (newShares <= BigInt(0)) {
      // Position fully withdrawn
      await context.db.update(schema.lendPosition, {
        loanToken,
        collateralToken,
        user,
      }).set({
        amount: BigInt(0),
        shares: BigInt(0),
      });
    } else {
      await context.db.update(schema.lendPosition, {
        loanToken,
        collateralToken,
        user,
      }).set({
        amount: newAmount > BigInt(0) ? newAmount : BigInt(0),
        shares: newShares,
      });
    }
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

  const currentPosition = await context.db.find(schema.borrowPosition, {
    loanToken,
    collateralToken,
    user,
  });

  if (currentPosition) {
    // Decrease collateral amount
    const newCollateralAmount = currentPosition.collateralAmount - amount;

    await context.db.update(schema.borrowPosition, {
      loanToken,
      collateralToken,
      user,
    }).set({
      collateralAmount: newCollateralAmount > BigInt(0) ? newCollateralAmount : BigInt(0),
    });
  }

  console.log("PBALend: WithdrawCollateral", {
    loanToken,
    collateralToken,
    user,
    amount: amount.toString(),
  });
});
