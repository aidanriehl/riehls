 import { Toaster } from "@/components/ui/toaster";
 import { Toaster as Sonner } from "@/components/ui/sonner";
 import { TooltipProvider } from "@/components/ui/tooltip";
 import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
 import { BrowserRouter, Routes, Route } from "react-router-dom";
 import { AuthProvider } from "@/hooks/useAuth";
 import { ProtectedRoute } from "@/components/ProtectedRoute";
 import Index from "./pages/Index";
 import Profile from "./pages/Profile";
 import CreatorProfile from "./pages/CreatorProfile";
import Messages from "./pages/Messages";
import MessageConversation from "./pages/MessageConversation";
 import Auth from "./pages/Auth";
 import Onboarding from "./pages/Onboarding";
 import AdminUpload from "./pages/AdminUpload";
 import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
     <AuthProvider>
       <TooltipProvider>
         <Toaster />
         <Sonner position="top-center" />
         <BrowserRouter>
           <Routes>
             <Route path="/auth" element={<Auth />} />
             <Route path="/onboarding" element={
               <ProtectedRoute requireOnboarding={false}>
                 <Onboarding />
               </ProtectedRoute>
             } />
             <Route path="/" element={
               <ProtectedRoute>
                 <Index />
               </ProtectedRoute>
             } />
             <Route path="/profile" element={
               <ProtectedRoute>
                 <Profile />
               </ProtectedRoute>
             } />
             <Route path="/creator" element={
               <ProtectedRoute>
                 <CreatorProfile />
               </ProtectedRoute>
             } />
            <Route path="/messages" element={
                <ProtectedRoute>
                  <Messages />
                </ProtectedRoute>
              } />
              <Route path="/messages/:oderId" element={
                <ProtectedRoute>
                  <MessageConversation />
                </ProtectedRoute>
              } />
             <Route path="/admin/upload" element={
               <ProtectedRoute requireAdmin>
                 <AdminUpload />
               </ProtectedRoute>
             } />
             {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
             <Route path="*" element={<NotFound />} />
           </Routes>
         </BrowserRouter>
       </TooltipProvider>
     </AuthProvider>
  </QueryClientProvider>
);

export default App;
