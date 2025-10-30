import { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { Code, Database, FileJson, Camera, Bug, Home } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "XPath Generator", href: "/xpath", icon: Code },
  { name: "Test Data Generator", href: "/test-data", icon: Database },
  { name: "JSON Formatter", href: "/json-formatter", icon: FileJson },
  { name: "Screenshot Comparator", href: "/screenshot", icon: Camera },
  { name: "Log Analyzer", href: "/log-analyzer", icon: Bug },
];

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-sidebar-border bg-sidebar">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b border-sidebar-border px-6 sticky top-0 bg-sidebar z-10">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Bug className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-sidebar-foreground">QA Utility Hub</h1>
                <p className="text-xs text-sidebar-foreground/60">TestCraft Tools</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4 sticky top-16 overflow-y-auto">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === "/"}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="border-t border-sidebar-border p-4 sticky bottom-0">
            <p className="text-xs text-sidebar-foreground/60 text-center">
              <a
                href="https://qumbar.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                Contact Developer
              </a>
            </p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 sticky top-0 z-10">
          <h2 className="text-xl font-semibold text-foreground">All your QA tools. One clean hub.</h2>
          <ThemeToggle />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
