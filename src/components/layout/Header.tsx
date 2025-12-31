import React, { useState, useEffect, useRef } from "react";
import { cn } from "../../lib/utils/cn";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  timestamp: string;
}

export interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
}

export interface HeaderProps {
  title?: string;
  subtitle?: string;
  showSearch?: boolean;
  notifications?: Notification[];
  user?: UserProfile;
  onSearch?: (query: string) => void;
  onNotificationClick?: (notification: Notification) => void;
  onProfileClick?: () => void;
  onLogout?: () => void;
  className?: string;
  sidebarCollapsed?: boolean;
}

/**
 * Premium Header with glassmorphism and scroll effects
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */
export function Header({
  title = "Dashboard",
  subtitle,
  showSearch = true,
  notifications = [],
  user,
  onSearch,
  onNotificationClick,
  onProfileClick,
  onLogout,
  className,
  sidebarCollapsed,
}: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Focus search input when expanded
  useEffect(() => {
    if (searchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchExpanded]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header
      className={cn(
        "sticky top-0 z-20 transition-all duration-300",
        scrolled ? "glass-header py-2" : "bg-transparent py-4",
        sidebarCollapsed ? "ml-20" : "ml-64",
        "md:ml-0",
        className
      )}
    >
      <div className="flex items-center justify-between px-6">
        {/* Title section */}
        <div
          className={cn(
            "transition-all duration-300",
            scrolled ? "scale-95 origin-left" : ""
          )}
        >
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>
          {subtitle && !scrolled && (
            <p className="text-sm text-gray-500 dark:text-gray-400 animate-fade-in">
              {subtitle}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Search */}
          {showSearch && (
            <SearchBar
              expanded={searchExpanded}
              query={searchQuery}
              inputRef={searchInputRef}
              onToggle={() => setSearchExpanded(!searchExpanded)}
              onChange={setSearchQuery}
              onSubmit={handleSearchSubmit}
            />
          )}

          {/* Notifications */}
          <NotificationBell
            notifications={notifications}
            unreadCount={unreadCount}
            onNotificationClick={onNotificationClick}
          />

          {/* User menu */}
          {user && (
            <UserMenu
              user={user}
              onProfileClick={onProfileClick}
              onLogout={onLogout}
            />
          )}
        </div>
      </div>
    </header>
  );
}

// SearchBar component
interface SearchBarProps {
  expanded: boolean;
  query: string;
  inputRef: React.RefObject<HTMLInputElement>;
  onToggle: () => void;
  onChange: (query: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

function SearchBar({
  expanded,
  query,
  inputRef,
  onToggle,
  onChange,
  onSubmit,
}: SearchBarProps) {
  return (
    <form onSubmit={onSubmit} className="relative">
      <div
        className={cn(
          "flex items-center transition-all duration-300 ease-out",
          expanded ? "w-64" : "w-10"
        )}
      >
        <button
          type="button"
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          aria-label={expanded ? "Close search" : "Open search"}
        >
          <SearchIcon />
        </button>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search..."
          className={cn(
            "bg-transparent border-none outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400",
            "transition-all duration-300",
            expanded ? "w-full opacity-100 pl-2" : "w-0 opacity-0"
          )}
        />
      </div>

      {expanded && (
        <div className="absolute inset-0 -z-10 glass-card rounded-xl animate-fade-in" />
      )}
    </form>
  );
}

// NotificationBell component
interface NotificationBellProps {
  notifications: Notification[];
  unreadCount: number;
  onNotificationClick?: (notification: Notification) => void;
}

function NotificationBell({
  notifications,
  unreadCount,
  onNotificationClick,
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
        aria-label="Notifications"
      >
        <BellIcon />

        {/* Badge with pulse animation */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-white text-xs font-medium">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 glass-dropdown animate-slide-down">
          <div className="p-3 border-b border-white/10">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Notifications
            </h3>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications
              </div>
            ) : (
              notifications.slice(0, 5).map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => {
                    onNotificationClick?.(notification);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full p-3 text-left hover:bg-white/5 transition-colors",
                    !notification.read && "bg-blue-500/5"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <NotificationIcon type={notification.type} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {notification.message}
                      </p>
                    </div>
                    {!notification.read && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// UserMenu component
interface UserMenuProps {
  user: UserProfile;
  onProfileClick?: () => void;
  onLogout?: () => void;
}

function UserMenu({ user, onProfileClick, onLogout }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/10 transition-colors"
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 glass-dropdown animate-slide-down">
          <div className="p-3 border-b border-white/10">
            <p className="font-medium text-gray-900 dark:text-white">
              {user.name}
            </p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>

          <div className="p-2">
            <button
              onClick={() => {
                onProfileClick?.();
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-white/10 rounded-lg transition-colors"
            >
              <UserIcon />
              Profile
            </button>
            <button
              onClick={() => {
                onLogout?.();
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <LogoutIcon />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Icons
function SearchIcon() {
  return (
    <svg
      className="w-5 h-5 text-gray-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      className="w-5 h-5 text-gray-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
}

function NotificationIcon({ type }: { type: Notification["type"] }) {
  const colors = {
    info: "text-blue-500 bg-blue-100 dark:bg-blue-900/30",
    success: "text-green-500 bg-green-100 dark:bg-green-900/30",
    warning: "text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30",
    error: "text-red-500 bg-red-100 dark:bg-red-900/30",
  };

  return (
    <div className={cn("p-1.5 rounded-full", colors[type])}>
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </div>
  );
}

function UserIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
      />
    </svg>
  );
}

export default Header;
