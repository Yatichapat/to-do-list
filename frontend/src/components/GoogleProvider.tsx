"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";


export default function GoogleProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const rawClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
  const clientId = rawClientId.trim().replace(/^['\"]|['\"]$/g, "");

  console.log("Using Google Client ID:", clientId);
  
  if (!clientId) {
    throw new Error("Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID in frontend/.env.local");
  }

  if (!/^\d+-[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/.test(clientId)) {
    throw new Error("Invalid NEXT_PUBLIC_GOOGLE_CLIENT_ID format");
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