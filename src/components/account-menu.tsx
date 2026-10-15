"use client";

import { SignOutButton, UserButton, useClerk } from "@clerk/nextjs";
import type { ReactNode } from "react";

function MenuIcon({ children }: { children: ReactNode }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      {children}
    </svg>
  );
}

export function AccountMenu({ isAdmin, unread }: { isAdmin: boolean; unread: number }) {
  const { openUserProfile } = useClerk();
  const messageLabel = unread > 0 ? `Messages (${unread > 99 ? "99+" : unread})` : "Messages";

  return (
    <div className="account">
      <UserButton>
        <UserButton.MenuItems>
          <UserButton.Link
            label="Dashboard"
            href="/dashboard"
            labelIcon={
              <MenuIcon>
                <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" strokeLinejoin="round" />
              </MenuIcon>
            }
          />
          <UserButton.Link
            label={messageLabel}
            href="/messages"
            labelIcon={
              <MenuIcon>
                <path d="M5 6h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H9l-4 3v-3H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z" strokeLinejoin="round" />
              </MenuIcon>
            }
          />
          <UserButton.Link
            label="My profile"
            href="/profile"
            labelIcon={
              <MenuIcon>
                <circle cx="12" cy="8" r="3" />
                <path d="M6 19c1.2-2.4 3.2-3.5 6-3.5s4.8 1.1 6 3.5" strokeLinecap="round" />
              </MenuIcon>
            }
          />
          {isAdmin ? (
            <UserButton.Link
              label="Admin"
              href="/admin"
              labelIcon={
                <MenuIcon>
                  <path d="M12 3 5 6v5c0 4.2 2.8 7.2 7 8 4.2-.8 7-3.8 7-8V6z" strokeLinejoin="round" />
                </MenuIcon>
              }
            />
          ) : null}
          <UserButton.Action
            label="Account settings"
            labelIcon={
              <MenuIcon>
                <circle cx="12" cy="12" r="3" />
                <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" strokeLinecap="round" />
              </MenuIcon>
            }
            onClick={() => openUserProfile()}
          />
          <UserButton.Action label="signOut" />
        </UserButton.MenuItems>
      </UserButton>
      {unread > 0 ? (
        <span className="count account__count">
          {unread > 99 ? "99+" : unread}
          <span className="sr-only"> unread messages</span>
        </span>
      ) : null}
    </div>
  );
}

export function MobileAccountActions() {
  const { openUserProfile } = useClerk();

  return (
    <>
      <button
        type="button"
        className="menu__link"
        onClick={(event) => {
          event.currentTarget.closest("details")?.removeAttribute("open");
          openUserProfile();
        }}
      >
        Account settings
      </button>
      <SignOutButton>
        <button type="button" className="menu__link">
          Sign out
        </button>
      </SignOutButton>
    </>
  );
}
