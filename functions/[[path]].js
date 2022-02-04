import { createPagesFunctionHandler } from "@remix-run/cloudflare-pages";

// @ts-ignore
import * as build from "../build";

const handleRequest = createPagesFunctionHandler({
  build,
  getLoadContext: (req, _res) => {
    return {
      env: req.env
    }
  }
});

export function onRequest(context) {
  return handleRequest(context);
}
