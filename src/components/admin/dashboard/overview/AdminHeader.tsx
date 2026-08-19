"use client";

/* The Overview header — admin identity left, three utilities right.

   Only three, deliberately: the email diagnostic (super admin), a way into
   admin management, and sign out. No search, no bell, no overflow menu — the
   page is the notification. */

import { Avatar, Button, Chip, Tooltip } from "@heroui/react";
import { LogOut, ShieldUser } from "lucide-react";
import { EmailHealthButton } from "../EmailHealthButton";

export function AdminHeader({ name, adminId, isSuper, onNav }: {
  name: string; adminId: string; isSuper: boolean; onNav: (key: string) => void;
}) {
  return (
    <header className="ao-head">
      <div className="ao-head-id">
        <Avatar className="size-10">
          <Avatar.Fallback className="text-sm font-semibold">
            {name.slice(0, 2).toUpperCase()}
          </Avatar.Fallback>
        </Avatar>
        <div className="ao-head-meta">
          <div className="ao-head-line">
            <h1 className="ao-head-name">{name}</h1>
            <Chip color="accent" size="sm" variant="soft">SUPER ADMIN</Chip>
          </div>
          <span className="ao-head-sub">{adminId}</span>
        </div>
      </div>

      <div className="ao-head-acts">
        {/* Lived on the old dashboard's SuperAdminBar, which this header
            replaces — same component, same super-admin gating. */}
        {isSuper && <EmailHealthButton />}

        <Tooltip>
          <Tooltip.Trigger>
            <Button aria-label="Admin management" size="sm" variant="tertiary" onPress={() => onNav("admins")}>
              <ShieldUser size={16} />
            </Button>
          </Tooltip.Trigger>
          <Tooltip.Content>Admin management</Tooltip.Content>
        </Tooltip>

        <Tooltip>
          <Tooltip.Trigger>
            <Button aria-label="Sign out" className="ao-signout" size="sm" variant="tertiary" onPress={() => onNav("signout")}>
              <LogOut size={16} />
            </Button>
          </Tooltip.Trigger>
          <Tooltip.Content>Sign out</Tooltip.Content>
        </Tooltip>
      </div>
    </header>
  );
}
