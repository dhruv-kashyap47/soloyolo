import { z } from 'zod';

import type { CountryConfig } from '@/lib/countries/types';
import { TAX_ID_LABELS, TAX_LABELS } from '@/lib/generators/document';

/**
 * The country configuration, written down in Zod.
 *
 * Zod stays in the build and the tests. The browser reads the same plain
 * objects through `lib/countries`, so a tax claim or a rate is never validated
 * by a schema that shipped to the visitor.
 */

const isoDate = z.iso.date();
const httpsUrl = z.url().startsWith('https://');

const sourceSchema = z.object({
  id: z.string().min(3),
  label: z.string().min(8),
  url: httpsUrl,
  note: z.string().min(30),
});

const rateSchema = z.object({
  label: z.string().min(2),
  ratePercent: z
    .string()
    .regex(/^\d+(\.\d+)?$/)
    .nullable(),
  note: z.string().min(20),
});

const taxSchema = z.object({
  name: z.string().min(2),
  label: z.enum(TAX_LABELS),
  labels: z.array(z.enum(TAX_LABELS)).min(1),
  registrationLabel: z.enum(TAX_ID_LABELS),
  registrationLabels: z.array(z.enum(TAX_ID_LABELS)).min(1),
  registrationExample: z.string().min(3),
  registrationFormatNote: z.string().min(30),
  standardRatePercent: z.string().regex(/^\d+(\.\d+)?$/),
  rates: z.array(rateSchema).min(1),
  rateHint: z.string().min(30),
  supportsTaxInvoice: z.boolean(),
  taxInvoiceLabel: z.string(),
  taxInvoiceHint: z.string(),
  taxInvoiceTitle: z.string().min(4),
  registrationRequired: z.boolean(),
  registrationRequiredOver: z.number().positive().nullable(),
  customerAddressRequired: z.boolean(),
  supplierAddressRequired: z.boolean(),
  supplyDateField: z.boolean(),
  paymentTermsRequiredOver: z.number().positive().nullable(),
});

const invoiceSchema = z.object({
  dueDays: z.number().int().positive().max(365),
  paymentTerms: z.string().min(3),
  paymentDetails: z.string().min(3),
  notes: z.string().min(3),
  numberPrefix: z.string().min(2).max(6),
  taxIdPlaceholder: z.string().min(3),
  businessAddressPlaceholder: z.string().min(3),
  customerAddressPlaceholder: z.string().min(3),
  paymentDetailsPlaceholder: z.string().min(3),
});

export const countryConfigSchema = z
  .object({
    code: z.enum(['US', 'UK', 'CA', 'AU']),
    name: z.string().min(2),
    shortName: z.string().min(2),
    adjective: z.string().min(2),
    currency: z.enum(['USD', 'GBP', 'CAD', 'AUD']),
    tax: taxSchema,
    invoice: invoiceSchema,
    sources: z.array(sourceSchema).min(2),
    verifiedOn: isoDate,
  })
  .superRefine((config, context) => {
    if (!config.tax.labels.includes(config.tax.label)) {
      context.addIssue({
        code: 'custom',
        path: ['tax', 'label'],
        message: 'The default tax label must be one of the tax labels.',
      });
    }

    if (!config.tax.registrationLabels.includes(config.tax.registrationLabel)) {
      context.addIssue({
        code: 'custom',
        path: ['tax', 'registrationLabel'],
        message: 'The default registration label must be one of the registration labels.',
      });
    }

    if (config.tax.supportsTaxInvoice) {
      if (config.tax.taxInvoiceLabel.trim() === '' || config.tax.taxInvoiceHint.trim() === '') {
        context.addIssue({
          code: 'custom',
          path: ['tax', 'taxInvoiceLabel'],
          message: 'A tax invoice mode needs a label and a hint.',
        });
      }
    }

    const sourceIds = config.sources.map((source) => source.id);
    if (new Set(sourceIds).size !== sourceIds.length) {
      context.addIssue({
        code: 'custom',
        path: ['sources'],
        message: 'Source ids must be unique within a country.',
      });
    }
  });

/** Throws when a country config does not match the contract. */
export function assertCountryConfig(country: CountryConfig): void {
  const result = countryConfigSchema.safeParse(country);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid ${country.code} country config: ${issues}`);
  }
}

export function assertCountryConfigs(countries: readonly CountryConfig[]): void {
  const codes = countries.map((country) => country.code);
  if (new Set(codes).size !== codes.length) {
    throw new Error('Country codes must be unique.');
  }

  const currencies = countries.map((country) => country.currency);
  if (new Set(currencies).size !== currencies.length) {
    throw new Error('Each country must have its own currency in this product.');
  }

  countries.forEach(assertCountryConfig);
}
