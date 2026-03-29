import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Shell } from "@/components/layout/Shell";
import { SettingsDrawer } from "@/components/SettingsDrawer";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { useSettings } from "@/store/use-settings";

import Search from "@/pages/Search";
import OCR from "@/pages/OCR";
import Assistant from "@/pages/Assistant";
import History from "@/pages/History";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AppContent() {
  const { apiKey } = useSettings();

  if (!apiKey) {
    return <WelcomeScreen />;
  }

  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <Shell>
        <Switch>
          <Route path="/" component={Search} />
          <Route path="/search" component={Search} />
          <Route path="/ocr" component={OCR} />
          <Route path="/assistant" component={Assistant} />
          <Route path="/history" component={History} />
          <Route component={NotFound} />
        </Switch>
      </Shell>
      <SettingsDrawer />
    </WouterRouter>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
        <Toaster />
        <SonnerToaster richColors position="top-right" />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
