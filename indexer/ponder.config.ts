import { createConfig } from "@ponder/core";
import { http } from "viem";

import { PBALendAbi } from "./abis/PBALend";

export default createConfig({
  networks: {
    sepolia: {
      chainId: 11155111,
      transport: http(process.env.RPC_URL),
    },
  },
  contracts: {
    PBALend: {
      network: "sepolia",
      abi: PBALendAbi,
      address: process.env.PBA_LEND as `0x${string}`,
      startBlock: Number(process.env.START_BLOCK) || 0,
    },
  },
  database: {
    kind: "postgres",
    connectionString: process.env.DATABASE_URL,
    schema: process.env.DATABASE_SCHEMA,
  },
});

