"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "../../components/ui/button";

export default function NavBar() {
  const { data: session } = useSession();

  return (
    <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
      <div className="font-bold text-xl">Telephone Switchboard</div>
      {session && (
        <div className="flex items-center gap-4">
          <span className="text-sm">{session.user?.email}</span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
          >
            Sign Out
          </Button>
        </div>
      )}
    </div>
  );
}
