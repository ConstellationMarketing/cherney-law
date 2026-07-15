import { PassThrough } from "node:stream";
import { renderToPipeableStream } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { AppProviders, AppShell } from "./App";

export function renderAppToString(
  pathname: string,
  helmetContext: Record<string, unknown>,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: string[] = [];
    let renderError: Error | null = null;
    let settled = false;
    let didPipe = false;

    const rejectOnce = (error: unknown) => {
      if (settled) return;
      settled = true;
      reject(error instanceof Error ? error : new Error(String(error)));
    };

    const output = new PassThrough();
    output.setEncoding("utf8");
    output.on("data", (chunk: string) => chunks.push(chunk));
    output.on("error", rejectOnce);
    output.on("end", () => {
      if (renderError) {
        rejectOnce(renderError);
        return;
      }
      if (!settled) {
        settled = true;
        resolve(chunks.join(""));
      }
    });

    const stream = renderToPipeableStream(
      <AppProviders helmetContext={helmetContext}>
        <StaticRouter location={pathname}>
          <AppShell />
        </StaticRouter>
      </AppProviders>,
      {
        onAllReady() {
          if (renderError) {
            stream.abort();
            rejectOnce(renderError);
            return;
          }
          didPipe = true;
          stream.pipe(output);
        },
        onShellError(error) {
          rejectOnce(error);
        },
        onError(error) {
          renderError =
            error instanceof Error ? error : new Error(String(error));
          if (!didPipe) return;
          output.destroy(renderError);
        },
      },
    );
  });
}
