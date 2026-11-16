import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';

import { buildReminder, REMINDER_TONES, type ReminderInput } from '@/lib/generators/reminder';

const BASE: ReminderInput = {
  tone: 'professional',
  customerName: 'Alex Morgan',
  invoiceNumber: 'INV-0042',
  amountDue: new Decimal('1250.00'),
  currency: 'USD',
  dueDate: '2026-11-12',
  paymentLink: 'https://example.com/pay/INV-0042',
  businessName: 'Northwind Studio',
  daysOverdue: 0,
};

describe('buildReminder', () => {
  it('names the customer, the invoice, the amount and the due date', () => {
    const reminder = buildReminder(BASE);

    expect(reminder.body).toContain('Alex Morgan');
    expect(reminder.body).toContain('INV-0042');
    expect(reminder.body).toContain('$1,250.00');
    expect(reminder.body).toContain('November 12, 2026');
    expect(reminder.body).toContain('https://example.com/pay/INV-0042');
    expect(reminder.body).toContain('Northwind Studio');
  });

  it('writes a subject line for every tone but the friendly one', () => {
    for (const tone of REMINDER_TONES) {
      const reminder = buildReminder({ ...BASE, tone });

      if (tone === 'friendly') {
        expect(reminder.subject).toBe('');
        expect(reminder.text.startsWith('Subject:')).toBe(false);
      } else {
        expect(reminder.subject).not.toBe('');
        expect(reminder.text.startsWith('Subject: ')).toBe(true);
      }
    }
  });

  it('changes the wording with the tone', () => {
    const friendly = buildReminder({ ...BASE, tone: 'friendly' }).body;
    const professional = buildReminder({ ...BASE, tone: 'professional' }).body;
    const firm = buildReminder({ ...BASE, tone: 'firm' }).body;
    const finalNotice = buildReminder({ ...BASE, tone: 'final' }).body;

    expect(friendly).not.toBe(professional);
    expect(professional).not.toBe(firm);
    expect(firm).not.toBe(finalNotice);
    expect(finalNotice).toContain('final reminder');
  });

  it('says how late the invoice is when it is late', () => {
    expect(buildReminder({ ...BASE, daysOverdue: 1 }).body).toContain('one day past');
    expect(buildReminder({ ...BASE, daysOverdue: 5 }).body).toContain('5 days past');
    expect(buildReminder({ ...BASE, daysOverdue: 21 }).body).toContain('3 weeks past');
    expect(buildReminder({ ...BASE, daysOverdue: 90 }).body).toContain('3 months past');
  });

  it('says nothing about lateness when the invoice is not due yet', () => {
    expect(buildReminder({ ...BASE, daysOverdue: 0 }).body).not.toContain('past the due date');
    expect(buildReminder({ ...BASE, daysOverdue: -3 }).body).not.toContain('past the due date');
  });

  it('copes without a payment link', () => {
    const reminder = buildReminder({ ...BASE, paymentLink: '' });

    expect(reminder.body).not.toContain('You can pay it here');
    expect(reminder.body).toContain('replying to this message');
  });

  it('copes without a customer name', () => {
    const reminder = buildReminder({ ...BASE, customerName: '' });

    expect(reminder.body).toContain('Hello there,');
    expect(reminder.body).not.toContain('undefined');
  });

  it('copes without an invoice number', () => {
    const reminder = buildReminder({ ...BASE, invoiceNumber: '' });

    expect(reminder.body.toLowerCase()).toContain('the amount of $1,250.00');
  });

  it('copes without a business name', () => {
    const reminder = buildReminder({ ...BASE, businessName: '' });

    expect(reminder.body.trim().endsWith('Kind regards,')).toBe(true);
  });

  it('never writes an em dash', () => {
    for (const tone of REMINDER_TONES) {
      expect(buildReminder({ ...BASE, tone }).text).not.toContain('—');
    }
  });
});
