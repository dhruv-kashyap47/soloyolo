import { useCallback, useEffect, useRef, useState } from 'preact/hooks';

import {
  countryForCurrency,
  getCountryConfig,
  taxIdLabelFor,
  type CountryCode,
} from '@/lib/countries';
import { applyCountryToDraft } from '@/lib/countries/draft';
import type { DocumentDraft } from '@/lib/generators/document';
import {
  clearProfile,
  emptyProfile,
  loadProfile,
  saveProfile,
  type BusinessProfile,
} from '@/lib/storage/profile';

/**
 * The optional business profile.
 *
 * The profile is offered, never assumed: nothing is stored until the visitor
 * asks for it, the copy says plainly where the data lives, and clearing it
 * is one click away. Everything stays in this browser.
 */
export interface BusinessProfileState {
  /** True when the visitor has asked for their details to be remembered. */
  enabled: boolean;
  /** True when a profile is actually stored in this browser. */
  stored: boolean;
  /** False when the browser refuses to store anything. */
  available: boolean;
  /** A short line under the controls, saying what just happened. */
  notice: string;
  setEnabled: (enabled: boolean) => void;
  /** Skip the next autosave, used when the form is reset to the example. */
  pauseSave: () => void;
  clear: () => void;
}

export interface BusinessProfileOptions {
  /** A country page keeps its market, even when a profile was saved elsewhere. */
  lockedCountry?: CountryCode;
}

type SetValues = (updater: (current: DocumentDraft) => DocumentDraft) => void;

export function useBusinessProfile(
  values: DocumentDraft,
  setValue: <K extends keyof DocumentDraft>(field: K, value: DocumentDraft[K]) => void,
  setValues: SetValues,
  options: BusinessProfileOptions = {},
): BusinessProfileState {
  const [enabled, setEnabledState] = useState(false);
  const [stored, setStored] = useState(false);
  const [available, setAvailable] = useState(true);
  const [notice, setNotice] = useState('');
  const loaded = useRef(false);
  const skipSave = useRef(false);

  // Fill the form from a profile that was saved on an earlier visit.
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    const result = loadProfile();

    if (result.status === 'ok') {
      const profile = result.profile;

      setValues((current) => {
        if (options.lockedCountry) {
          const config = getCountryConfig(options.lockedCountry);
          const acceptsTaxId = config.tax.registrationLabels.includes(profile.taxIdLabel);

          return {
            ...current,
            country: options.lockedCountry,
            businessName: profile.businessName,
            businessAddress: profile.address,
            businessEmail: profile.email,
            businessPhone: profile.phone,
            businessWebsite: profile.website,
            businessTaxId: acceptsTaxId ? profile.taxId : '',
            businessTaxIdLabel: acceptsTaxId
              ? profile.taxIdLabel
              : taxIdLabelFor(config, current.taxLabel),
            logoDataUrl: profile.logoDataUrl,
          };
        }

        const country = countryForCurrency(profile.currency);
        const config = getCountryConfig(country);
        const next = applyCountryToDraft(current, country);
        const acceptsTaxId = config.tax.registrationLabels.includes(profile.taxIdLabel);

        return {
          ...next,
          businessName: profile.businessName,
          businessAddress: profile.address,
          businessEmail: profile.email,
          businessPhone: profile.phone,
          businessWebsite: profile.website,
          businessTaxId: acceptsTaxId ? profile.taxId : '',
          businessTaxIdLabel: acceptsTaxId
            ? profile.taxIdLabel
            : taxIdLabelFor(config, next.taxLabel),
          logoDataUrl: profile.logoDataUrl,
        };
      });

      setEnabledState(true);
      setStored(true);
      setNotice('Your saved business details were filled in for you.');
      return;
    }

    if (result.status === 'invalid') {
      // Keep the stored value: it may be a profile from a newer version, or a
      // long field that the limits reject. Silently deleting it would lose the
      // visitor's address; the Clear button is the explicit way out.
      setStored(true);
      setNotice(
        'A saved set of details could not be read, so it was left untouched. Clear it below if you no longer need it.',
      );
      return;
    }

    if (result.status === 'unavailable') {
      setAvailable(false);
      setNotice('This browser is not allowing details to be stored, so nothing is being saved.');
    }
  }, [options.lockedCountry, setValues]);

  // Save whenever a business detail changes and saving is on. The document
  // notes are deliberately not part of this: they belong to the invoice being
  // written, not to the business.
  useEffect(() => {
    if (!enabled) return;

    const timer = window.setTimeout(() => {
      if (skipSave.current) {
        skipSave.current = false;
        return;
      }

      const profile: BusinessProfile = {
        ...emptyProfile(),
        businessName: values.businessName,
        address: values.businessAddress,
        email: values.businessEmail,
        phone: values.businessPhone,
        website: values.businessWebsite,
        taxId: values.businessTaxId,
        taxIdLabel: values.businessTaxIdLabel,
        logoDataUrl: values.logoDataUrl,
        currency: values.currency,
        updatedAt: new Date().toISOString(),
      };

      const written = saveProfile(profile);
      setStored(written);
      if (!written) {
        // Keep the control usable: a full quota is not the same as a browser
        // that forbids storage, and disabling a checked box trapped the visitor.
        setNotice('Your browser refused to store these details, so nothing was saved.');
      }
    }, 500);

    return () => window.clearTimeout(timer);
  }, [
    enabled,
    values.businessName,
    values.businessAddress,
    values.businessEmail,
    values.businessPhone,
    values.businessWebsite,
    values.businessTaxId,
    values.businessTaxIdLabel,
    values.logoDataUrl,
    values.currency,
  ]);

  const setEnabled = useCallback((next: boolean) => {
    setEnabledState(next);
    setNotice(
      next
        ? 'Your business details will be kept in this browser only, until you clear them.'
        : 'Your details are no longer being saved.',
    );
    if (!next) {
      clearProfile();
      setStored(false);
    }
  }, []);

  const pauseSave = useCallback(() => {
    skipSave.current = true;
  }, []);

  const clear = useCallback(() => {
    clearProfile();
    setEnabledState(false);
    setStored(false);
    setValue('businessName', '');
    setValue('businessAddress', '');
    setValue('businessEmail', '');
    setValue('businessPhone', '');
    setValue('businessWebsite', '');
    setValue('businessTaxId', '');
    setValue('logoDataUrl', '');
    setNotice('Your saved details were removed from this browser.');
  }, [setValue]);

  return { enabled, stored, available, notice, setEnabled, pauseSave, clear };
}
