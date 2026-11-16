import { useRef, useState } from 'preact/hooks';

import { readLogoFile } from '@/lib/storage/logo';

export interface LogoUploadProps {
  logoDataUrl: string;
  onChange: (dataUrl: string) => void;
  /** Called when the file is refused, so the form can show the reason. */
  onError?: (message: string) => void;
}

/**
 * The logo picker.
 *
 * The file is read in the browser, scaled down and kept as a data URL. It is
 * never uploaded, and the copy says so, because a visitor handing over their
 * logo has every reason to ask where it goes.
 */
export default function LogoUpload({ logoDataUrl, onChange, onError }: LogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function handleFile(file: File | undefined) {
    if (!file) return;

    setBusy(true);
    const result = await readLogoFile(file);
    setBusy(false);

    if (result.ok) {
      onChange(result.dataUrl);
      setMessage('Logo added. It stays in this browser.');
      onError?.('');
      return;
    }

    setMessage('');
    onError?.(result.message);
  }

  return (
    <div class="min-w-0">
      <label class="field-label" for="logo">
        Logo
      </label>

      <div class="border-line-strong bg-canvas flex items-center gap-3 rounded-[var(--radius-input)] border border-dashed p-3">
        {logoDataUrl ? (
          <img
            src={logoDataUrl}
            alt=""
            class="h-11 w-auto max-w-[9rem] shrink-0 rounded bg-white/90 object-contain p-1"
          />
        ) : (
          <span
            aria-hidden="true"
            class="border-line-strong text-muted flex h-11 w-11 shrink-0 items-center justify-center rounded border border-dashed text-xs"
          >
            Logo
          </span>
        )}

        <div class="min-w-0 flex-1">
          <input
            ref={inputRef}
            id="logo"
            name="logo"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            class="sr-only"
            /* The visible "Choose a logo" button drives the picker. A hidden
               input that is also a Tab stop would put focus somewhere a
               keyboard user cannot see. */
            tabIndex={-1}
            onChange={(event) => {
              const files = (event.currentTarget as HTMLInputElement).files;
              void handleFile(files?.[0]);
              (event.currentTarget as HTMLInputElement).value = '';
            }}
          />

          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="btn btn-secondary"
              disabled={busy}
              aria-describedby="logo-hint"
              onClick={() => inputRef.current?.click()}
            >
              {busy ? 'Reading…' : logoDataUrl ? 'Replace logo' : 'Choose a logo'}
            </button>

            {logoDataUrl && (
              <button
                type="button"
                class="text-muted hover:text-danger min-h-9 px-1 text-[0.8125rem] transition-colors"
                onClick={() => {
                  onChange('');
                  setMessage('Logo removed.');
                }}
              >
                Remove
              </button>
            )}
          </div>

          <p id="logo-hint" class="text-muted mt-1 text-xs leading-relaxed">
            PNG, JPEG or WebP, up to 5 MB. It is read in your browser and never uploaded.
          </p>
          {message && <p class="text-accent-strong mt-1 text-xs">{message}</p>}
        </div>
      </div>
    </div>
  );
}
