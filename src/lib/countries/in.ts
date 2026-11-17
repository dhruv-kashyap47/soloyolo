import type { CountryConfig } from '@/lib/countries/types';

/**
 * India: GST at 5% merit, 18% standard and 40% for specified goods, plus the
 * 0%, 3% and 0.25% special rates, effective 22 September 2025. A GST tax
 * invoice follows Rule 46: the GSTIN, a serial number of up to sixteen
 * characters, the place of supply, the HSN or SAC code and the CGST + SGST or
 * IGST split.
 *
 * The GST is computed once on the taxable value and then split for display.
 * The printed CGST, SGST or IGST always adds back to the total.
 *
 * Sources checked 2026-11-17.
 */
export const IN: CountryConfig = {
  code: 'IN',
  name: 'India',
  shortName: 'India',
  adjective: 'Indian',
  currency: 'INR',
  tax: {
    name: 'GST',
    label: 'GST',
    labels: ['GST'],
    registrationLabel: 'GSTIN',
    registrationLabels: ['GSTIN'],
    registrationFormat: 'gstin',
    registrationExample: '29ABCDE1234F1Z5',
    registrationFormatNote:
      'A GSTIN is 15 characters: the two digit state code, a ten character PAN, the entity number, Z and a check digit.',
    standardRatePercent: '18',
    rates: [
      {
        label: 'Merit rate',
        ratePercent: '5',
        note: 'Many everyday goods and some services under the rate structure effective 22 September 2025.',
      },
      {
        label: 'Standard rate',
        ratePercent: '18',
        note: 'Most services and many goods. This is the usual rate for a freelance or professional invoice.',
      },
      {
        label: 'Special rate',
        ratePercent: '40',
        note: 'Specified goods such as large cars, aerated drinks and, from 1 February 2026, pan masala and tobacco. It is not the usual rate for services.',
      },
      {
        label: 'Gold, silver and jewellery',
        ratePercent: '3',
        note: 'A special rate for precious metals and jewellery, unchanged by the 2025 rationalisation.',
      },
      {
        label: 'Rough diamonds',
        ratePercent: '0.25',
        note: 'A special rate for rough diamonds, unchanged by the 2025 rationalisation.',
      },
      {
        label: 'Nil or exempt',
        ratePercent: '0',
        note: 'Exempt and nil-rated supplies, including several food items and individual life and health insurance policies.',
      },
    ],
    rateHint:
      'Most services are 18%. The 5% merit rate applies to many everyday goods, and 40% is reserved for specified goods, not most services. Special rates of 3% and 0.25% remain for gold and rough diamonds.',
    supportsTaxInvoice: true,
    taxInvoiceLabel: 'Print this as a GST tax invoice',
    taxInvoiceHint:
      'Prints TAX INVOICE and makes your GSTIN, the place of supply and the HSN/SAC code required. The customer GSTIN is needed for a registered customer.',
    taxInvoiceTitle: 'TAX INVOICE',
    registrationRequired: true,
    registrationRequiredOnAllInvoices: false,
    registrationRequiredOver: null,
    customerAddressRequired: true,
    supplierAddressRequired: true,
    supplyDateField: false,
    paymentTermsRequiredOver: null,
  },
  invoice: {
    dueDays: 15,
    paymentTerms: 'Due within 15 days',
    paymentDetails:
      'Bank transfer\nAccount name: Example Studio\nAccount number: 000000000000\nIFSC: XXXX0000000',
    notes: 'Thank you for your business.',
    numberPrefix: 'INV',
    documentTitle: 'INVOICE',
    numberMaxLength: 16,
    customerTaxId: {
      label: 'GSTIN',
      required: false,
      hint: 'The customer GSTIN for a business sale (B2B). Leave it blank for a consumer sale (B2C).',
      placeholder: '29ABCDE1234F1Z5',
      format: 'gstin',
    },
    placeOfSupply: {
      label: 'Place of supply',
      required: true,
      hint: 'The state or union territory where the supply is made. It decides whether the invoice shows CGST + SGST or IGST.',
      options: [
        { value: '01', label: '01 - Jammu and Kashmir' },
        { value: '02', label: '02 - Himachal Pradesh' },
        { value: '03', label: '03 - Punjab' },
        { value: '04', label: '04 - Chandigarh' },
        { value: '05', label: '05 - Uttarakhand' },
        { value: '06', label: '06 - Haryana' },
        { value: '07', label: '07 - Delhi' },
        { value: '08', label: '08 - Rajasthan' },
        { value: '09', label: '09 - Uttar Pradesh' },
        { value: '10', label: '10 - Bihar' },
        { value: '11', label: '11 - Sikkim' },
        { value: '12', label: '12 - Arunachal Pradesh' },
        { value: '13', label: '13 - Nagaland' },
        { value: '14', label: '14 - Manipur' },
        { value: '15', label: '15 - Mizoram' },
        { value: '16', label: '16 - Tripura' },
        { value: '17', label: '17 - Meghalaya' },
        { value: '18', label: '18 - Assam' },
        { value: '19', label: '19 - West Bengal' },
        { value: '20', label: '20 - Jharkhand' },
        { value: '21', label: '21 - Odisha' },
        { value: '22', label: '22 - Chhattisgarh' },
        { value: '23', label: '23 - Madhya Pradesh' },
        { value: '24', label: '24 - Gujarat' },
        { value: '26', label: '26 - Dadra and Nagar Haveli and Daman and Diu' },
        { value: '27', label: '27 - Maharashtra' },
        { value: '29', label: '29 - Karnataka' },
        { value: '30', label: '30 - Goa' },
        { value: '31', label: '31 - Lakshadweep' },
        { value: '32', label: '32 - Kerala' },
        { value: '33', label: '33 - Tamil Nadu' },
        { value: '34', label: '34 - Puducherry' },
        { value: '35', label: '35 - Andaman and Nicobar Islands' },
        { value: '36', label: '36 - Telangana' },
        { value: '37', label: '37 - Andhra Pradesh' },
        { value: '38', label: '38 - Ladakh' },
      ],
    },
    taxSplit: {
      label: 'GST type',
      hint: 'CGST + SGST for a supply inside one state or union territory; IGST for a supply across states.',
      modes: [
        { id: 'cgst-sgst', label: 'CGST + SGST (intra-state)', parts: ['CGST', 'SGST'] },
        { id: 'igst', label: 'IGST (inter-state)', parts: ['IGST'] },
      ],
      default: 'cgst-sgst',
    },
    hsnCode: {
      label: 'HSN/SAC',
      requiredOnTaxInvoice: true,
      hint: 'The HSN code for goods or the SAC code for services. Rule 46 asks for it on a GST tax invoice.',
      placeholder: '998314',
    },
    signatureLine: {
      label: 'Authorised signatory',
      note: 'Signature of the supplier or an authorised representative.',
    },
    taxIdPlaceholder: '29ABCDE1234F1Z5',
    businessAddressPlaceholder: 'Example Tech Park, 3rd Floor\nWhitefield, Bengaluru 560066',
    customerAddressPlaceholder: 'Example Towers\nMG Road, Bengaluru 560001',
    paymentDetailsPlaceholder:
      'Bank transfer\nAccount name: Example Studio\nAccount number: 000000000000\nIFSC: XXXX0000000',
  },
  sources: [
    {
      id: 'in-gst-rates',
      label: 'GST Council: 56th meeting recommendations',
      url: 'https://gstcouncil.gov.in/sites/default/files/2025-09/press_release_press_information_bureau.pdf',
      note: 'The 5% merit rate, 18% standard rate and 40% special rate, effective 22 September 2025, with the phased treatment of pan masala and tobacco.',
    },
    {
      id: 'in-rule-46',
      label: 'CBIC: CGST Rules, Rule 46 (tax invoice)',
      url: 'https://taxinformation.cbic.gov.in/content/html/tax_repository/gst/rules/cgst_rules/active/chapter6/rule46_v1.00.html',
      note: 'The tax invoice particulars: GSTIN, a serial number of up to sixteen characters, HSN or SAC, the place of supply, the tax rate and the signature.',
    },
    {
      id: 'in-registration',
      label: 'CBIC: CGST Act, section 22 (registration)',
      url: 'https://taxinformation.cbic.gov.in/content/html/tax_repository/gst/acts/2017_CGST_act/active/chapter6/section22_v1.00.html',
      note: 'The registration thresholds: ₹20 lakh generally and ₹40 lakh for exclusive suppliers of goods, with lower limits in special category states.',
    },
    {
      id: 'in-einvoice',
      label: 'GST e-Invoice: Frequently asked questions',
      url: 'https://einvoice.gst.gov.in/faqs',
      note: 'IRN reporting under Rule 48(4) for notified businesses. E-invoicing applies above the prescribed turnover, currently ₹5 crore.',
    },
    {
      id: 'in-eway',
      label: 'GST e-Way Bill: Frequently asked questions',
      url: 'https://ewaybillgst.gov.in/Staticpages/faq.aspx',
      note: 'An e-way bill is required for the movement of goods where the consignment value exceeds ₹50,000.',
    },
    {
      id: 'in-gst-portal',
      label: 'GST portal',
      url: 'https://www.gst.gov.in/',
      note: 'The official portal for GST registration, returns and the HSN and SAC search.',
    },
  ],
  verifiedOn: '2026-11-17',
};
