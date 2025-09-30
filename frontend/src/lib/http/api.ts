"use client";

import axios from "axios";
import { createApiClient } from "./createApiClient";

const ACCESS_KEY = "auth_access_token";
const REFRESH_KEY = "auth_refresh_token";

const getAccessToken = () =>
  typeof window !== "undefined" ? localStorage.getItem(ACCESS_KEY) : null;

const getRefreshToken = () =>
  typeof window !== "undefined" ? localStorage.getItem(REFRESH_KEY) : null;

const saveTokens = async ({
  accessToken,
  refreshToken,
}: {
  accessToken: string;
  refreshToken?: string | null;
}) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_KEY, accessToken);
  if (typeof refreshToken !== "undefined") {
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
    else localStorage.removeItem(REFRESH_KEY);
  }
};

const root =
  (process.env.NEXT_PUBLIC_APP_BASE_URL as string | undefined)?.replace(
    /\/$/,
    ""
  ) || "";

export const api = createApiClient({
  baseURL: root,

  withCredentials: true,
  getAccessToken,
  getRefreshToken,
  saveTokens,
  tokenHeaderName: "Authorization",
  formatToken: (t) => `Bearer ${t}`,

  doRefresh: async ({ refreshToken }) => {
    const refreshUrl = `${root}/auth/refresh`;
    const bare = axios.create({
      withCredentials: true,
      headers: { "Content-Type": "application/json" },
    });

    try {
      const r1 = await bare.post(refreshUrl, { refresh_token: refreshToken });
      return {
        accessToken: r1.data.access_token,
        refreshToken: r1.data.refresh_token,
      };
    } catch {
      try {
        const r2 = await bare.post(refreshUrl, null, {
          headers: { Authorization: `Bearer ${refreshToken}` },
        });
        return {
          accessToken: r2.data.access_token,
          refreshToken: r2.data.refresh_token,
        };
      } catch {
        const r3 = await bare.post(refreshUrl, null);
        return {
          accessToken: r3.data.access_token,
          refreshToken: r3.data.refresh_token,
        };
      }
    }
  },

  onUnauthorized: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
      window.location.href = "/login";
    }
  },
});
