import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  LogOut,
  User as UserIcon,
  Users,
  Building2,
  FileText,
  ChevronLeft,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNotifications } from "../../context/NotificationContext.jsx";
import { timeAgo, toJalali } from "../../utils/formatters.js";
import { ROLE_LABELS } from "../../utils/constants.js";
import { customerService } from "../../services/customerService.js";
import { propertyService } from "../../services/propertyService.js";
import { contractService } from "../../services/contractService.js";
import Avatar from "../common/Avatar.jsx";
import Badge from "../common/Badge.jsx";

/**
 * Header بالا با:
 * - دکمه منوی موبایل
 * - جستجوی سراسری (customers, properties, contracts)
 * - toggle تم
 * - زنگ اعلان‌ها
 * - منوی کاربر
 */
export default function Header({ onMenuClick, sidebarCollapsed }) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();
  const navigate = useNavigate();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState({
    customers: [],
    properties: [],
    contracts: [],
  });
  const [searching, setSearching] = useState(false);
  const searchRef = useRef(null);
  const searchTimer = useRef(null);

  // جستجوی سراسری با debounce
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults({ customers: [], properties: [], contracts: [] });
      setSearching(false);
      return;
    }
    setSearching(true);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      try {
        const [customers, properties, contracts] = await Promise.all([
          customerService.getAll({ q: searchTerm, _limit: 5 }),
          propertyService.getAll({ q: searchTerm, _limit: 5 }),
          contractService.getAll({ code_like: searchTerm, _limit: 5 }),
        ]);
        setSearchResults({ customers, properties, contracts });
      } catch (err) {
        console.error("خطا در جستجو:", err);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(searchTimer.current);
  }, [searchTerm]);

  // بستن dropdown جستجو با کلیک خارج
  useEffect(() => {
    if (!searchOpen) return;
    const onClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [searchOpen]);

  const totalResults =
    searchResults.customers.length +
    searchResults.properties.length +
    searchResults.contracts.length;

  return (
    <header
      className="sticky top-0 z-30 h-16 bg-surface/85 backdrop-blur-lg border-b border-border transition duration-300"
    >
      <div className="flex items-center justify-between gap-3 h-full px-4 lg:pr-8">
        {/* سمت راست: منوی موبایل + جستجو */}
        <div className="flex items-center gap-2 flex-1">
          <button
            onClick={onMenuClick}
            className="press-effect lg:hidden p-2 rounded-lg text-content hover:bg-surface-muted cursor-pointer transition-colors"
            aria-label="باز کردن منو"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* جستجوی سراسری */}
          <div className="relative flex-1 max-w-md" ref={searchRef}>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                placeholder="جستجوی مشتری، ملک، قرارداد…"
                className="w-full h-10 rounded-xl border border-border bg-surface pr-9 pl-4 text-sm text-content placeholder:text-content-muted/60 focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500"
              />
            </div>

            {searchOpen && searchTerm.trim() && (
              <div className="absolute top-full mt-2 right-0 left-0 bg-surface border border-border rounded-xl shadow-card-hover max-h-96 overflow-y-auto animate-scale-in origin-top z-50">
                {searching && (
                  <div className="p-4 text-center text-sm text-content-muted">
                    در حال جستجو…
                  </div>
                )}
                {!searching && totalResults === 0 && (
                  <div className="p-4 text-center text-sm text-content-muted">
                    نتیجه‌ای یافت نشد
                  </div>
                )}
                {!searching && totalResults > 0 && (
                  <div className="py-1.5">
                    {searchResults.customers.length > 0 && (
                      <div>
                        <div className="px-3 py-1.5 text-[11px] font-semibold text-content-muted uppercase tracking-wide flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" /> مشتریان
                        </div>
                        {searchResults.customers.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => {
                              navigate("/customers");
                              setSearchOpen(false);
                              setSearchTerm("");
                            }}
                            className="press-effect w-full text-right px-3 py-2 text-sm text-content hover:bg-surface-muted cursor-pointer flex items-center justify-between"
                          >
                            <span>{c.name}</span>
                            <ChevronLeft className="w-4 h-4 text-content-muted" />
                          </button>
                        ))}
                      </div>
                    )}
                    {searchResults.properties.length > 0 && (
                      <div>
                        <div className="px-3 py-1.5 text-[11px] font-semibold text-content-muted uppercase tracking-wide flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5" /> ملک‌ها
                        </div>
                        {searchResults.properties.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => {
                              navigate("/properties");
                              setSearchOpen(false);
                              setSearchTerm("");
                            }}
                            className="press-effect w-full text-right px-3 py-2 text-sm text-content hover:bg-surface-muted cursor-pointer flex items-center justify-between"
                          >
                            <span className="truncate">
                              {p.code} — {p.address}
                            </span>
                            <ChevronLeft className="w-4 h-4 text-content-muted shrink-0" />
                          </button>
                        ))}
                      </div>
                    )}
                    {searchResults.contracts.length > 0 && (
                      <div>
                        <div className="px-3 py-1.5 text-[11px] font-semibold text-content-muted uppercase tracking-wide flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" /> قراردادها
                        </div>
                        {searchResults.contracts.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => {
                              navigate("/contracts");
                              setSearchOpen(false);
                              setSearchTerm("");
                            }}
                            className="press-effect w-full text-right px-3 py-2 text-sm text-content hover:bg-surface-muted cursor-pointer flex items-center justify-between"
                          >
                            <span>{c.code}</span>
                            <ChevronLeft className="w-4 h-4 text-content-muted" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* سمت چپ: اکشن‌ها */}
        <div className="flex items-center gap-1.5">
          {/* Toggle تم */}
          <button
            onClick={toggleTheme}
            className="press-effect p-2 rounded-lg text-content hover:bg-surface-muted cursor-pointer transition-colors"
            aria-label={theme === "light" ? "حالت تاریک" : "حالت روشن"}
            title={theme === "light" ? "حالت تاریک" : "حالت روشن"}
          >
            {theme === "light" ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </button>

          {/* زنگ اعلان‌ها */}
          <div className="relative group">
            <button
              className="press-effect relative p-2 rounded-lg text-content hover:bg-surface-muted cursor-pointer transition-colors"
              aria-label="اعلان‌ها"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 left-1 min-w-4 h-4 px-1 rounded-full bg-error text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount.toLocaleString("fa-IR")}
                </span>
              )}
            </button>
            {/* Dropdown اعلان‌ها */}
            <div className="absolute left-0 top-full mt-1 w-80 bg-surface border border-border rounded-xl shadow-card-hover hidden group-hover:block z-50 animate-scale-in origin-top">
              <div className="flex items-center justify-between p-3 border-b border-border">
                <h4 className="text-sm font-semibold text-content">اعلان‌ها</h4>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="press-effect text-xs text-gold-600 hover:text-gold-700 cursor-pointer"
                  >
                    همه را خواندم
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-content-muted">
                    اعلانی وجود ندارد
                  </div>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <button
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`press-effect w-full text-right p-3 border-b border-border last:border-0 hover:bg-surface-muted cursor-pointer transition-colors ${!n.isRead ? "bg-gold-50/50 dark:bg-gold-900/10" : ""}`}
                    >
                      <div className="flex items-start gap-2.5">
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-gold-600 mt-1.5 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-content line-clamp-2">
                            {n.message}
                          </p>
                          <p className="text-[11px] text-content-muted mt-1">
                            {timeAgo(n.createdAt)}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* منوی کاربر */}
          <div className="relative group">
            <button className="press-effect flex items-center gap-2 p-2 rounded-lg hover:bg-surface-muted cursor-pointer transition-colors">
              <Avatar name={user?.name} size="sm" />
              <div className="hidden sm:block text-right">
                <p className="text-xs font-medium text-content leading-tight">
                  {user?.name}
                </p>
                <p className="text-[10px] text-content-muted">
                  {ROLE_LABELS[user?.role]}
                </p>
              </div>
            </button>
            <div className="absolute left-0 top-full mt-1 w-48 bg-surface border border-border rounded-xl shadow-card-hover hidden group-hover:block z-50 animate-scale-in origin-top py-1.5">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-sm font-medium text-content">{user?.name}</p>
                <p className="text-xs text-content-muted">{user?.email}</p>
              </div>
              <button
                onClick={() => navigate("/settings")}
                className="press-effect w-full text-right px-3 py-2 text-sm text-content hover:bg-surface-muted cursor-pointer flex items-center gap-2"
              >
                <UserIcon className="w-4 h-4" /> تنظیمات
              </button>
              <button
                onClick={logout}
                className="press-effect w-full text-right px-3 py-2 text-sm text-error hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" /> خروج
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
