"use client";

import { createAuthClient } from "better-auth/react";
import { usernameClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  fetchOptions: {
    credentials: "include",
  },

  plugins: [
    usernameClient(),
  ],
});

export const {
  signOut,
  useSession,
} = authClient;
