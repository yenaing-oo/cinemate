"use client";

import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { LogoutButton } from "~/components/logout-button";
import Link from "next/link";
import { createClient } from "~/lib/supabase/client";

export function AuthButton() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      setIsLoggedIn(!!data.session);
    };
    checkSession();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      checkSession();
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (isLoggedIn === null) return null;
  return isLoggedIn ? <LogoutButton /> : (
    <Button asChild>
      <Link href="/auth/login">Sign in</Link>
    </Button>
  );
}
