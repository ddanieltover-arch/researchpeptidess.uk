const SAMPLE_SORT_CODES = new Set(['20-00-00', '00-00-00', '000000']);
const SAMPLE_ACCOUNT_NUMBERS = new Set(['12345678', '89210044', '83920194']);
const SAMPLE_WALLET_FRAGMENTS = [
  'rpuklab99',
  'purepeptidesresearch',
  'purebritishpeptides',
  'your-wallet',
  'bc1q9v8084z65k90c7405g7620h5s9v65k8h8w3s92',
  '0x71c9d004663ac2517c0acfa669280de4f2be34ce',
  'tyd1b7mf3uvvqkr2x4k37d38z7nf3qlwn8',
];
const PLACEHOLDER_PAYMENT_PROOFS = new Set(['FPS-TRANSFER-PENDING', 'CRYPTO-TX-PENDING']);

export interface BankSettlementInstructions {
  configured: boolean;
  accountName: string;
  bankName: string;
  sortCode: string;
  accountNumber: string;
  iban?: string;
  bic?: string;
}

export interface CryptoSettlementInstructions {
  configured: boolean;
  network: 'BTC' | 'ETH' | 'USDT_TRC20';
  walletAddress: string;
}

export interface PublicSettlementSnapshot {
  bank: BankSettlementInstructions;
  crypto: CryptoSettlementInstructions;
}

function readOptionalEnv(name: string): string {
  try {
    if (typeof process !== 'undefined' && process.env && typeof process.env[name] === 'string') {
      return process.env[name]!.trim();
    }
  } catch {
    /* Client bundles may not expose Node process.env. */
  }
  return '';
}

function firstEnv(names: string[]): string {
  for (const name of names) {
    const value = readOptionalEnv(name);
    if (value) return value;
  }
  return '';
}

function isSampleWallet(address: string): boolean {
  const value = address.trim().toLowerCase();
  if (!value) return true;
  return SAMPLE_WALLET_FRAGMENTS.some((fragment) => value.includes(fragment));
}

/**
 * Public receiving details only. Sample/demo destinations are never treated as live.
 * Reads production env names from `.env.example` plus shorter aliases.
 */
export function getBankSettlementInstructions(): BankSettlementInstructions {
  const accountName = firstEnv(['BANK_TRANSFER_ACCOUNT_NAME', 'BANK_ACCOUNT_NAME', 'VITE_BANK_ACCOUNT_NAME']);
  const bankName = firstEnv(['BANK_TRANSFER_BANK_NAME', 'BANK_NAME', 'VITE_BANK_NAME']);
  const sortCode = firstEnv(['BANK_TRANSFER_SORT_CODE', 'BANK_SORT_CODE', 'VITE_BANK_SORT_CODE']);
  const accountNumber = firstEnv(['BANK_TRANSFER_ACCOUNT_NUMBER', 'BANK_ACCOUNT_NUMBER', 'VITE_BANK_ACCOUNT_NUMBER']);
  const iban = firstEnv(['BANK_TRANSFER_IBAN', 'BANK_IBAN']);
  const bic = firstEnv(['BANK_TRANSFER_BIC_SWIFT', 'BANK_BIC']);
  const configured = Boolean(
    accountName &&
      bankName &&
      sortCode &&
      accountNumber &&
      !SAMPLE_SORT_CODES.has(sortCode) &&
      !SAMPLE_ACCOUNT_NUMBERS.has(accountNumber)
  );

  if (!configured) {
    return {
      configured: false,
      accountName: '',
      bankName: '',
      sortCode: '',
      accountNumber: '',
    };
  }

  return {
    configured: true,
    accountName,
    bankName,
    sortCode,
    accountNumber,
    iban: iban || undefined,
    bic: bic || undefined,
  };
}

export function getCryptoSettlementInstructions(): CryptoSettlementInstructions {
  const walletAddress = firstEnv(['CRYPTO_BTC_WALLET_ADDRESS', 'CRYPTO_BTC_WALLET', 'VITE_CRYPTO_BTC_WALLET']);
  const configured = Boolean(walletAddress) && !isSampleWallet(walletAddress);
  if (!configured) {
    return {
      configured: false,
      network: 'BTC',
      walletAddress: '',
    };
  }
  return {
    configured: true,
    network: 'BTC',
    walletAddress,
  };
}

export function getPublicSettlementSnapshot(): PublicSettlementSnapshot {
  return {
    bank: getBankSettlementInstructions(),
    crypto: getCryptoSettlementInstructions(),
  };
}

export const UNCONFIGURED_SETTLEMENT: PublicSettlementSnapshot = {
  bank: { configured: false, accountName: '', bankName: '', sortCode: '', accountNumber: '' },
  crypto: { configured: false, network: 'BTC', walletAddress: '' },
};

export function normalizePaymentProofReference(raw?: string): string | undefined {
  const value = (raw || '').trim();
  if (!value) return undefined;
  if (PLACEHOLDER_PAYMENT_PROOFS.has(value.toUpperCase())) return undefined;
  return value;
}

export function isSampleBankDestination(sortCode: string, accountNumber: string): boolean {
  return SAMPLE_SORT_CODES.has(sortCode.trim()) || SAMPLE_ACCOUNT_NUMBERS.has(accountNumber.trim());
}
