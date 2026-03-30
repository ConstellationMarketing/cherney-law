import "./global.css";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { SiteSettingsProvider } from "./contexts/SiteSettingsContext";
import WcDniManager from "./components/WcDniManager";
import GlobalScripts from "./components/GlobalScripts";
import Index from "./pages/Index";
import Homepage2 from "./pages/Homepage2";
import AboutUs from "./pages/AboutUs";
import PracticeAreas from "./pages/PracticeAreas";
import ContactPage from "./pages/ContactPage";
import TestimonialsPage from "./pages/TestimonialsPage";
import CommonQuestionsPage from "./pages/CommonQuestionsPage";
import AreasWeServePage from "./pages/AreasWeServePage";
import DynamicCmsPage from "./pages/DynamicCmsPage";
import BlogIndex from "./pages/BlogIndex";
import BlogPost from "./pages/BlogPost";
import AdminRoutes from "./pages/AdminRoutes";
import ScrollToTop from "./components/ScrollToTop";

const queryClient = new QueryClient();

// ─── Error Boundary ───────────────────────────────────────────────────────────
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<
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
            onClick={() =>
              this.setState({ hasError: false, error: null })
            }
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
// ─────────────────────────────────────────────────────────────────────────────

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <SiteSettingsProvider>
        <GlobalScripts />
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <WcDniManager />
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/about/" element={<AboutUs />} />
              <Route path="/practice-areas/" element={<PracticeAreas />} />
              <Route path="/contact/" element={<ContactPage />} />
              <Route path="/testimonials/" element={<TestimonialsPage />} />
              <Route path="/common-questions/" element={<CommonQuestionsPage />} />
              <Route path="/areas-we-serve/" element={<AreasWeServePage />} />
              <Route path="/homepage-2/" element={<Homepage2 />} />
              <Route path="/blog/" element={<BlogIndex />} />
              <Route path="/blog/:slug/" element={<BlogPost />} />
              <Route path="/admin/*" element={<AdminRoutes />} />
              {/* Dynamic CMS pages — catches any URL not matched above */}
              <Route path="*" element={<DynamicCmsPage />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </SiteSettingsProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
