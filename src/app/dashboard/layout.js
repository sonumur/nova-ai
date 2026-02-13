"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquare,
  Image as ImageIcon,
  Video,
  Settings,
  LayoutDashboard,
  Users,
  BarChart3,
  Bell,
  Search,
  Maximize,
  Moon,
  ChevronDown,
  LogOut,
  HelpCircle,
  FileText,
  Briefcase,
  Clock
} from "lucide-react";
import { auth } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

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
        { name: "Dashboard", icon: LayoutDashboard, href: "/dashbord", active: pathname === "/dashbord" },
        { name: "Analytics", icon: BarChart3, href: "/dashbord/analytics", badge: "NEW", badgeColor: "bg-blue-400" },
      ]
    },
    {
      label: "AI Features",
      items: [
        { name: "Chat", icon: MessageSquare, href: "/dashbord/chat", active: pathname.startsWith("/dashbord/chat") },
      ]
    },
    {
      label: "Administration",
      items: [
        { name: "Users", icon: Users, href: "/dashbord/users" },
        { name: "Settings", icon: Settings, href: "/dashbord/settings" },
      ]
    }
  ];

  return (
    <div className="flex h-screen bg-[#fcfcfc] text-gray-600 font-sans overflow-hidden">

      {/* Sidebar */}
      <aside className="w-[260px] bg-[#f9f9f9] border-r border-[#e5e5e5] flex flex-col z-20">
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 bg-white border-b border-[#e5e5e5]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#4d6bfe]/10 rounded-lg flex items-center justify-center p-1.5">
              <img src="/logo.svg" alt="Logo" className="w-full h-full" />
            </div>
            <span className="text-xl font-bold text-gray-800 tracking-tight italic">
              dashboard
            </span>
          </div>
          <button className="ml-auto text-gray-400 hover:text-gray-600 transition-colors">
            <Maximize size={16} />
          </button>
        </div>

        {/* User Stats Mini (Optional, based on ref) */}
        <div className="px-6 py-6 border-b border-[#e5e5e5]">
          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-4">Navigation</p>

          <nav className="space-y-1">
            {navGroups.map((group, gIdx) => (
              <div key={group.label} className={gIdx > 0 ? "pt-6" : ""}>
                {gIdx > 0 && <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-3 px-1">{group.label}</p>}
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`
                        flex items-center group px-3 py-2.5 rounded-xl transition-all duration-200
                        ${item.active
                          ? "bg-[#eef1ff] text-[#4d6bfe] font-semibold"
                          : "text-gray-500 hover:bg-gray-200/50 hover:text-gray-900"}
                      `}
                    >
                      <item.icon size={18} className={`${item.active ? "text-[#4d6bfe]" : "text-gray-400 group-hover:text-gray-600"} transition-colors`} />
                      <span className="ml-3 text-sm font-medium">{item.name}</span>
                      {item.badge && (
                        <span className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded text-white ${item.badgeColor || "bg-[#4d6bfe]"}`}>
                          {item.badge}
                        </span>
                      )}
                      {item.items && <ChevronDown size={14} className="ml-auto opacity-50" />}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom Help */}
        <div className="mt-auto p-6">
          <button className="flex items-center gap-3 text-gray-400 hover:text-gray-600 transition-colors w-full group">
            <HelpCircle size={18} />
            <span className="text-sm">Help & Support</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header className="h-16 bg-white border-b border-[#e5e5e5] flex items-center justify-between px-8 z-10">
          <div className="flex items-center flex-1 max-w-xl">
            <div className="relative w-full">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Search size={18} />
              </span>
              <input
                type="text"
                placeholder="Search or enter website name"
                className="w-full pl-10 pr-4 py-2 bg-transparent outline-none text-sm placeholder-gray-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Live Clock */}
            <div className="hidden md:flex items-center gap-2 px-4 py-1.5 bg-gray-50 rounded-xl border border-[#e5e5e5] shadow-inner">
              <Clock size={16} className="text-[#4d6bfe]" />
              <span className="text-sm font-black font-mono text-gray-700 tracking-tighter">
                {mounted ? formatTime(currentTime) : "00:00:00"}
              </span>
            </div>

            <button className="p-2 text-gray-400 hover:text-gray-600 relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-400 rounded-full border-2 border-white"></span>
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <MessageSquare size={20} />
            </button>

            <div className="h-8 w-[1px] bg-gray-200"></div>

            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-700 leading-none mb-1 group-hover:text-[#4d6bfe] transition-colors">
                  {user?.displayName || "John Doe"}
                </p>
                <p className="text-[10px] text-gray-400 font-medium">Administrator</p>
              </div>
              <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-100 shadow-sm relative group-hover:scale-105 transition-transform">
                <img
                  src={user?.photoURL || "https://ui-avatars.com/api/?name=Admin&background=random"}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <ChevronDown size={14} className="text-gray-400 group-hover:text-gray-600" />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-8 relative">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
