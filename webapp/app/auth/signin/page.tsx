"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";

export default function SignIn() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Sign In</h1>
          <p className="text-gray-500 mt-2">Sign in to access the application</p>
        </div>
        <Button
          className="w-full"
          onClick={() => signIn("google", { callbackUrl })}
        >
          Sign in with Google
        </Button>
      </Card>
    </div>
  );
}
