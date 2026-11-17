import type { CountryPageContent } from '@/data/countries/types';

/**
 * The two India guides.
 *
 * The normal page covers a business below the GST registration threshold. The
 * GST page covers a registered business and the Rule 46 particulars, with one
 * GST total split into CGST + SGST or IGST for display.
 */
export const IN_INVOICE_PAGE: CountryPageContent = {
  guideId: 'in-invoice',
  meta: {
    title: 'India Invoice Generator',
    description:
      'Create an Indian invoice in INR with GST terms, a place of supply and an optional GSTIN. Print it or save it as a PDF, with no account and no uploads.',
    eyebrow: 'India invoice guide',
    intro:
      'An Indian invoice carries the supplier, the customer, a unique number and the amount. A business below the GST registration threshold does not charge GST; a registered business issues a GST tax invoice with the Rule 46 details.',
  },
  breadcrumbLabel: 'India invoice generator',
  documentName: 'Indian invoice',
  requirements: {
    title: 'What an Indian invoice must include',
    intro:
      'A normal commercial invoice needs the parties, the number, the date and the amount. Once the business is registered, Rule 46 adds the GSTIN, the place of supply, the HSN or SAC code and the tax split.',
    items: [
      'The supplier’s name and address, and the GSTIN where the business is registered.',
      'A consecutive invoice number and the date the invoice was issued.',
      'The customer’s name and address, and the customer GSTIN for a business sale.',
      'A description of the goods or services, the quantity and the price charged.',
      'The taxable value, the GST rate and amount, and the total including GST where registered.',
      'The place of supply and the HSN or SAC code on a GST tax invoice.',
    ],
  },
  changes: {
    title: 'What this page sets for you',
    intro:
      'The Indian defaults cover the fields a GST tax invoice needs. On the normal page they are optional, so a business below the threshold can still send a clear commercial invoice.',
    items: [
      {
        label: 'Country',
        value: 'India',
        note: 'The invoice uses Indian wording, INR and a 15 day default.',
      },
      {
        label: 'Currency',
        value: 'INR (₹)',
        note: 'Amounts use Indian digit grouping, so 1,00,000 reads as one lakh.',
      },
      {
        label: 'Tax name',
        value: 'GST',
        note: 'The 5% merit rate, the 18% standard rate and the 40% special rate apply from 22 September 2025.',
      },
      {
        label: 'Registration number',
        value: 'GSTIN',
        note: 'A 15 character number. It is optional here and required on the GST tax invoice page.',
      },
      {
        label: 'Place of supply',
        value: 'State or union territory',
        note: 'It decides whether the invoice shows CGST + SGST or IGST.',
      },
      {
        label: 'GST type',
        value: 'CGST + SGST or IGST',
        note: 'One GST total is computed and then split for display, so the printed parts add up.',
      },
      {
        label: 'HSN or SAC',
        value: 'Per line',
        note: 'The code is optional on a normal invoice and required on a GST tax invoice.',
      },
      {
        label: 'Signature line',
        value: 'Authorised signatory',
        note: 'Rule 46 asks for the signature of the supplier or an authorised representative.',
      },
    ],
  },
  rates: {
    title: 'GST rates and the registration thresholds',
    intro:
      'The rate structure changed on 22 September 2025. The 12% and 28% slabs were removed for most supplies, but the special rates for gold and rough diamonds remain.',
    items: [
      {
        label: 'Merit rate',
        rate: '5%',
        note: 'Many everyday goods and some services after the 2025 rationalisation.',
      },
      {
        label: 'Standard rate',
        rate: '18%',
        note: 'Most services and many goods, including most freelance and professional work.',
      },
      {
        label: 'Special rate',
        rate: '40%',
        note: 'Specified goods such as large cars, aerated drinks and, from 1 February 2026, pan masala and tobacco.',
      },
      {
        label: 'Gold, silver and jewellery',
        rate: '3%',
        note: 'A special rate for precious metals and jewellery, unchanged by the 2025 rationalisation.',
      },
      {
        label: 'Rough diamonds',
        rate: '0.25%',
        note: 'A special rate for rough diamonds, unchanged by the 2025 rationalisation.',
      },
      {
        label: 'Registration threshold, goods',
        rate: '₹40 lakh',
        note: 'For a supplier dealing exclusively in goods in most states and union territories.',
      },
      {
        label: 'Registration threshold, services',
        rate: '₹20 lakh',
        note: 'For services, or goods and services together. Some special category states have a lower limit.',
      },
    ],
    note: 'A composition dealer cannot issue a tax invoice and needs a bill of supply, which this tool does not print. Check the threshold and the scheme for your state before you register or invoice.',
  },
  scenario: {
    title: 'The example on this page',
    body: 'The example is a Mumbai design studio below the GST registration threshold, invoicing a consumer in Pune. The currency is INR, no line carries GST, and the invoice is a normal commercial invoice rather than a GST tax invoice.',
    points: [
      'The amounts are in INR and use Indian digit grouping.',
      'No GST is charged, because the example business is not registered.',
      'The place of supply is set to Maharashtra, but no split is shown because there is no GST.',
      'Use the GST invoice page when the business is registered and needs a tax invoice.',
    ],
  },
  notes: [
    'Registration is compulsory above ₹40 lakh of aggregate turnover for goods and ₹20 lakh for services in most states. Some special category states have lower limits.',
    'A composition dealer issues a bill of supply, not a tax invoice. That document type is outside this tool; use a normal invoice only if it matches your scheme.',
    'Print or PDF is not an e-invoice. An in-scope business needs an IRN from the Invoice Registration Portal and, where goods move, an e-way bill above ₹50,000.',
    'The tool validates the GSTIN format locally. It does not check that the number is registered, and it never sends the number anywhere.',
  ],
  faqs: [
    {
      question: 'Do I need a GSTIN to use this page?',
      answer:
        'No. The normal page is for a business below the registration threshold and leaves the GSTIN and the GST lines empty. A registered business should use the GST invoice page, where the GSTIN and the tax details are required.',
    },
    {
      question: 'What is a GSTIN?',
      answer:
        'A GSTIN is the 15 character registration number. It starts with the two digit state code, then a ten character PAN, the entity number, Z and a check digit. The tool checks the shape, not whether the number is active.',
    },
    {
      question: 'What is the place of supply?',
      answer:
        'The place of supply is the state or union territory where the supply is treated as made. It decides whether an invoice carries CGST + SGST for an intra-state supply or IGST for an inter-state supply.',
    },
    {
      question: 'What is the difference between CGST, SGST and IGST?',
      answer:
        'CGST is the central share and SGST is the state share of a supply inside one state. IGST is the integrated tax on an inter-state supply. The total GST is the same; only the way it is shown changes.',
    },
    {
      question: 'Is 40% the GST rate on services?',
      answer:
        'No. The 40% rate is for specified goods such as large cars, aerated drinks and tobacco products. Most services are 18%, and the 5% merit rate covers many everyday goods.',
    },
    {
      question: 'Can I use this as an e-invoice?',
      answer:
        'No. The printed or PDF document is not an e-invoice. A business above the e-invoicing threshold must report the invoice to the Invoice Registration Portal and obtain an IRN. An e-way bill may also be needed when goods move.',
    },
  ],
  sourceIds: ['in-gst-rates', 'in-registration', 'in-rule-46', 'in-einvoice', 'in-eway'],
  related: [
    {
      label: 'GST invoice generator',
      href: '/in/gst-invoice-generator/',
      note: 'The registered business version with GSTIN, place of supply and the GST split.',
    },
    {
      label: 'UAE VAT invoice generator',
      href: '/ae/vat-invoice-generator/',
      note: 'AED, a supplier TRN and the UAE e-invoicing boundary.',
    },
    {
      label: 'Swiss VAT invoice generator',
      href: '/ch/vat-invoice-generator/',
      note: 'A CHF invoice with the CHE number and 8.1% MWST.',
    },
    {
      label: 'VAT, GST and sales tax calculator',
      href: '/calculators/vat-gst-sales-tax-calculator/',
      note: 'Check a GST inclusive or exclusive figure before you type it.',
    },
  ],
};

