import type { TagColor } from '@/components/ui';
import type { AccountType } from '@/types/db';

/** Single source of truth for how an account type is named and coloured. */
export const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  backtest: 'Backtest',
  demo: 'Demo',
  eval: 'Eval',
  funded: 'Funded',
  live: 'Live',
};

// Colour rises with how real the money is: grey → blue → amber → teal → green.
export const ACCOUNT_TYPE_COLOR: Record<AccountType, TagColor> = {
  backtest: 'gray',
  demo: 'blue',
  eval: 'amber',
  funded: 'teal',
  live: 'green',
};

export const ACCOUNT_TYPES: AccountType[] = ['backtest', 'demo', 'eval', 'funded', 'live'];
