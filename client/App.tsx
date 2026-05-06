import { Component, useRef, type ErrorInfo, type ReactNode } from "react";
import { HelmetProvider } from "@site/lib/helmet";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SiteSettingsProvider } from "./contexts/SiteSettingsContext";
import WcDniManager from "./components/WcDniManager";
import GlobalScripts from "./components/GlobalScripts";
import PublicFullDocumentNavigation from "./components/PublicFullDocumentNavigation";
import DynamicCmsPage from "./pages/DynamicCmsPage";
import AdminRoutes from "./pages/AdminRoutes";
import ScrollToTop from "./components/ScrollToTop";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary] Caught error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "2rem",
            fontFamily: "monospace",
            color: "#c00",
            background: "#fff8f8",
            minHeight: "100vh",
          }}
        >
          <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
            Application Error
          </h1>
          <p style={{ marginBottom: "0.5rem" }}>
            {this.state.error?.message}
          </p>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              fontSize: "0.8rem",
              color: "#666",
            }}
          >
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export function AppShell() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <>
      {!isAdminRoute && <GlobalScripts />}
      {!isAdminRoute && <PublicFullDocumentNavigation />}
      {!isAdminRoute && <WcDniManager />}
      <ScrollToTop />
      <Routes>
        <Route path="/admin/*" element={<AdminRoutes />} />
        <Route path="*" element={<DynamicCmsPage />} />
      </Routes>
    </>
  );
}

export function AppProviders({
  children,
  helmetContext,
}: {
  children: ReactNode;
  helmetContext?: Record<string, unknown>;
}) {
  const queryClientRef = useRef<QueryClient | null>(null);

  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient();
  }

  return (
    <HelmetProvider context={helmetContext}>
      <QueryClientProvider client={queryClientRef.current}>
        <SiteSettingsProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            {children}
          </TooltipProvider>
        </SiteSettingsProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}
