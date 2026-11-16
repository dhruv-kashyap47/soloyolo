/**
 * The shape of a country invoice guide.
 *
 * The copy lives in `data/countries/*` and is validated at build time. The
 * island never imports this module: only the page does.
 */
export interface CountryPageMeta {
  title: string;
  description: string;
  eyebrow: string;
  intro: string;
}

export interface CountryPageChange {
  label: string;
  value: string;
  note: string;
}

export interface CountryPageRate {
  label: string;
  rate: string;
  note: string;
}

export interface CountryPageRelated {
  label: string;
  href: string;
  note: string;
}

export interface CountryPageContent {
  /** The id of the guide in `lib/countries/guides.ts`. */
  guideId: string;
  meta: CountryPageMeta;
  breadcrumbLabel: string;
  documentName: string;
  requirements: {
    title: string;
    intro: string;
    items: readonly string[];
  };
  changes: {
    title: string;
    intro: string;
    items: readonly CountryPageChange[];
  };
  rates: {
    title: string;
    intro: string;
    items: readonly CountryPageRate[];
    note: string;
  };
  scenario: {
    title: string;
    body: string;
    points: readonly string[];
  };
  notes: readonly string[];
  faqs: readonly { question: string; answer: string }[];
  sourceIds: readonly string[];
  related: readonly CountryPageRelated[];
}
