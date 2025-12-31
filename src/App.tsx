import { useEffect, useCallback, memo, useState, lazy, Suspense } from "react";
import {
  Moon,
  Sun,
  LayoutDashboard,
  BarChart3,
  DollarSign,
  Users,
  ShoppingCart,
  Settings,
} from "lucide-react";
import { useAgentStore } from "./store/agentStore";
import { ErrorBoundary } from "./components/error/ErrorBoundary";
import {
  ErrorFallback,
  CompactErrorFallback,
} from "./components/error/ErrorFallback";
import { Sidebar, SidebarItem } from "./components/layout/Sidebar";
import { Header, Notification } from "./components/layout/Header";
import { DashboardSkeleton } from "./components/skeletons";

// Lazy load heavy components
const DashboardTemplate = lazy(
  () => import("./components/dashboard/DashboardTemplate"),
);
const ChatDialog = lazy(() => import("./components/chat/ChatDialog"));
const ChatButton = lazy(() => import("./components/chat/ChatButton"));

// Memoized Dashboard component to prevent unnecessary re-renders
const MemoizedDashboard = memo(DashboardTemplate);

// Sidebar navigation items
const sidebarItems: SidebarItem[] = [
  { id: "sales", label: "Sales", icon: <DollarSign size={20} />, badge: 3 },
  { id: "analytics", label: "Analytics", icon: <BarChart3 size={20} /> },
  { id: "financial", label: "Financial", icon: <LayoutDashboard size={20} /> },
  { id: "operations", label: "Operations", icon: <Settings size={20} /> },
  { id: "hr", label: "HR", icon: <Users size={20} /> },
  { id: "ecommerce", label: "E-Commerce", icon: <ShoppingCart size={20} /> },
];

// Sample notifications
const sampleNotifications: Notification[] = [
  {
    id: "1",
    title: "New Sale",
    message: "You have a new sale of $1,234",
    type: "success",
    read: false,
    timestamp: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Alert",
    message: "Revenue target reached 90%",
    type: "warning",
    read: false,
    timestamp: new Date().toISOString(),
  },
  {
    id: "3",
    title: "Update",
    message: "Dashboard data refreshed",
    type: "info",
    read: true,
    timestamp: new Date().toISOString(),
  },
];

function App() {
  const { userPreferences, setTheme, setDashboard } = useAgentStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifications, setNotifications] = useState(sampleNotifications);

  useEffect(() => {
    // Apply theme on mount
    if (userPreferences.theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [userPreferences.theme]);

  const toggleTheme = useCallback(() => {
    const newTheme = userPreferences.theme === "light" ? "dark" : "light";
    setTheme(newTheme);
  }, [userPreferences.theme, setTheme]);

  const handleSidebarItemClick = useCallback(
    (item: SidebarItem) => {
      setDashboard(item.id as any);
    },
    [setDashboard],
  );

  const handleNotificationClick = useCallback((notification: Notification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)),
    );
  }, []);

  const currentUser = {
    name: "John Doe",
    email: "john@example.com",
  };

  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <ErrorFallback
          error={error}
          onReset={reset}
          title="Application Error"
          message="Something went wrong with the application. Please try again."
          showDetails
        />
      )}
    >
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Sidebar */}
        <Sidebar
          items={sidebarItems}
          activeItem={userPreferences.dashboardType || "sales"}
          collapsed={sidebarCollapsed}
          onToggle={setSidebarCollapsed}
          onItemClick={handleSidebarItemClick}
          logo={
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <LayoutDashboard size={18} className="text-white" />
              </div>
              <span className="font-bold text-gray-900 dark:text-white">
                Dashboard
              </span>
            </div>
          }
        />

        {/* Main Content Area */}
        <div
          className={`transition-all duration-300 ${
            sidebarCollapsed ? "md:ml-20" : "md:ml-64"
          }`}
        >
          {/* Header */}
          <Header
            title={
              sidebarItems.find((i) => i.id === userPreferences.dashboardType)
                ?.label || "Sales"
            }
            subtitle="Modern AI-Powered Analytics"
            notifications={notifications}
            user={currentUser}
            onNotificationClick={handleNotificationClick}
            sidebarCollapsed={sidebarCollapsed}
          />

          {/* Theme Toggle (floating) */}
          <button
            onClick={toggleTheme}
            className="fixed bottom-24 right-6 z-30 p-3 rounded-full glass-card shadow-lg hover:scale-105 transition-transform"
            aria-label="Toggle theme"
          >
            {userPreferences.theme === "light" ? (
              <Moon size={20} className="text-gray-700 dark:text-gray-300" />
            ) : (
              <Sun size={20} className="text-gray-700 dark:text-gray-300" />
            )}
          </button>

          {/* Main Content */}
          <main className="p-6">
            <ErrorBoundary
              fallback={(error, reset) => (
                <CompactErrorFallback error={error} onReset={reset} />
              )}
            >
              <div className="glass-card rounded-xl p-6">
                <Suspense fallback={<DashboardSkeleton />}>
                  <MemoizedDashboard
                    dashboardType={userPreferences.dashboardType || "sales"}
                  />
                </Suspense>
              </div>
            </ErrorBoundary>
          </main>
        </div>

        {/* Chat Components */}
        <ErrorBoundary
          fallback={(error, reset) => (
            <CompactErrorFallback error={error} onReset={reset} />
          )}
        >
          <Suspense fallback={null}>
            <ChatButton />
            <ChatDialog />
          </Suspense>
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
}

export default App;
