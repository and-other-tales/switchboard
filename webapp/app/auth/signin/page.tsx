"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignIn() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
          <CardDescription>
            Sign in to access the Switchboard application
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Sign-in button removed */}
        </CardContent>
      </Card>
    </div>
  );
}
