import { StoreSettings } from '../types';
import { STORE_CONTACT_EMAIL } from './store-contact';

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: 'Research Peptides UK',
  tagline: 'High-Purity Analytical & In-Vitro Research Biochemicals',
  legalEntityName: '[LEGAL_ENTITY_NAME]',
  registeredOfficeAddress: '[REGISTERED_OFFICE_ADDRESS]',
  companyNumber: '[COMPANY_NUMBER]',
  vatNumber: '[VAT_NUMBER]',
  governingLaw: 'England and Wales',
  primaryEmail: STORE_CONTACT_EMAIL,
  supportEmail: STORE_CONTACT_EMAIL,
  privacyEmail: STORE_CONTACT_EMAIL,
  phone: '',
  primaryDomain: 'https://researchpeptidess.uk',
  currency: 'GBP',
  environment: 'PRODUCTION',
  storeStatus: 'PRIVATE_BETA',
  enableAnalyticsWithoutConsent: false,
  maintenanceMode: false,
};
