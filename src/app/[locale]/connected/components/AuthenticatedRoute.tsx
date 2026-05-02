"use client";

import { ReactNode, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { hasFirmezaSession } from "../../../../services/auth/auth-storage";

interface AuthenticatedRouteProps {
  children: ReactNode;
}

export default function AuthenticatedRoute({ children }: AuthenticatedRouteProps) {
  const router = useRouter();
  const params = useParams<{ locale?: string }>();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (!hasFirmezaSession()) {
      router.replace(params?.locale ? `/${params.locale}` : "/");
      return;
    }

    setIsAuthenticated(true);
  }, [params?.locale, router]);

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
