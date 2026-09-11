import { ReactNode } from "react";
import Header from "./Header";
import BottomNavigation from "./BottomNavigation";
import { AppSidebar } from "./AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full">
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-none text-xs font-semibold"
        >
          Skip to main content
        </a>
        <AppSidebar />

        <SidebarInset className="flex-1 flex flex-col">
          <Header />
          <main id="main-content" className="flex-1 pb-24 md:pb-0" tabIndex={-1}>
            {children}
          </main>
        </SidebarInset>

        <div className="md:hidden">
          <BottomNavigation />
        </div>

      </div>
    </SidebarProvider>
  );
};

export default Layout;
