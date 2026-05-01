import React, { ReactNode } from "react";
import HeaderConn from "./components/HeaderConn";
import FooterConn from "./components/FooterConn";
import AuthenticatedRoute from "./components/AuthenticatedRoute";

interface ConnectedLayoutProps {
  children: ReactNode;
}

export default function ConnectedLayout({ children }: ConnectedLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <HeaderConn />
      <AuthenticatedRoute>
        <main className="flex-grow">
          {children}
        </main>
      </AuthenticatedRoute>
      <FooterConn />
    </div>
  );
}
