"use client";
import { SessionProvider, useSession } from "next-auth/react";
import { useEffect, useRef } from "react";

function SessionTracker() {
  const { data: session, status } = useSession();
  const previousStatus = useRef(status);

  useEffect(() => {
    // Detect transition from unauthenticated/loading to authenticated
    if (previousStatus.current !== "authenticated" && status === "authenticated") {
      // This is a fresh login - set the flag
      sessionStorage.setItem('justLoggedIn', 'true');
    }
    previousStatus.current = status;
  }, [status, session]);

  return null;
}

export default function SessionProviderWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    function handleAuthLogin(event: {data : {type: string}}) {
      if (event?.data?.type === "auth-login") {
        // Set the flag before redirecting
        sessionStorage.setItem('justLoggedIn', 'true');
        window.location.href = "/";
      }
    }
    // Listen for BroadcastChannel
    let bc: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && window.BroadcastChannel) {
      bc = new BroadcastChannel("ivm-auth");
      bc.onmessage = handleAuthLogin;
    }
    // Fallback: listen for localStorage events
    function handleStorage(e: StorageEvent) {
      if (e.key === "ivm_auth_login" && e.newValue) {
        sessionStorage.setItem('justLoggedIn', 'true');
        window.location.href = "/";
      }
    }
    window.addEventListener("storage", handleStorage);
    return () => {
      if (bc) bc.close();
      window.removeEventListener("storage", handleStorage);
    };
  }, []);
  return (
    <SessionProvider>
      <SessionTracker />
      {children}
    </SessionProvider>
  );
}
