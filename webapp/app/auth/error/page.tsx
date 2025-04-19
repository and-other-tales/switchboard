"use client";

import { useSearchParams } from "next/navigation";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import Link from "next/link";
import { Suspense } from 'react';

// Separate component that uses useSearchParams
function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Authentication Error</h1>
          <p className="text-gray-500 mt-2">
            {error === "AccessDenied"
              ? "You don't have permission to access this application. Please contact your administrator."
              : "There was a problem signing you in. Please try again."}
          </p>
        </div>
        <Button className="w-full" asChild>
          <Link href="/auth/signin">Return to sign in</Link>
        </Button>
      </Card>
    </div>
  );
}

// Main page component with Suspense
export default function AuthError() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <AuthErrorContent />
    </Suspense>
  );
}
