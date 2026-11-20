/** Set NEXT_PUBLIC_SITE_URL to the live domain in the hosting dashboard. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://callfirst.in").replace(/\/$/, "");
export const SITE_NAME = "CallFirst";
export const SITE_TAGLINE = "Know which lead to call first";
export const SITE_DESCRIPTION =
  "CallFirst turns a messy real estate lead export into a ranked call list. Every lead is scored on intent and budget fit, with the reason shown. Runs in your browser; your leads never leave your device.";
export const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID ?? "";
export const GSC_VERIFICATION = process.env.NEXT_PUBLIC_GSC_VERIFICATION ?? "";
