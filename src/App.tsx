import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import XPathGenerator from "./pages/XPathGenerator";
import TestDataGenerator from "./pages/TestDataGenerator";
import JsonFormatter from "./pages/JsonFormatter";
import ScreenshotComparator from "./pages/ScreenshotComparator";
import LogAnalyzer from "./pages/LogAnalyzer";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/xpath" element={<XPathGenerator />} />
            <Route path="/test-data" element={<TestDataGenerator />} />
            <Route path="/json-formatter" element={<JsonFormatter />} />
            <Route path="/screenshot" element={<ScreenshotComparator />} />
            <Route path="/log-analyzer" element={<LogAnalyzer />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
