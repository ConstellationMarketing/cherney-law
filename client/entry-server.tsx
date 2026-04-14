import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { AppProviders, AppShell } from "./App";

export function renderAppToString(
  pathname: string,
  helmetContext: Record<string, unknown>,
): string {
  return renderToString(
    <AppProviders helmetContext={helmetContext}>
      <StaticRouter location={pathname}>
        <AppShell />
      </StaticRouter>
    </AppProviders>,
  );
}
