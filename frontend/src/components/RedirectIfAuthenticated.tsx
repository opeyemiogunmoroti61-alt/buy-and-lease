"use client";
// components/RedirectIfAuthenticated.tsx
// Redirect logic is handled server-side in (auth)/layout.tsx via getUserSession().
// This component simply renders children — kept so existing imports don't break.

import React from "react";

export default function RedirectIfAuthenticated({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}