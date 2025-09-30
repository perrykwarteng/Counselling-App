import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
  AxiosRequestHeaders,
} from "axios";

export type GetAccessToken = () => string | null | Promise<string | null>;
export type GetRefreshToken = () => string | null | Promise<string | null>;
export type SaveTokens = (args: {
  accessToken: string;
  refreshToken?: string | null | undefined;
}) => void | Promise<void>;

type DoRefreshArgs = {
  refreshToken: string | null;
  axios: AxiosInstance;
};
export type DoRefresh = (args: DoRefreshArgs) => Promise<{
  accessToken: string;
  refreshToken?: string | null | undefined;
}>;

export type ApiClientOptions = {
  baseURL?: string;
  withCredentials?: boolean;

  getAccessToken?: GetAccessToken;
  getRefreshToken?: GetRefreshToken;
  saveTokens?: SaveTokens;

  tokenHeaderName?: string; // default: 'Authorization'
  formatToken?: (token: string) => string; // default: (t) => `Bearer ${t}`

  refreshUrl?: string;
  doRefresh?: DoRefresh;

  onUnauthorized?: () => void;
};

export function createApiClient(opts: ApiClientOptions = {}): AxiosInstance {
  const {
    baseURL,
    withCredentials = true,
    getAccessToken = () => null,
    getRefreshToken = () => null,
    saveTokens = () => {},
    tokenHeaderName = "Authorization",
    formatToken = (t) => `Bearer ${t}`,
    refreshUrl,
    doRefresh,
    onUnauthorized,
  } = opts;

  const api = axios.create({
    baseURL,
    withCredentials,
    headers: { "Content-Type": "application/json" },
  });

  // -------- Request interceptor (TS-safe) --------
  api.interceptors.request.use(
    async (
      config: InternalAxiosRequestConfig
    ): Promise<InternalAxiosRequestConfig> => {
      const token = await getAccessToken();
      if (token) {
        // Ensure headers is a plain object and set header name
        const h = (config.headers ?? {}) as AxiosRequestHeaders;
        if (!(tokenHeaderName in h)) {
          h[tokenHeaderName] = formatToken(token);
        }
        config.headers = h;
      }
      return config;
    }
  );

  // -------- Refresh logic (single-flight) --------
  let isRefreshing = false;
  let waiters: Array<(token: string | null) => void> = [];

  function notifyWaiters(newAccess: string | null) {
    waiters.forEach((w) => {
      try {
        w(newAccess);
      } catch {}
    });
    waiters = [];
  }

  async function runRefresh(): Promise<string | null> {
    if (isRefreshing) {
      return new Promise((resolve) => waiters.push(resolve));
    }
    isRefreshing = true;
    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        notifyWaiters(null);
        return null;
      }

      let result: {
        accessToken: string;
        refreshToken?: string | null | undefined;
      };

      if (doRefresh) {
        result = await doRefresh({ refreshToken, axios: api });
      } else if (refreshUrl) {
        // Default refresh: POST refreshUrl with { refresh_token }
        const { data } = await axios.post(
          refreshUrl,
          { refresh_token: refreshToken },
          {
            withCredentials: true,
            headers: { "Content-Type": "application/json" },
          }
        );
        result = {
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
        };
      } else {
        notifyWaiters(null);
        return null;
      }

      await saveTokens({
        accessToken: result.accessToken,
        // If server omitted refreshToken, keep existing one (undefined => no change)
        refreshToken:
          typeof result.refreshToken === "undefined"
            ? undefined
            : result.refreshToken,
      });

      notifyWaiters(result.accessToken);
      return result.accessToken;
    } catch {
      notifyWaiters(null);
      return null;
    } finally {
      isRefreshing = false;
    }
  }

  // -------- Response interceptor (401 -> refresh -> retry) --------
  api.interceptors.response.use(
    (res: AxiosResponse) => res,
    async (error: AxiosError) => {
      const status = error.response?.status ?? 0;
      const cfg = error.config as
        | (InternalAxiosRequestConfig & { _retry?: boolean })
        | undefined;

      if (!cfg || status !== 401 || cfg._retry) {
        return Promise.reject(error);
      }

      // Don't try to refresh while calling the refresh endpoint itself
      const absoluteUrl = `${cfg.baseURL ?? ""}${cfg.url ?? ""}`;
      const isRefreshCall =
        (refreshUrl && absoluteUrl.includes(refreshUrl)) ||
        (doRefresh && /\/auth\/refresh(?:$|[/?#])/i.test(absoluteUrl));
      if (isRefreshCall) {
        return Promise.reject(error);
      }

      const newAccess = await runRefresh();
      if (!newAccess) {
        onUnauthorized?.();
        return Promise.reject(error);
      }

      const h = (cfg.headers ?? {}) as AxiosRequestHeaders;
      h[tokenHeaderName] = formatToken(newAccess);
      cfg.headers = h;
      cfg._retry = true;

      return api(cfg as AxiosRequestConfig);
    }
  );

  return api;
}
