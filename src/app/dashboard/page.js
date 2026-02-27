"use client";
import { useEffect, useState } from "react";
import {
  TrendingUp,
  Users,
  MessageSquare,
  Download,
  ChevronUp,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";
import { db } from "../../lib/firebase";
import { collection, getDocs, query, limit, orderBy } from "firebase/firestore";
import UsageChart from "./components/UsageChart";

export default function DashboardHome() {
  const [stats, setStats] = useState({
    earnings: "₹0",
    chats: "0",
    users: "0+",
    messages: "0"
  });

  const [activeUsers, setActiveUsers] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);

  useEffect(() => {
    async function fetchStats() {
      try {
        // 1. Fetch Earnings from payments collection
        const qPayments = query(collection(db, "payments"), orderBy("createdAt", "desc"));
        const paymentsSnap = await getDocs(qPayments);

        let totalEarnings = 0;
        const txs = [];

        paymentsSnap.forEach((doc) => {
          const data = doc.data();
          totalEarnings += Number(data.amount || 0);
          txs.push({
            id: doc.id,
            email: data.email || "Unknown",
            amount: data.amount,
            billingCycle: data.billingCycle,
            createdAt: data.createdAt?.toDate() || new Date(),
          });
        });

        setRecentTransactions(txs.slice(0, 10)); // Show last 10 transactions

        const chatsSnap = await getDocs(collection(db, "chats"));
        const totalChats = chatsSnap.size;

        let messageCount = 0;
        const userIds = new Set();
        const userDataMap = new Map();

        // Parallelizing sub-collection fetches for performance
        const messagePromises = chatsSnap.docs.map(async (doc) => {
          const chatData = doc.data();
          if (chatData.userId) {
            userIds.add(chatData.userId);
            // Store user data
            if (chatData.userEmail || chatData.userName) {
              userDataMap.set(chatData.userId, {
                email: chatData.userEmail,
                name: chatData.userName,
                photoURL: chatData.userPhotoURL,
                lastActive: chatData.createdAt || chatData.updatedAt
              });
            }
          }

          const msgSnap = await getDocs(collection(db, "chats", doc.id, "messages"));
          return msgSnap.size;
        });

        const results = await Promise.all(messagePromises);
        messageCount = results.reduce((acc, curr) => acc + curr, 0);

        setStats({
          earnings: `₹${totalEarnings.toLocaleString()}`,
          chats: totalChats.toString(),
          users: userIds.size.toString() + "+",
          messages: messageCount.toString()
        });

        // Convert user data to array and set active users
        const usersArray = Array.from(userDataMap.entries()).map(([userId, data]) => ({
          id: userId,
          ...data
        }));
        setActiveUsers(usersArray.slice(0, 5)); // Show top 5 active users
      } catch (err) {
        console.error("Dashboard: Error fetching stats:", err);
      }
    }
    fetchStats();
  }, []);

  const statCards = [
    { label: "Real Earnings", value: stats.earnings, icon: TrendingUp, color: "text-orange-500", bg: "bg-orange-50", update: "Just now" },
    { label: "Total Users", value: stats.users || "0+", icon: Users, color: "text-emerald-500", bg: "bg-emerald-50", update: "Real-time" },
    { label: "Total Chats", value: stats.chats, icon: CheckCircle2, color: "text-[#4d6bfe]", bg: "bg-[#4d6bfe]/10", update: "Real-time" },
    { label: "Total Messages", value: stats.messages, icon: MessageSquare, color: "text-blue-500", bg: "bg-blue-50", update: "Real-time" },
  ];

  const handleDownloadReport = async () => {
    try {
      const qPayments = query(collection(db, "payments"), orderBy("createdAt", "desc"));
      const paymentsSnap = await getDocs(qPayments);

      if (paymentsSnap.empty) {
        alert("No transaction data available to download.");
        return;
      }

      // 1. Prepare CSV Header
      let csvContent = '"Transaction ID","User Email","Amount (INR)","Billing Cycle","Date","Time"\n';

      // Helper to escape CSV values
      const esc = (val) => `"${String(val || "").replace(/"/g, '""')}"`;

      // 2. Add Row Data
      paymentsSnap.forEach((doc) => {
        const data = doc.data();
        const dateObj = data.createdAt?.toDate() || new Date();
        const date = dateObj.toLocaleDateString('en-GB');
        const time = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        csvContent += `${esc(doc.id)},${esc(data.email)},${esc(data.amount)},${esc(data.billingCycle)},${esc(date)},${esc(time)}\n`;
      });

      // 3. Trigger Browser Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Bluebox_Earnings_Report_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Export Error:", err);
      alert("Failed to export report.");
    }
  };

  return (
    <div className="space-y-16 pb-20">

      {/* Breadcrumbs & Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b-4 border-[#1c1917] pb-10">
        <div>
          <h2 className="text-5xl font-black text-[#1c1917] tracking-tighter uppercase leading-none">
            Welcome, <span className="text-[#4d6bfe]">Admin</span>
          </h2>
          <div className="flex items-center gap-4 text-[10px] text-stone-400 mt-6 font-black uppercase tracking-[0.3em]">
            <span className="hover:text-[#1c1917] cursor-pointer transition-human">System</span>
            <span className="text-stone-200">/</span>
            <span className="text-[#1c1917] border-b-2 border-[#1c1917]">Dashboard Overview</span>
          </div>
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleDownloadReport}
            className="group flex items-center gap-3 px-8 py-4 bg-[#1c1917] text-white border-2 border-[#1c1917] text-[11px] font-black uppercase tracking-widest transition-human active:scale-95"
          >
            <Download size={18} />
            Export Data
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border-2 border-[#1c1917]">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            className={`p-10 bg-white border-[#1c1917] ${i < 3 ? 'md:border-r-2' : ''} ${i < 4 ? 'border-b-2 lg:border-b-0' : ''} transition-human cursor-pointer hover:bg-stone-50`}
          >
            <div className="flex justify-between items-start mb-12">
              <div className={`p-4 border-2 border-[#1c1917] ${card.bg} ${card.color} group-hover:bg-white transition-human`}>
                <card.icon size={28} strokeWidth={3} />
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2">{card.label}</p>
                <h3 className="text-4xl font-black text-[#1c1917] tracking-tighter tabular-nums">{card.value}</h3>
              </div>
            </div>

            <div className="flex items-center justify-between mb-6">
              <div className={`h-10 flex items-end gap-1.5 opacity-30 ${card.color}`}>
                {[0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 0.4].map((h, i) => (
                  <div key={i} className="w-1.5 bg-current" style={{ height: `${h * 100}%` }} />
                ))}
              </div>
              <span className="text-[11px] font-black text-emerald-600 border border-emerald-200 px-3 py-1 bg-emerald-50">+12.5%</span>
            </div>

            <div className="flex items-center gap-3 text-[9px] font-black text-stone-400 border-t border-stone-100 pt-6 uppercase tracking-widest">
              <Clock size={14} className="opacity-50" />
              <span>Auto-synched {card.update}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 border-2 border-[#1c1917]">
        {/* User Interaction Chart Area */}
        <div className="lg:col-span-3 border-b-2 border-[#1c1917]">
          <UsageChart />
        </div>

        {/* Recent Transactions Table - Box Style */}
        <div className="lg:col-span-2 bg-white flex flex-col border-r-2 border-[#1c1917]">
          <div className="p-10 pb-6 flex justify-between items-center border-b border-stone-100">
            <div>
              <h4 className="text-2xl font-black text-[#1c1917] tracking-tighter uppercase">Recent Activity</h4>
              <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest mt-2">Latest verified transactions</p>
            </div>
          </div>
          <div className="flex-1">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((tx, i) => (
                <div key={tx.id || i} className="flex items-center justify-between p-8 border-b border-stone-100 hover:bg-stone-50 transition-human group">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-white border-2 border-[#1c1917] flex items-center justify-center text-[#1c1917] group-hover:bg-[#1c1917] group-hover:text-white transition-human">
                      <TrendingUp size={22} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-[#1c1917] uppercase tracking-tighter">{tx.email}</p>
                      <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest mt-1">Tier: PRO &middot; Cycle: {tx.billingCycle}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-[#1c1917] tabular-nums">₹{tx.amount}</p>
                    <p className="text-[9px] text-[#4d6bfe] font-black uppercase tracking-[0.2em] mt-1">Confirmed</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-24 text-center">
                <p className="text-stone-300 font-black uppercase tracking-[.3em] text-xs italic">System Idle</p>
              </div>
            )}
          </div>
        </div>

        {/* Status Panel - White Box Style */}
        <div className="bg-white flex flex-col text-[#1c1917]">
          <div className="p-10 pb-8 flex flex-col gap-8 border-b border-stone-100">
            <h4 className="text-2xl font-black uppercase tracking-tighter">Status Panel</h4>
            <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest -mt-4">Live Session Monitor</p>
          </div>

          {/* User Stats Summary at the Top */}
          <div className="p-10 border-b-2 border-stone-100 bg-stone-50/50">
            <div className="grid grid-cols-1 gap-4">
              <div className="border-2 border-[#1c1917] p-8 transition-human hover:bg-white active:scale-[0.98] group bg-white shadow-[4px_4px_0px_0px_#1c1917]">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-[.2em] mb-4">Total Population</p>
                <div className="flex items-end gap-3">
                  <p className="text-6xl font-black tabular-nums leading-none tracking-tighter">{stats.users || "0"}</p>
                  <div className="flex flex-col mb-1">
                    <span className="text-[10px] text-emerald-600 font-black uppercase">↑ Active</span>
                    <span className="text-[8px] text-stone-300 font-black uppercase">Live DB</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Active Users List Below Stats */}
          <div className="flex-1 p-4 space-y-1">
            <p className="px-5 py-3 text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Active Sessions</p>
            {activeUsers.length > 0 ? (
              activeUsers.map((user, i) => (
                <div key={user.id || i} className="flex items-center gap-5 p-5 border border-transparent hover:border-stone-200 hover:bg-stone-50 transition-human group cursor-pointer">
                  <div className="w-12 h-12 bg-white border-2 border-[#1c1917] flex items-center justify-center overflow-hidden shrink-0">
                    <img
                      src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email || 'User')}&background=random`}
                      className="w-full h-full object-cover"
                      alt="User avatar"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black truncate uppercase tracking-tighter">
                      {user.name || user.email?.split('@')[0] || "User"}
                    </p>
                    <p className="text-[10px] text-stone-400 font-black truncate opacity-60">
                      {user.email}
                    </p>
                  </div>
                  <div className="w-2.5 h-2.5 bg-emerald-500 border border-white" />
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-20">
                <Users size={40} strokeWidth={1} className="mb-6" />
                <p className="text-[10px] font-black uppercase tracking-widest">No Active Sessions</p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
