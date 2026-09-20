/** Public Tawk.to property / widget ids (safe to expose in the client bundle). */
export const TAWK_PROPERTY_ID = '6aaf7275d129db344d607912';
export const TAWK_WIDGET_ID = '1k2ule7cr';
export const TAWK_EMBED_SRC = `https://embed.tawk.to/${TAWK_PROPERTY_ID}/${TAWK_WIDGET_ID}`;

/** Matches WhatsApp FAB: mobile-bottom-nav-height (3.75rem) + 1rem. */
export const TAWK_MOBILE_Y_OFFSET = 76;
export const TAWK_MOBILE_X_OFFSET = 16;

export type TawkVisibilityStyle = {
  position?: 'br' | 'bl' | 'cr' | 'cl' | 'tr' | 'tl';
  xOffset?: number | string;
  yOffset?: number | string;
};

export type TawkApi = {
  hideWidget?: () => void;
  showWidget?: () => void;
  onLoad?: () => void;
  customStyle?: {
    zIndex?: number | string;
    visibility?: {
      desktop?: TawkVisibilityStyle;
      mobile?: TawkVisibilityStyle;
    };
  };
};

declare global {
  interface Window {
    Tawk_API?: TawkApi;
    Tawk_LoadStart?: Date;
  }
}
