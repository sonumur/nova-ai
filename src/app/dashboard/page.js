"use client";
import { useEffect, useState } from "react";
import {
  TrendingUp,
  Users,
  MessageSquare,
  Download,
  MoreHorizontal,
  ChevronUp,
  ChevronDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  Maximize
} from "lucide-react";
import { motion } from "framer-motion";
import { db } from "../../lib/firebase";
import { collection, getDocs, query, limit, orderBy } from "firebase/firestore";

export default function DashboardHome() {
  const [stats, setStats] = useState({
    earnings: "$30,200",
    pageViews: "290+",
    chats: "145",
    messages: "500"
  });

  const [recentChats, setRecentChats] = useState([]);
  const [liveInteractions, setLiveInteractions] = useState([10, 25, 12, 30, 18, 22, 10]);
  const [interactionRate, setInteractionRate] = useState(12);
  const [rpmDelta, setRpmDelta] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveInteractions(prev => {
        const next = Math.floor(Math.random() * 30) + 5;
        const last = prev[prev.length - 1];
        const delta = ((next - last) / last) * 100;
        setRpmDelta(Math.round(delta));
        return [...prev.slice(1), next];
      });
      setInteractionRate(Math.floor(Math.random() * 15) + 10);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function fetchStats() {
      try {
        const chatsSnap = await getDocs(collection(db, "chats"));
        const totalChats = chatsSnap.size;

        let messageCount = 0;
        const userIds = new Set();

        // Parallelizing sub-collection fetches for performance
        const messagePromises = chatsSnap.docs.map(async (doc) => {
          const chatData = doc.data();
          if (chatData.userId) userIds.add(chatData.userId);

          const msgSnap = await getDocs(collection(db, "chats", doc.id, "messages"));
          return msgSnap.size;
        });

        const results = await Promise.all(messagePromises);
        messageCount = results.reduce((acc, curr) => acc + curr, 0);

        setStats(prev => ({
          ...prev,
          chats: totalChats.toString(),
          users: userIds.size.toString() + "+",
          messages: messageCount.toString()
        }));

        const q = query(collection(db, "chats"), orderBy("createdAt", "desc"), limit(5));
        const recentSnap = await getDocs(q);
        setRecentChats(recentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Dashboard: Error fetching stats:", err);
      }
    }
    fetchStats();
  }, []);

  const statCards = [
    { label: "All Earnings", value: stats.earnings, icon: TrendingUp, gradient: "from-[#fe8c00] to-[#f83600]", update: "Just now" },
    { label: "Total Users", value: stats.users || "0+", icon: Users, gradient: "from-[#00b09b] to-[#96c93d]", update: "Real-time" },
    { label: "Total Chats", value: stats.chats, icon: CheckCircle2, gradient: "from-[#ee0979] to-[#ff6a00]", update: "Real-time" },
    { label: "Total Messages", value: stats.messages, icon: MessageSquare, gradient: "from-[#00c6ff] to-[#0072ff]", update: "Real-time" },
  ];

  return (
    <div className="space-y-8 pb-12">

      {/* Breadcrumbs */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Dashboard</h2>
          <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
            <span className="hover:text-[#4d6bfe] cursor-pointer">Dashboard</span>
            <span>/</span>
            <span className="text-gray-500 font-medium">Default</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
            Lifetime
          </button>
          <button className="px-4 py-2 bg-[#4d6bfe] rounded-lg text-xs font-bold text-white hover:bg-[#3d56d1] transition-colors shadow-md shadow-[#4d6bfe]/20">
            Download Report
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`relative overflow-hidden rounded-2xl p-6 text-white shadow-lg bg-gradient-to-br ${card.gradient}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-medium opacity-90">{card.label}</p>
                <h3 className="text-3xl font-bold mt-1 tracking-tight">{card.value}</h3>
              </div>
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <card.icon size={20} />
              </div>
            </div>

            {/* Visual Chart Placeholder (Mini Wave) */}
            <div className="h-8 flex items-end gap-1 mb-4 opacity-50 text-white">
              {[0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 0.4].map((h, i) => (
                <div key={i} className="flex-1 bg-white rounded-t-sm" style={{ height: `${h * 100}%` }} />
              ))}
            </div>

            <div className="flex items-center gap-1.5 text-[10px] font-bold opacity-80 border-t border-white/20 pt-3">
              <Clock size={12} />
              <span>update : {card.update}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Interaction Chart Area */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm overflow-hidden h-full">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h4 className="text-lg font-bold text-gray-800">User Interaction</h4>
                <p className="text-xs text-gray-400 mt-1">Real-time interaction frequency across the platform</p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-gray-400">Interaction Rate</p>
                  <div className="flex items-center justify-end gap-2">
                    {rpmDelta !== 0 && (
                      <div className={`flex items-center gap-0.5 text-[10px] font-black ${rpmDelta > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {rpmDelta > 0 ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        {Math.abs(rpmDelta)}%
                      </div>
                    )}
                    <p className="text-lg font-black text-[#4d6bfe] tabular-nums">{interactionRate} <span className="text-[10px] font-bold text-gray-400">RPM</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#4d6bfe] animate-pulse"></div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Live</span>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <MoreHorizontal size={20} />
                </button>
              </div>
            </div>

            {/* SVG Chart Implementation */}
            <div className="relative h-[250px] w-full mt-12">
              <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
                <defs>
                  <linearGradient id="chartGradientInner" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4d6bfe" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#4d6bfe" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                {[0, 10, 20, 30, 40].map(val => (
                  <line key={val} x1="0" y1={val} x2="100" y2={val} stroke="#f3f4f6" strokeWidth="0.1" />
                ))}

                {/* The Path */}
                <motion.path
                  d={`M ${liveInteractions.map((v, i) => `${i * 16.6},${40 - v}`).join(" L ")}`}
                  fill="none"
                  stroke="#4d6bfe"
                  strokeWidth="0.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  animate={{ d: `M ${liveInteractions.map((v, i) => `${i * 16.6},${40 - v}`).join(" L ")}` }}
                  transition={{ duration: 0.5 }}
                />

                {/* Area Fill */}
                <motion.path
                  d={`M ${liveInteractions.map((v, i) => `${i * 16.6},${40 - v}`).join(" L ")} L 100,40 L 0,40 Z`}
                  fill="url(#chartGradientInner)"
                  animate={{ d: `M ${liveInteractions.map((v, i) => `${i * 16.6},${40 - v}`).join(" L ")} L 100,40 L 0,40 Z` }}
                  transition={{ duration: 0.5 }}
                />

                {/* Points */}
                {liveInteractions.map((v, i) => (
                  <motion.circle
                    key={i}
                    cx={i * 16.6}
                    cy={40 - v}
                    r="0.8"
                    fill="white"
                    stroke="#4d6bfe"
                    strokeWidth="0.2"
                    animate={{ cy: 40 - v }}
                    transition={{ duration: 0.5 }}
                  />
                ))}
              </svg>

              {/* Labels */}
              <div className="absolute bottom-[-24px] w-full flex justify-between text-[10px] font-bold text-gray-400">
                <span>9:00 AM</span>
                <span>10:00 AM</span>
                <span>11:00 AM</span>
                <span>12:00 PM</span>
                <span>1:00 PM</span>
                <span>2:00 PM</span>
                <span>Now</span>
              </div>
            </div>
          </div>
        </div>

        {/* Project Risk Card */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col items-center">
          <h4 className="text-lg font-bold text-gray-800 self-start mb-8 text-center w-full">Project Risk</h4>
          <div className="relative w-48 h-48 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" stroke="#f3f4f6" strokeWidth="8" fill="none" />
              <circle
                cx="50" cy="50" r="40"
                stroke="#fb923c" strokeWidth="8"
                strokeDasharray="251" strokeDashoffset="180"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-gray-800">5</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Status</span>
            </div>
          </div>
          <div className="mt-8 text-center">
            <p className="text-sm font-bold text-gray-700">Balanced</p>
            <button className="text-xs text-orange-500 font-bold mt-1 hover:underline">Change Your Risk</button>
          </div>
          <div className="w-full grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-gray-100">
            <div className="text-center">
              <p className="text-[10px] text-gray-400 font-bold uppercase">Nr</p>
              <p className="text-xs font-bold text-gray-700 mt-1">AWS 2455</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-gray-400 font-bold uppercase">Created</p>
              <p className="text-xs font-bold text-gray-700 mt-1">30th Sep</p>
            </div>
          </div>
          <button className="w-full mt-6 py-3 bg-orange-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all">
            Download Overall Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Application Sales Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-8 pb-4 flex justify-between items-center">
            <h4 className="text-lg font-bold text-gray-800">Application Sales</h4>
            <button className="text-gray-400 hover:text-gray-600">
              <Maximize size={16} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left bg-white">
              <thead className="bg-white text-gray-400 border-b border-gray-50">
                <tr>
                  <th className="px-8 py-4 text-[10px] font-extrabold uppercase tracking-widest">Application</th>
                  <th className="px-8 py-4 text-[10px] font-extrabold uppercase tracking-widest">Sales</th>
                  <th className="px-8 py-4 text-[10px] font-extrabold uppercase tracking-widest">Change</th>
                  <th className="px-8 py-4 text-[10px] font-extrabold uppercase tracking-widest text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[
                  { name: "Able Pro", sub: "Powerful Admin Theme", sales: "16,300", change: "up", price: "$53", total: "$15,652", color: "text-emerald-500" },
                  { name: "Photoshop", sub: "Design Software", sales: "26,421", change: "down", price: "$35", total: "$18,785", color: "text-blue-500" },
                  { name: "Guruable", sub: "Best Admin Template", sales: "8,265", change: "wave", price: "$98", total: "$9,652", color: "text-pink-500" },
                  { name: "Flatable", sub: "Admin App", sales: "10,652", change: "up", price: "$20", total: "$7,856", color: "text-indigo-500" },
                ].map((app, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-sm border-2 border-[#e5e5e5] group-hover:border-[#4d6bfe] transition-colors"></div>
                        <div>
                          <p className="text-sm font-bold text-gray-700">{app.name}</p>
                          <p className="text-[10px] text-gray-400">{app.sub}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm font-bold text-gray-700">{app.sales}</td>
                    <td className="px-8 py-5">
                      {/* Mini Chart Mock */}
                      <div className="h-6 w-16">
                        <svg className="w-full h-full" viewBox="0 0 40 20">
                          <path
                            d={app.change === 'up' ? "M 0 15 L 10 10 L 20 12 L 30 5 L 40 8" : app.change === 'down' ? "M 0 5 L 10 12 L 20 8 L 30 15 L 40 12" : "M 0 10 Q 10 0 20 10 T 40 10"}
                            stroke="currentColor"
                            className={app.color}
                            strokeWidth="2"
                            fill="none"
                          />
                        </svg>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <p className="text-xs text-gray-400 mb-0.5">{app.price}</p>
                      <p className={`text-sm font-black ${app.color}`}>{app.total}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-6 border-t border-gray-50 flex justify-center">
            <button className="text-xs font-bold text-[#4d6bfe] hover:underline">View all Projects</button>
          </div>
        </div>

        {/* User Activity Side Block */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-8 pb-4 flex flex-col gap-6">
            <h4 className="text-lg font-bold text-gray-800">User Activity</h4>

            {/* User Stats Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#f9f9f9] rounded-2x1 p-4 border border-gray-100 shadow-sm transition-all hover:bg-white hover:shadow-md group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-[#4d6bfe]/10 flex items-center justify-center text-[#4d6bfe]">
                    <Users size={16} />
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest group-hover:text-gray-600">Total Users</span>
                </div>
                <p className="text-xl font-black text-gray-800 tabular-nums">{stats.users || "0"}</p>
              </div>
              <div className="bg-[#f9f9f9] rounded-2x1 p-4 border border-gray-100 shadow-sm transition-all hover:bg-white hover:shadow-md group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest group-hover:text-gray-600">Active Now</span>
                </div>
                <p className="text-xl font-black text-gray-800 tabular-nums">
                  {Math.max(1, Math.floor(parseInt(stats.users) * 0.15) || 1)}
                </p>
              </div>
            </div>
          </div>
          <div className="flex-1 px-8 py-4 space-y-6">
            {(recentChats.length > 0 ? recentChats : [1, 2, 3, 4]).map((chat, i) => (
              <div key={i} className="flex gap-4 group cursor-pointer hover:translate-x-1 transition-transform">
                <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm relative shrink-0">
                  <img src={`https://ui-avatars.com/api/?name=Chat+${i}&background=random`} className="w-full h-full" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-xs font-bold text-gray-700 truncate">{chat.title || "Anonymous User"}</p>
                    <span className="text-[9px] text-gray-400 font-bold whitespace-nowrap">2 min ago</span>
                  </div>
                  <p className="text-[11px] text-gray-400 line-clamp-2">
                    {chat.id ? "Interacted with Bluebox Assistant" : "Lorem Ipsum is simply dummy text."}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-6 border-t border-gray-50 flex justify-center">
            <button className="text-xs font-bold text-[#4d6bfe] hover:underline">View all Activity</button>
          </div>
        </div>
      </div>

    </div>
  );
}
