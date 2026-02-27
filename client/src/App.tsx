import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import ShootForGlory from "@/pages/ShootForGlory";
import MobileController from "@/pages/MobileController";
import BillboardScreen from "@/pages/BillboardScreen";

function Router() {
  return (
    <Switch>
      <Route path="/" component={ShootForGlory}/>
      <Route path="/mobile" component={MobileController}/>
      <Route path="/screen" component={BillboardScreen}/>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
