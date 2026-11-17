import NumberField from '@/components/forms/NumberField';
import TextField from '@/components/forms/TextField';
import type { CountryHsnCode } from '@/lib/countries/types';
import type { LineItemDraft } from '@/lib/generators/document';
import { itemFieldKey, type DocumentFieldKey } from '@/lib/generators/validation';

export interface LineItemsEditorProps {
  items: readonly LineItemDraft[];
  currencySymbol: string;
  /** The market's HSN/SAC field, where it asks for one. */
  hsn?: CountryHsnCode;
  errorFor: (key: DocumentFieldKey) => string | undefined;
  markTouched: (field: string) => void;
  onItemValue: <K extends keyof LineItemDraft>(
    id: string,
    field: K,
    value: LineItemDraft[K],
  ) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
}

/**
 * The line item editor.
 *
 * Every line is its own card rather than a row in a table, so the same
 * markup works on a phone, where a five column table would squeeze every
 * column into unreadable slivers. The fields keep the shared number field's
 * grouping, prefix and reserved error space.
 */
export default function LineItemsEditor(props: LineItemsEditorProps) {
  const { items, currencySymbol, hsn, errorFor, markTouched, onItemValue, onRemove, onAdd } = props;

  return (
    <div>
      <ul class="grid gap-3">
        {items.map((item, index) => {
          const descriptionKey = itemFieldKey(item.id, 'description');
          const quantityKey = itemFieldKey(item.id, 'quantity');
          const priceKey = itemFieldKey(item.id, 'unitPrice');
          const discountKey = itemFieldKey(item.id, 'discountPercent');
          const taxKey = itemFieldKey(item.id, 'taxPercent');
          const hsnKey = itemFieldKey(item.id, 'hsnCode');

          return (
            <li
              key={item.id}
              class="border-line bg-canvas/50 @container rounded-xl border p-3 sm:p-4"
            >
              <div class="flex items-start justify-between gap-3">
                <p class="text-muted text-[0.6875rem] font-semibold tracking-[0.12em] uppercase">
                  Item {index + 1}
                </p>

                {items.length > 1 && (
                  <button
                    type="button"
                    class="text-muted hover:text-danger -mt-1 min-h-9 shrink-0 rounded px-2 text-[0.8125rem] transition-colors"
                    onClick={() => onRemove(item.id)}
                  >
                    Remove
                  </button>
                )}
              </div>

              <div class="mt-2 grid gap-3">
                <TextField
                  id={`${item.id}-description`}
                  name={`${item.id}-description`}
                  label="Description"
                  hintId={`${item.id}-description-hint`}
                  errorId={`${item.id}-description-error`}
                  value={item.description}
                  placeholder="Brand identity, design system, hourly work"
                  error={errorFor(descriptionKey)}
                  onValue={(value) => onItemValue(item.id, 'description', value)}
                  onBlur={() => markTouched(descriptionKey)}
                />

                {hsn && (
                  <TextField
                    id={`${item.id}-hsn`}
                    name={`${item.id}-hsn`}
                    label={hsn.label}
                    hint={index === 0 ? hsn.hint : undefined}
                    hintId={`${item.id}-hsn-hint`}
                    errorId={`${item.id}-hsn-error`}
                    value={item.hsnCode}
                    placeholder={hsn.placeholder}
                    error={errorFor(hsnKey)}
                    onValue={(value) => onItemValue(item.id, 'hsnCode', value)}
                    onBlur={() => markTouched(hsnKey)}
                  />
                )}

                <div class="grid grid-cols-2 gap-3 @md:grid-cols-4">
                  <NumberField
                    id={`${item.id}-quantity`}
                    name={`${item.id}-quantity`}
                    label="Quantity"
                    hintId={`${item.id}-quantity-hint`}
                    errorId={`${item.id}-quantity-error`}
                    value={item.quantity}
                    placeholder="1"
                    error={errorFor(quantityKey)}
                    decimals
                    onValue={(value) => onItemValue(item.id, 'quantity', value)}
                    onBlur={() => markTouched(quantityKey)}
                  />

                  <NumberField
                    id={`${item.id}-unit-price`}
                    name={`${item.id}-unit-price`}
                    label="Unit price"
                    hintId={`${item.id}-unit-price-hint`}
                    errorId={`${item.id}-unit-price-error`}
                    value={item.unitPrice}
                    placeholder="1200"
                    prefix={currencySymbol}
                    error={errorFor(priceKey)}
                    decimals
                    onValue={(value) => onItemValue(item.id, 'unitPrice', value)}
                    onBlur={() => markTouched(priceKey)}
                  />

                  <NumberField
                    id={`${item.id}-discount`}
                    name={`${item.id}-discount`}
                    label="Discount"
                    hintId={`${item.id}-discount-hint`}
                    errorId={`${item.id}-discount-error`}
                    value={item.discountPercent}
                    placeholder="0"
                    suffix="%"
                    error={errorFor(discountKey)}
                    decimals
                    onValue={(value) => onItemValue(item.id, 'discountPercent', value)}
                    onBlur={() => markTouched(discountKey)}
                  />

                  <NumberField
                    id={`${item.id}-tax`}
                    name={`${item.id}-tax`}
                    label="Tax rate"
                    hintId={`${item.id}-tax-hint`}
                    errorId={`${item.id}-tax-error`}
                    value={item.taxPercent}
                    placeholder="0"
                    suffix="%"
                    error={errorFor(taxKey)}
                    decimals
                    onValue={(value) => onItemValue(item.id, 'taxPercent', value)}
                    onBlur={() => markTouched(taxKey)}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <button type="button" class="btn btn-secondary mt-3 w-full" onClick={onAdd}>
        <span aria-hidden="true">+</span>
        Add a line item
      </button>
    </div>
  );
}
