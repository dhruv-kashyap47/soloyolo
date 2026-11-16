import { z } from 'zod';

/**
 * Build-time validation for the generator pages.
 *
 * The same rule as the calculator pages: content is data, and bad data
 * breaks the build instead of shipping. Zod stays in the build and never
 * reaches the browser bundle.
 */

export const faqSchema = z.object({
  question: z.string().min(8),
  answer: z.string().min(60),
});

export const generatorMetaSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(80),
  path: z.string().startsWith('/generators/'),
  eyebrow: z.string().min(1),
  intro: z.string().min(80),
});

export const stepSchema = z.object({
  title: z.string().min(4),
  body: z.string().min(60),
});

export interface GeneratorContent {
  meta: z.infer<typeof generatorMetaSchema>;
  steps: readonly z.infer<typeof stepSchema>[];
  faqs: readonly z.infer<typeof faqSchema>[];
  notes: readonly string[];
}

/** Throws when the content of a generator page does not match the contract. */
export function validateGeneratorContent(name: string, content: GeneratorContent): void {
  const result = z
    .object({
      meta: generatorMetaSchema,
      steps: z.array(stepSchema).min(3),
      faqs: z.array(faqSchema).min(4),
      notes: z.array(z.string().min(40)).min(3),
    })
    .safeParse(content);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid ${name} page content: ${issues}`);
  }
}
