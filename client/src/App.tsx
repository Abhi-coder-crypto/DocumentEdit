import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/lib/auth-context";

import { ClientAuthPage, AdminAuthPage } from "@/pages/auth";
import UserDashboard from "@/pages/user-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component, adminOnly = false }: { component: React.ComponentType, adminOnly?: boolean }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  if (!user) {
    return <Redirect to={adminOnly ? "/auth/admin" : "/auth/client"} />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Redirect to="/" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/auth/client" component={ClientAuthPage} />
      <Route path="/auth/admin" component={AdminAuthPage} />
      <Route path="/auth">
        {() => <Redirect to="/auth/client" />}
      </Route>
      
      <Route path="/">
        {() => <ProtectedRoute component={UserDashboard} />}
      </Route>
      
      <Route path="/admin">
        {() => <ProtectedRoute component={AdminDashboard} adminOnly />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;