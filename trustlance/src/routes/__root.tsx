import { createRootRoute, Outlet } from "@tanstack/react-router";
import { AuthProvider } from "../hooks/provider/AuthProvider";
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from "../lib/blockchain/wagmi";


const queryClient = new QueryClient()

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {


  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Outlet />
        </AuthProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}


