/** Public Tawk.to property / widget ids (safe to expose in the client bundle). */
export const TAWK_PROPERTY_ID = '6aaf7275d129db344d607912';
export const TAWK_WIDGET_ID = '1k2ule7cr';
export const TAWK_EMBED_SRC = `https://embed.tawk.to/${TAWK_PROPERTY_ID}/${TAWK_WIDGET_ID}`;

export type TawkApi = {
  hideWidget?: () => void;
  showWidget?: () => void;
  onLoad?: () => void;
};

declare global {
  interface Window {
    Tawk_API?: TawkApi;
    Tawk_LoadStart?: Date;
  }
}
