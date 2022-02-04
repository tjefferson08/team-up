/// <reference types="@remix-run/dev" />
/// <reference types="@remix-run/cloudflare-pages/globals" />
/// <reference types="@cloudflare/workers-types" />

type Env = {
  // SESSION_SECRETS: string; // comma-delimited
  DB: KVNamespace;
  OPEN_WEATHER_API_KEY: string;
};
