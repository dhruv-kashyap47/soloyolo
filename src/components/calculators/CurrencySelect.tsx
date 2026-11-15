import { CURRENCIES, isCurrencyCode, type CurrencyCode } from '@/lib/formatting/currency';

export interface CurrencySelectProps {
  id: string;
  value: CurrencyCode;
  onValue: (code: CurrencyCode) => void;
}

/**
 * The currency picker every calculator uses. It only changes how amounts are
 * formatted; it never converts them, which is why the copy next to it always
 * says so.
 */
export default function CurrencySelect({ id, value, onValue }: CurrencySelectProps) {
  return (
    <div class="flex items-center gap-2">
      <label for={id} class="text-muted text-xs font-medium">
        Currency
      </label>
      <select
        id={id}
        class="border-line-strong bg-canvas text-ink min-h-11 rounded-lg border px-2 py-1.5 text-sm"
        value={value}
        onChange={(event) => {
          const next = event.currentTarget.value;
          if (isCurrencyCode(next)) onValue(next);
        }}
      >
        {CURRENCIES.map((option) => (
          <option value={option.code}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}
