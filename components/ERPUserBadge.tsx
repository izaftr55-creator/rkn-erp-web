"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

import styles from "./ERPUserBadge.module.css";

type ERPIdentity = {
  identityCode: string | null;
  name: string;
  username: string;
  primaryRoleCode: string | null;
  primaryRoleName: string | null;
};

type WhoAmIResponse = {
  authenticated: boolean;
  authorized?: boolean;
  user?: ERPIdentity;
};

export default function ERPUserBadge() {
  const router = useRouter();

  const [user, setUser] =
    useState<ERPIdentity | null>(null);

  const [busy, setBusy] =
    useState(false);

  useEffect(() => {
    let active = true;

    async function loadIdentity() {
      try {
        const response = await fetch(
          "/api/rkn/whoami",
          {
            cache: "no-store",
          }
        );

        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        const result =
          await response.json() as WhoAmIResponse;

        if (
          !result.authenticated ||
          !result.authorized ||
          !result.user
        ) {
          router.replace("/login");
          return;
        }

        if (active) {
          setUser(result.user);
        }
      }
      catch {
        if (active) {
          setUser(null);
        }
      }
    }

    void loadIdentity();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleLogout() {
    if (busy) return;

    setBusy(true);

    try {
      await authClient.signOut();

      router.replace("/login");
      router.refresh();
    }
    finally {
      setBusy(false);
    }
  }

  const roleLabel =
    user?.primaryRoleCode
      ?.replaceAll("_", " ") ??
    user?.primaryRoleName ??
    "ERP USER";

  const initials =
    user?.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() ??
    "R";

  if (!user) {
    return (
      <div className={styles.skeleton}>
        <div className={styles.skeletonAvatar} />
        <div className={styles.skeletonLines}>
          <span />
          <span />
        </div>
      </div>
    );
  }

  return (
    <section className={styles.card}>
      <div className={styles.avatar}>
        {initials}
      </div>

      <div className={styles.identity}>
        <div
          className={styles.name}
          title={user.name}
        >
          {user.name}
        </div>

        <div className={styles.meta}>
          <span className={styles.role}>
            {roleLabel}
          </span>

          <span className={styles.separator}>
            ·
          </span>

          <span className={styles.code}>
            {user.identityCode ?? "NO-ID"}
          </span>
        </div>
      </div>

      <button
        type="button"
        className={styles.logout}
        onClick={handleLogout}
        disabled={busy}
        title="Keluar dari RKN ERP"
        aria-label="Logout"
      >
        {busy ? "..." : "↗"}
      </button>
    </section>
  );
}