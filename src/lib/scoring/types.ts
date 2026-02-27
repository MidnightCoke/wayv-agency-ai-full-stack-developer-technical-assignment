/**
 * Runtime types for Prisma Json fields shared across scoring and prompt modules.
 * Prisma stores these as `Json`, so we cast with `as unknown as T` at the call site.
 */

export interface BudgetRange {
  minFollowers: number;
  maxFollowers: number;
}

export interface GenderSplit {
  female: number;
  male: number;
}

export interface Audience {
  topCountries: string[];
  genderSplit: GenderSplit;
  topAgeRange: string;
}
