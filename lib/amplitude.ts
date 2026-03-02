"use client";

import * as amplitude from "@amplitude/analytics-browser";

async function initAmplitude() {
  const apiKey = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY;
  if (!apiKey) return;

  await amplitude
    .init(apiKey, {
      autocapture: {
        pageViews: true,
        sessions: true,
        formInteractions: true,
        elementInteractions: true,
      },
    })
    .promise;
}

if (typeof window !== "undefined") {
  initAmplitude();
}

export const AmplitudeProvider = () => null;
export default amplitude;