export const IN_GST_INVOICE_PAGE: CountryPageContent = {
  guideId: 'in-gst-invoice',
  meta: {
    title: 'GST Invoice Generator',
    description:
      'Create an Indian GST tax invoice with a GSTIN, place of supply, HSN or SAC codes and one GST total split into CGST + SGST or IGST. Print or save as PDF.',
    eyebrow: 'India GST invoice',
    intro:
      'A GST tax invoice follows Rule 46. This page sets the TAX INVOICE title, makes the GSTIN, the customer GSTIN, the place of supply and the HSN or SAC code required, and shows one GST total as CGST + SGST or IGST.',
  },
  breadcrumbLabel: 'India GST invoice generator',
  documentName: 'GST tax invoice',
  requirements: {
    title: 'What a GST tax invoice must show',
    intro:
      'Rule 46 of the CGST Rules lists the particulars. The invoice must identify the supplier and the recipient, the supply and the tax, and it must carry the supplier’s GSTIN.',
    items: [
      'The supplier’s name, address and GSTIN.',
      'A consecutive serial number of up to sixteen characters, unique for the financial year.',
      'The date the invoice was issued.',
      'The recipient’s name, address and GSTIN where the recipient is registered.',
      'The HSN code for goods or the SAC code for services, and the description of the supply.',
      'The taxable value, the GST rate and amount, and the place of supply for an inter-state supply.',
      'The signature or digital signature of the supplier or an authorised representative.',
    ],
  },
  changes: {
    title: 'What turning on GST invoice mode changes',
    intro:
      'The GST page is already in tax invoice mode, so the Rule 46 fields and the split summary are part of the sheet from the first screen.',
    items: [
      {
        label: 'Sheet title',
        value: 'TAX INVOICE',
        note: 'The Indian tax invoice carries its own title, so the customer can see it is a GST document.',
      },
      {
        label: 'Your GSTIN',
        value: 'Required',
        note: 'The form will not print until the 15 character GSTIN is filled in.',
      },
      {
        label: 'Customer GSTIN',
        value: 'Required for B2B',
        note: 'A business customer needs the GSTIN on the invoice. Leave it blank for a consumer sale and check the wording.',
      },
      {
        label: 'Place of supply',
        value: 'Required',
        note: 'The state or union territory decides whether the invoice shows CGST + SGST or IGST.',
      },
      {
        label: 'HSN or SAC',
        value: 'Required per line',
        note: 'A GST tax invoice identifies the supply by its HSN or SAC code.',
      },
      {
        label: 'GST split',
        value: 'CGST + SGST or IGST',
        note: 'One GST total is computed on the taxable value and then split for display, so the printed parts add back exactly.',
      },
      {
        label: 'Signature line',
        value: 'Included',
        note: 'Rule 46 asks for the supplier’s or an authorised representative’s signature.',
      },
    ],
  },
  rates: {
    title: 'GST rates and the split',
    intro:
      'The line rate is the total GST. The split only changes how that total is displayed: CGST and SGST are two equal halves, and IGST is the whole amount.',
    items: [
      {
        label: 'Merit rate',
        rate: '5%',
        note: 'Shown as CGST 2.5% + SGST 2.5% intra-state, or IGST 5% inter-state.',
      },
      {
        label: 'Standard rate',
        rate: '18%',
        note: 'Shown as CGST 9% + SGST 9% intra-state, or IGST 18% inter-state. This is the usual rate for services.',
      },
      {
        label: 'Special rate',
        rate: '40%',
        note: 'Shown as CGST 20% + SGST 20% intra-state, or IGST 40% inter-state, for the specified goods that carry it.',
      },
      {
        label: 'Gold, silver and jewellery',
        rate: '3%',
        note: 'Shown as CGST 1.5% + SGST 1.5% intra-state, or IGST 3% inter-state.',
      },
      {
        label: 'Rough diamonds',
        rate: '0.25%',
        note: 'Shown as CGST 0.125% + SGST 0.125% intra-state, or IGST 0.25% inter-state.',
      },
    ],
    note: 'The rate stays the total GST on the line. Only the summary splits it, and the split uses a largest-remainder allocation so an odd cent still adds back to the total GST.',
  },
  scenario: {
    title: 'The example on this page',
    body: 'The example is a Bengaluru consultancy invoicing a Karnataka customer. The taxable value is ₹85,000.00 at 18%, so the GST is ₹15,300.00 and the total is ₹1,00,300.00. The intra-state split shows CGST 9% and SGST 9%, each ₹7,650.00.',
    points: [
      'The place of supply is Karnataka, so the sheet shows CGST + SGST.',
      'The line rate stays 18%; the split creates the two 9% rows in the summary.',
      'The two tax rows add back to ₹15,300.00, and the total is ₹1,00,300.00.',
      'Switch the GST type to IGST for a customer in another state. The total GST does not change.',
    ],
  },
  notes: [
    'One GST is computed on the taxable value and then split for display. This keeps the printed CGST, SGST or IGST adding back to the total without a per-component rounding drift.',
    'A composition dealer cannot issue a tax invoice and needs a bill of supply. That document is outside this tool, so check your scheme before using this page.',
    'Print or PDF is not an e-invoice. A business above the e-invoicing threshold must obtain an IRN from the Invoice Registration Portal, and an e-way bill is required for goods above ₹50,000.',
    'The GSTIN and HSN or SAC checks are local format checks. The tool never calls the GST portal and never verifies that a registration is active.',
  ],
  faqs: [
    {
      question: 'When do I use CGST + SGST and when do I use IGST?',
      answer:
        'Use CGST + SGST for an intra-state supply, where the supplier and the place of supply are in the same state or union territory. Use IGST for an inter-state supply. The total GST rate is the same; only the split differs.',
    },
    {
      question: 'Why does the line still say 18% when the summary says 9%?',
      answer:
        'The line rate is the total GST charged on the supply. The summary divides it for display: CGST 9% and SGST 9% are the two halves of the same 18%. The two rows add back to the line’s tax amount.',
    },
    {
      question: 'What is the place of supply?',
      answer:
        'It is the state or union territory where the supply is treated as made. For a service, it usually follows the recipient’s location for a registered business. It decides whether the invoice is intra-state or inter-state.',
    },
    {
      question: 'Is the customer GSTIN always required?',
      answer:
        'It is required for a registered business customer, because the invoice supports their input tax credit. A consumer sale does not have a GSTIN. The field is required in this page’s B2B example; leave it blank only when the customer is not registered.',
    },
    {
      question: 'Do I need an HSN or SAC code?',
      answer:
        'Rule 46 asks for the HSN code for goods or the SAC code for services. The number of digits required depends on turnover and the notified class of supplier. This page accepts 2 to 8 digits and requires the field on a GST tax invoice.',
    },
    {
      question: 'When is e-invoicing mandatory?',
      answer:
        'For registered businesses above the prescribed aggregate turnover, currently ₹5 crore in any financial year from 2017-18 onwards. An in-scope invoice must be reported to the Invoice Registration Portal and carry an IRN.',
    },
    {
      question: 'Can I use this for a composition dealer?',
      answer:
        'No. A composition dealer issues a bill of supply rather than a tax invoice. This tool prints a tax invoice, so use it only when you are registered under the normal scheme and entitled to charge GST.',
    },
  ],
  sourceIds: ['in-rule-46', 'in-gst-rates', 'in-registration', 'in-einvoice', 'in-eway'],
  related: [
    {
      label: 'India invoice generator',
      href: '/in/invoice-generator/',
      note: 'The non-registered version with no GST and no GSTIN requirement.',
    },
    {
      label: 'UAE VAT invoice generator',
      href: '/ae/vat-invoice-generator/',
      note: 'AED, a supplier TRN and 5% VAT.',
    },
    {
      label: 'Swiss VAT invoice generator',
      href: '/ch/vat-invoice-generator/',
      note: 'A CHF invoice with the CHE number and 8.1% MWST.',
    },
    {
      label: 'VAT, GST and sales tax calculator',
      href: '/calculators/vat-gst-sales-tax-calculator/',
      note: 'Check a GST inclusive or exclusive figure before you type it.',
    },
  ],
};
