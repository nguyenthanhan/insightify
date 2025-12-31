import React, { useState, useEffect } from "react";
import { cn } from "../../lib/utils/cn";

export interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  badge?: number;
  children?: SidebarItem[];
  onClick?: () => void;
}

export interface SidebarProps {
  items: SidebarItem[];
  activeItem?: string;
  collapsed?: boolean;
  onToggle?: (collapsed: boolean) => void;
  onItemClick?: (item: SidebarItem) => void;
  logo?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

/**
 * Premium Sidebar Navigation with glassmorphism
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */
export function Sidebar({
  items,
  activeItem,
  collapsed: controlledCollapsed,
  onToggle,
  onItemClick,
  logo,
  footer,
  className,
}: SidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const collapsed = controlledCollapsed ?? internalCollapsed;

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Slide-in animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleToggle = () => {
    const newCollapsed = !collapsed;
    setInternalCollapsed(newCollapsed);
    onToggle?.(newCollapsed);
  };

  const handleItemClick = (item: SidebarItem) => {
    item.onClick?.();
    onItemClick?.(item);
    if (isMobile) setMobileOpen(false);
  };

  // Mobile drawer
  if (isMobile) {
    return (
      <>
        {/* Mobile toggle button */}
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-4 left-4 z-40 p-2 rounded-lg glass-card md:hidden"
          aria-label="Open menu"
        >
          <MenuIcon />
        </button>

        {/* Backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden animate-fade-in"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Mobile drawer */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-72 glass-panel transform transition-transform duration-300 ease-out md:hidden",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <SidebarContent
            items={items}
            activeItem={activeItem}
            collapsed={false}
            onItemClick={handleItemClick}
            onClose={() => setMobileOpen(false)}
            logo={logo}
            footer={footer}
            showClose
          />
        </aside>
      </>
    );
  }

  // Desktop sidebar
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 glass-panel transition-all duration-300 ease-out",
        collapsed ? "w-20" : "w-64",
        mounted ? "translate-x-0" : "-translate-x-full",
        className
      )}
    >
      <SidebarContent
        items={items}
        activeItem={activeItem}
        collapsed={collapsed}
        onItemClick={handleItemClick}
        onToggle={handleToggle}
        logo={logo}
        footer={footer}
      />
    </aside>
  );
}

interface SidebarContentProps {
  items: SidebarItem[];
  activeItem?: string;
  collapsed: boolean;
  onItemClick: (item: SidebarItem) => void;
  onToggle?: () => void;
  onClose?: () => void;
  logo?: React.ReactNode;
  footer?: React.ReactNode;
  showClose?: boolean;
}

function SidebarContent({
  items,
  activeItem,
  collapsed,
  onItemClick,
  onToggle,
  onClose,
  logo,
  footer,
  showClose,
}: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        {logo && !collapsed && (
          <div className="flex-1 animate-fade-in">{logo}</div>
        )}
        {showClose ? (
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close menu"
          >
            <CloseIcon />
          </button>
        ) : (
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors ml-auto"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </button>
        )}
      </div>

      {/* Navigation items */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {items.map((item) => (
            <SidebarNavItem
              key={item.id}
              item={item}
              active={activeItem === item.id}
              collapsed={collapsed}
              onClick={() => onItemClick(item)}
            />
          ))}
        </ul>
      </nav>

      {/* Footer */}
      {footer && !collapsed && (
        <div className="p-4 border-t border-white/10 animate-fade-in">
          {footer}
        </div>
      )}
    </div>
  );
}

interface SidebarNavItemProps {
  item: SidebarItem;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}

function SidebarNavItem({
  item,
  active,
  collapsed,
  onClick,
}: SidebarNavItemProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <li className="relative">
      <button
        onClick={onClick}
        onMouseEnter={() => collapsed && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
          "hover:bg-white/10 hover:scale-[1.02]",
          active &&
            "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-500 dark:text-blue-400",
          !active && "text-gray-700 dark:text-gray-300"
        )}
      >
        {/* Icon */}
        <span
          className={cn(
            "flex-shrink-0 w-5 h-5",
            active && "text-blue-500 dark:text-blue-400"
          )}
        >
          {item.icon}
        </span>

        {/* Label */}
        {!collapsed && (
          <span className="flex-1 text-left text-sm font-medium truncate animate-fade-in">
            {item.label}
          </span>
        )}

        {/* Badge */}
        {item.badge !== undefined && item.badge > 0 && !collapsed && (
          <span className="px-2 py-0.5 text-xs font-medium bg-blue-500 text-white rounded-full animate-fade-in">
            {item.badge > 99 ? "99+" : item.badge}
          </span>
        )}

        {/* Active indicator */}
        {active && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-r-full" />
        )}
      </button>

      {/* Tooltip for collapsed mode */}
      {collapsed && showTooltip && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 glass-tooltip text-sm font-medium whitespace-nowrap z-50 animate-fade-in">
          {item.label}
          {item.badge !== undefined && item.badge > 0 && (
            <span className="ml-2 px-1.5 py-0.5 text-xs bg-blue-500 text-white rounded-full">
              {item.badge}
            </span>
          )}
        </div>
      )}
    </li>
  );
}

// Icons
function MenuIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 19l-7-7 7-7"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  );
}

export default Sidebar;
