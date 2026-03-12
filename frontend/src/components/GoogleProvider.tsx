"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";

export default function GoogleProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const rawClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
  const clientId = rawClientId.trim().replace(/^['\"]|['\"]$/g, "");

  // Allow the app to run without Google OAuth configuration.
  if (!clientId) {
    return <>{children}</>;
  }

  return (
    <GoogleOAuthProvider
      clientId={clientId}
      onScriptLoadError={() => {
        console.error("Failed to load Google Identity Services script");
      }}
    >
      {children}
    </GoogleOAuthProvider>
  );
}