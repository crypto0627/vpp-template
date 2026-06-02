"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { Spinner } from "@/components/ui";

export function UserMenu() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const [isSigningOut, setIsSigningOut] = useState(false);

  if (!user) return null;

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    setIsSigningOut(false);
    router.push("/auth/signin");
  };

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  return (
    <div className="flex items-center gap-3">
      <div
        className="flex items-center gap-2 hover:underline cursor-pointer"
        onClick={() => router.push("/profile")}
      >
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary text-primary-foreground">
            {getInitials(user.email)}
          </AvatarFallback>
        </Avatar>
        <div className="hidden md:block">
          <p className="text-sm font-medium">{user.email}</p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={handleSignOut}
          disabled={isSigningOut}
          title="登出"
        >
          {isSigningOut ? (
            <Spinner size="sm" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
