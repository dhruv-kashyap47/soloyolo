import { z } from 'zod';

import type { CountryConfig } from '@/lib/countries/types';
import { CURRENCIES } from '@/lib/formatting/currency';
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

const taxIdFormatSchema = z.enum(['none', 'gstin', 'trn', 'de-vat', 'ch-mwst']);

const customerTaxIdSchema = z.object({
  label: z.enum(TAX_ID_LABELS),
  required: z.boolean(),
  hint: z.string().min(30),
  placeholder: z.string().min(3),
  format: taxIdFormatSchema,
});

const crossBorderSchema = z.object({
  value: z.string().min(2),
  label: z.string().min(4),
  hint: z.string().min(30),
  endorsement: z.string().min(10),
  zeroRated: z.boolean(),
  customerTaxIdRequired: z.boolean().optional(),
  customerTaxIdLabel: z.string().min(4).optional(),
  customerTaxIdHint: z.string().min(30).optional(),
  customerTaxIdPlaceholder: z.string().min(3).optional(),
  customerTaxIdPrintedLabel: z.string().min(3).optional(),
  hidesPlaceOfSupply: z.boolean().optional(),
  supplierTaxIdLabel: z.enum(TAX_ID_LABELS).optional(),
});

const placeOfSupplySchema = z.object({
  label: z.string().min(3),
  required: z.boolean(),
  hint: z.string().min(30),
  options: z.array(z.object({ value: z.string().min(1), label: z.string().min(3) })).min(1),
});

const taxSplitSchema = z.object({
  label: z.string().min(3),
  hint: z.string().min(30),
  modes: z
    .array(
      z.object({
        id: z.enum(['cgst-sgst', 'igst']),
        label: z.string().min(3),
        parts: z.array(z.string().min(2)).min(1).max(2),
      }),
    )
    .min(1),
  default: z.enum(['cgst-sgst', 'igst']),
});

const signatureLineSchema = z.object({
  label: z.string().min(3),
  note: z.string().min(20),
});

const hsnCodeSchema = z.object({
  label: z.string().min(2),
  requiredOnTaxInvoice: z.boolean(),
  hint: z.string().min(30),
  placeholder: z.string().min(2),
});

const taxSchema = z.object({
  name: z.string().min(2),
  label: z.enum(TAX_LABELS),
  labels: z.array(z.enum(TAX_LABELS)).min(1),
  registrationLabel: z.enum(TAX_ID_LABELS),
  registrationLabels: z.array(z.enum(TAX_ID_LABELS)).min(1),
  registrationFormat: taxIdFormatSchema,
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
  registrationRequiredOnAllInvoices: z.boolean(),
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
  noVatNote: z.string().min(10).optional(),
  notes: z.string().min(3),
  numberPrefix: z.string().min(2).max(6),
  documentTitle: z.string().min(4),
  numberMaxLength: z.number().int().positive().max(100).optional(),
  customerTaxId: customerTaxIdSchema.optional(),
  crossBorder: z.array(crossBorderSchema).min(1).max(3).optional(),
  crossBorderLabel: z.string().min(10).optional(),
  placeOfSupply: placeOfSupplySchema.optional(),
  taxSplit: taxSplitSchema.optional(),
  signatureLine: signatureLineSchema.optional(),
  hsnCode: hsnCodeSchema.optional(),
  taxIdPlaceholder: z.string().min(3),
  businessAddressPlaceholder: z.string().min(3),
  customerAddressPlaceholder: z.string().min(3),
  paymentDetailsPlaceholder: z.string().min(3),
});

export const countryConfigSchema = z
  .object({
    code: z.enum(['US', 'UK', 'CA', 'AU', 'DE', 'CH', 'IN', 'AE']),
    name: z.string().min(2),
    shortName: z.string().min(2),
    adjective: z.string().min(2),
    currency: z.enum(CURRENCIES.map((currency) => currency.code)),
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

    if (config.tax.registrationRequiredOnAllInvoices && !config.tax.registrationRequired) {
      context.addIssue({
        code: 'custom',
        path: ['tax', 'registrationRequiredOnAllInvoices'],
        message: 'A number required on every invoice must also be marked required.',
      });
    }

    if (config.invoice.taxSplit) {
      const { modes, default: defaultMode } = config.invoice.taxSplit;
      if (!modes.some((mode) => mode.id === defaultMode)) {
        context.addIssue({
          code: 'custom',
          path: ['invoice', 'taxSplit', 'default'],
          message: 'The default split must be one of the modes.',
        });
      }

      if (new Set(modes.map((mode) => mode.id)).size !== modes.length) {
        context.addIssue({
          code: 'custom',
          path: ['invoice', 'taxSplit', 'modes'],
          message: 'Tax split mode ids must be unique.',
        });
      }
    }

    if (config.invoice.placeOfSupply) {
      const values = config.invoice.placeOfSupply.options.map((option) => option.value);
      if (new Set(values).size !== values.length) {
        context.addIssue({
          code: 'custom',
          path: ['invoice', 'placeOfSupply', 'options'],
          message: 'Place of supply values must be unique.',
        });
      }
    }

    if (config.invoice.crossBorder) {
      const values = config.invoice.crossBorder.map((option) => option.value);
      if (new Set(values).size !== values.length) {
        context.addIssue({
          code: 'custom',
          path: ['invoice', 'crossBorder'],
          message: 'Cross-border option values must be unique.',
        });
      }

      if (config.invoice.crossBorder.length > 0 && !config.invoice.crossBorderLabel) {
        context.addIssue({
          code: 'custom',
          path: ['invoice', 'crossBorderLabel'],
          message: 'A cross-border control needs a label.',
        });
      }

      for (const option of config.invoice.crossBorder) {
        if (option.customerTaxIdRequired && !option.customerTaxIdLabel) {
          context.addIssue({
            code: 'custom',
            path: ['invoice', 'crossBorder'],
            message: 'A required customer tax number needs a label.',
          });
        }
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
