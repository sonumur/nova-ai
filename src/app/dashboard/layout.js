"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  MessageSquare,
  Settings,
  LayoutDashboard,
  Users,
  BarChart3,
  Search,
  Maximize,
  LogOut,
  HelpCircle,
  Clock,
  Menu,
  X
} from "lucide-react";
import { auth } from "../../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useEffect, useState } from "react";

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  useEffect(() => {
    setMounted(true);
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);

      // Check if user is authorized
      if (u && u.email === ADMIN_EMAIL) {
        setIsAuthorized(true);
        setIsCheckingAuth(false);
      } else if (u) {
        // User is logged in but not authorized
        setIsAuthorized(false);
        setIsCheckingAuth(false);
        router.push("/unauthorized");
      } else {
        // No user logged in, redirect to admin login
        setIsAuthorized(false);
        setIsCheckingAuth(false);
        router.push("/admin/login");
      }
    });
    return () => unsubscribe();
  }, [router, ADMIN_EMAIL]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    document.title = "BlueBox AI - Admin Panel";
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const navGroups = [
    {
      label: "Navigation",
      items: [
        { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard", active: pathname === "/dashboard" },
      ]
    },
    {
      label: "AI Features",
      items: [
        { name: "Chat", icon: MessageSquare, href: "/dashboard/chat", active: pathname.startsWith("/dashboard/chat") },
      ]
    }
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/admin/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#4d6bfe] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-gray-500 font-medium">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Don't render dashboard if not authorized
  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="flex h-screen bg-[#fdfdfc] text-[#44403c] font-sans overflow-hidden human-grain">

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-[#1c1917]/10 backdrop-blur-[2px] z-20 lg:hidden transition-opacity duration-500"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 w-[270px] bg-[#fafaf9] border-r-2 border-[#1c1917] flex flex-col z-30
        transition-human lg:relative lg:translate-x-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Logo Area */}
        <div className="h-20 flex items-center px-8 bg-white border-b-2 border-[#1c1917]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#1c1917] flex items-center justify-center border border-[#1c1917]">
              <img src="/logo.svg" alt="Logo" className="w-6 h-6 brightness-0 invert" />
            </div>
            <span className="text-xl font-black text-[#1c1917] tracking-tighter uppercase leading-none">
              BLUEBOX<span className="text-[#4d6bfe]">.</span>AI
            </span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="ml-auto lg:hidden text-[#1c1917] hover:bg-stone-100 p-2 transition-human border border-transparent hover:border-[#1c1917]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <div className="px-4 py-8 border-b-2 border-[#1c1917] overflow-y-auto flex-1">
          <nav className="space-y-4">
            {navGroups.map((group) => (
              <div key={group.label}>
                <p className="text-[10px] uppercase font-black text-[#1c1917] tracking-[0.2em] mb-4 px-2">{group.label}</p>
                <div className="space-y-2">
                  {group.items.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`
                        flex items-center group px-4 py-3 transition-human border-2
                        ${item.active
                          ? "bg-[#1c1917] text-white border-[#1c1917]"
                          : "text-stone-500 bg-white border-white hover:border-[#1c1917] hover:text-[#1c1917]"}
                      `}
                    >
                      <item.icon size={18} className={`${item.active ? "text-white" : "text-stone-300 group-hover:text-[#1c1917]"} transition-human`} />
                      <span className="ml-3 text-[12px] font-black uppercase tracking-widest">{item.name}</span>
                      {item.badge && (
                        <span className={`ml-auto text-[8px] font-black px-2 py-0.5 border border-current tracking-tighter ${item.badgeColor || "text-[#4d6bfe]"}`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Admin Profile & Support */}
        <div className="mt-auto border-t-2 border-[#1c1917] bg-[#fdfdfc]">
          <button className="flex items-center gap-3 text-[#1c1917] hover:bg-stone-50 transition-human w-full py-4 px-6 active:scale-95 group">
            <HelpCircle size={18} className="text-stone-300 group-hover:text-[#1c1917]" />
            <span className="text-[11px] font-black uppercase tracking-widest">Support Hub</span>
          </button>

          {/* User Profile Area - ABSOLUTE BOTTOM */}
          <div className="bg-stone-50/50">
            <div
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-4 p-5 cursor-pointer hover:bg-stone-100/50 transition-human group border-t border-stone-100"
            >
              <div className="w-8 h-8 flex items-center justify-center shrink-0">
                <Users size={18} className="text-[#1c1917]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black text-[#1c1917] uppercase tracking-widest leading-none">
                  Master Admin
                </p>
                <p className="text-[8px] text-stone-400 font-bold uppercase tracking-tighter mt-1">
                  System Executive
                </p>
              </div>
              <div className={`transition-transform duration-300 ${isUserMenuOpen ? 'rotate-180' : ''}`}>
                <Menu size={10} className="text-stone-300 group-hover:text-[#1c1917]" />
              </div>
            </div>

            {/* User Details Dropup/Expansion */}
            {isUserMenuOpen && (
              <div className="px-5 pb-5">
                <div className="p-4 bg-white border-2 border-[#1c1917] mb-2">
                  <p className="text-[10px] font-black text-[#1c1917] uppercase truncate">
                    {user?.displayName || "Administrator"}
                  </p>
                  <p className="text-[9px] text-stone-400 font-bold truncate lowercase mt-1">
                    {user?.email}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-red-500 hover:bg-[#1c1917] hover:text-white border-2 border-red-100 hover:border-[#1c1917] transition-human font-black uppercase tracking-[0.2em] text-[8px]"
                >
                  <LogOut size={12} />
                  <span>Terminate Session</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header className="h-20 bg-white border-b-2 border-[#1c1917] flex items-center justify-between px-6 lg:px-12 z-10 sticky top-0">
          <div className="flex items-center flex-1 max-w-xl gap-6">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2.5 text-[#1c1917] border-2 border-[#1c1917] bg-white transition-human"
            >
              <Menu size={20} />
            </button>
            <div className="relative w-full max-w-[320px]">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-stone-400">
                <Search size={18} strokeWidth={2.5} />
              </span>
              <input
                type="text"
                placeholder="SEARCH..."
                className="w-full pl-11 pr-4 py-2 bg-stone-50 border-2 border-stone-100 focus:border-[#1c1917] focus:bg-white outline-none text-xs font-black tracking-widest placeholder-stone-300 transition-human"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 lg:gap-8">
            {/* Live Clock */}
            <div className="hidden lg:flex items-center gap-2.5 px-4 py-2 bg-white border-2 border-[#1c1917]">
              <Clock size={16} className="text-[#1c1917]" />
              <span className="text-[12px] font-black font-mono text-[#1c1917] tracking-tight">
                {mounted ? formatTime(currentTime) : "00:00:00"}
              </span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-8 lg:p-12 bg-[#fdfdfc] relative">
          <div className="max-w-7xl mx-auto h-full box-border-ui-container">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
