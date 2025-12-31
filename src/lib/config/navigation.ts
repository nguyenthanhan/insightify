import React, { ReactNode } from "react";
import {
  DollarSign,
  BarChart3,
  LayoutDashboard,
  Settings,
  Users,
  ShoppingCart,
  LucideIcon,
} from "lucide-react";
import { DashboardType } from "@/types/agent";

export interface NavigationItem {
  id: DashboardType;
  label: string;
  icon: ReactNode;
  badge?: number;
}

// Create navigation items with icons
export function createNavigationItems(): NavigationItem[] {
  return [
    {
      id: "sales",
      label: "Sales",
      icon: React.createElement(DollarSign),
      badge: 3,
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: React.createElement(BarChart3),
    },
    {
      id: "financial",
      label: "Financial",
      icon: React.createElement(LayoutDashboard),
    },
    {
      id: "operations",
      label: "Operations",
      icon: React.createElement(Settings),
    },
    { id: "hr", label: "HR", icon: React.createElement(Users) },
    {
      id: "ecommerce",
      label: "E-Commerce",
      icon: React.createElement(ShoppingCart),
    },
  ];
}

// Navigation item labels map
export const NAVIGATION_LABELS: Record<DashboardType, string> = {
  sales: "Sales",
  analytics: "Analytics",
  financial: "Financial",
  operations: "Operations",
  hr: "HR",
  ecommerce: "E-Commerce",
};

// Get label for dashboard type
export function getDashboardLabel(type: DashboardType): string {
  return NAVIGATION_LABELS[type] || "Dashboard";
}
