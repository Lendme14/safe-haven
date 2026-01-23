import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SafetyProvider } from "@/contexts/SafetyContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Contacts from "./pages/Contacts";
import Timeline from "./pages/Timeline";
import Settings from "./pages/Settings";
import Playback from "./pages/Playback";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SafetyProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/timeline" element={<Timeline />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/playback" element={<Playback />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </SafetyProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
