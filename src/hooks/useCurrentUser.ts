"use client";

import { useEffect, useState } from "react";

type CurrentUser = {
  id: number;
  name: string;
  role: string;
  jiraId?: string | null;
  companyName?: string | null;
};

let cachedUser: CurrentUser | null = null;
let inFlightRequest: Promise<CurrentUser | null> | null = null;
const listeners = new Set<(user: CurrentUser | null) => void>();

function broadcast(user: CurrentUser | null) {
  cachedUser = user;
  listeners.forEach((listener) => listener(user));
}

async function fetchCurrentUser() {
  if (cachedUser) return cachedUser;
  if (inFlightRequest) return inFlightRequest;

  inFlightRequest = fetch("/api/auth/session")
    .then((response) => (response.ok ? response.json() : null))
    .then((data) => {
      const user = data?.user
        ? {
            id: Number(data.user.id),
            name: data.user.name,
            role: data.user.role,
            jiraId: data.user.jiraId,
            companyName: data.user.companyName,
          }
        : null;

      broadcast(user);
      return user;
    })
    .catch(() => {
      broadcast(null);
      return null;
    })
    .finally(() => {
      inFlightRequest = null;
    });

  return inFlightRequest;
}

export function useCurrentUser() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(cachedUser);
  const [isLoading, setIsLoading] = useState(() => !cachedUser);

  useEffect(() => {
    listeners.add(setCurrentUser);

    if (!cachedUser) {
      void fetchCurrentUser().finally(() => setIsLoading(false));
    }

    return () => {
      listeners.delete(setCurrentUser);
    };
  }, []);

  return { currentUser, isLoading, refreshCurrentUser: fetchCurrentUser };
}
