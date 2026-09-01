// Set NEXT_PUBLIC_TEXTING_ENABLED=false in an app's environment variables
// (e.g. the NobleDesk CRM Vercel project) to ship this same codebase without
// any texting features - used for App Store distribution, where the A2P
// 10DLC-registered SMS side isn't part of the product. Defaults to on, so
// the original NobleDesk deployment needs no env var at all.
export const TEXTING_ENABLED = process.env.NEXT_PUBLIC_TEXTING_ENABLED !== "false";

export const APP_NAME = TEXTING_ENABLED ? "UE NobleDesk" : "NobleDesk CRM";
