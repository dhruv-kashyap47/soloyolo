import { z } from 'zod';

import { CURRENCIES } from '@/lib/formatting/currency';
import { TAX_ID_LABELS } from '@/lib/generators/document';
import { MAX_STORED_LOGO_CHARS } from '@/lib/storage/logo';
import { PROFILE_VERSION, type BusinessProfile } from '@/lib/storage/profile';

/**
 * The saved business profile, written down in Zod.
 *
 * Zod never reaches the browser bundle: this schema is used by the build and
 * by the tests, while the browser reads and writes the profile through the
 * hand written parser in `profile.ts`. A unit test runs both over the same
 * fixtures so the two contracts cannot drift apart.
 */

const logoSchema = z
  .string()
  .max(MAX_STORED_LOGO_CHARS)
  .refine(
    (value) => value === '' || /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value),
    { message: 'Expected a PNG, JPEG or WebP data URL.' },
  );

export const businessProfileSchema = z.object({
  version: z.literal(PROFILE_VERSION),
  businessName: z.string().max(600),
  address: z.string().max(600),
  email: z.string().max(600),
  phone: z.string().max(600),
  website: z.string().max(600),
  taxId: z.string().max(600),
  taxIdLabel: z.enum(TAX_ID_LABELS.map((label) => label)),
  logoDataUrl: logoSchema,
  defaultNotes: z.string().max(600),
  currency: z.enum(CURRENCIES.map((currency) => currency.code)),
  updatedAt: z.string().max(64),
});

export type BusinessProfileShape = z.infer<typeof businessProfileSchema>;

/** Throws when a profile does not match the contract. Used at build time. */
export function assertBusinessProfile(profile: BusinessProfile): void {
  const result = businessProfileSchema.safeParse(profile);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid business profile: ${issues}`);
  }
}
