import { GRAPHQL_ENDPOINT } from '@/config/contracts';

// Types for GraphQL responses
export interface Market {
  loanToken: string;
  collateralToken: string;
  interestRate: string;
  LTV: string;
}

export interface LendPosition {
  loanToken: string;
  collateralToken: string;
  user: string;
  amount: string;
  shares: string;
}

export interface BorrowPosition {
  loanToken: string;
  collateralToken: string;
  user: string;
  amount: string;
  shares: string;
  collateralAmount: string;
}

// GraphQL Queries
const GET_ALL_MARKETS_QUERY = `
query GetAllMarkets {
  markets {
    items {
      loanToken
      collateralToken
      interestRate
      LTV
    }
  }
}`;

const GET_LEND_POSITIONS_QUERY = `
query GetLendPositions($user: String!) {
  lendPositions(where: { user: $user }) {
    items {
      loanToken
      collateralToken
      user
      amount
      shares
    }
  }
}`;

const GET_BORROW_POSITIONS_QUERY = `
query GetBorrowPositions($user: String!) {
  borrowPositions(where: { user: $user }) {
    items {
      loanToken
      collateralToken
      user
      amount
      shares
      collateralAmount
    }
  }
}`;

// Fetch functions
export async function fetchMarkets(): Promise<Market[]> {
  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_ALL_MARKETS_QUERY,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (result.errors) {
      throw new Error('GraphQL errors: ' + result.errors.map((e: any) => e.message).join(', '));
    }

    return result.data?.markets?.items || [];
  } catch (error) {
    console.error('Error fetching markets:', error);
    return [];
  }
}

export async function fetchLendPositions(user: string): Promise<LendPosition[]> {
  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_LEND_POSITIONS_QUERY,
        variables: { user: user.toLowerCase() },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (result.errors) {
      throw new Error('GraphQL errors: ' + result.errors.map((e: any) => e.message).join(', '));
    }

    return result.data?.lendPositions?.items || [];
  } catch (error) {
    console.error('Error fetching lend positions:', error);
    return [];
  }
}

export async function fetchBorrowPositions(user: string): Promise<BorrowPosition[]> {
  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_BORROW_POSITIONS_QUERY,
        variables: { user: user.toLowerCase() },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (result.errors) {
      throw new Error('GraphQL errors: ' + result.errors.map((e: any) => e.message).join(', '));
    }

    return result.data?.borrowPositions?.items || [];
  } catch (error) {
    console.error('Error fetching borrow positions:', error);
    return [];
  }
}
