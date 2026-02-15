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
import UsageChart from "./components/UsageChart";

export default function DashboardHome() {
  const [stats, setStats] = useState({
    earnings: "$30,200",
    pageViews: "290+",
    chats: "145",
    messages: "500"
  });

  const [recentChats, setRecentChats] = useState([]);
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

        setStats(prev => ({
          ...prev,
          earnings: `₹${totalEarnings.toLocaleString()}`,
          chats: totalChats.toString(),
          users: userIds.size.toString() + "+",
          messages: messageCount.toString()
        }));

        // Convert user data to array and set active users
        const usersArray = Array.from(userDataMap.entries()).map(([userId, data]) => ({
          id: userId,
          ...data
        }));
        setActiveUsers(usersArray.slice(0, 5)); // Show top 5 active users

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
    <div className="space-y-8 pb-12">

      {/* Breadcrumbs */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Dashboard</h2>
          <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
            <span className="hover:text-[#4d6bfe] cursor-pointer">Dashboard</span>
            <span>/</span>
            <span className="text-gray-500 font-medium">Admin Overview</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadReport}
            className="px-4 py-2 bg-[#4d6bfe] rounded-lg text-xs font-bold text-white hover:bg-[#3d56d1] transition-colors shadow-md shadow-[#4d6bfe]/20"
          >
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
            className="group relative overflow-hidden rounded-3xl p-6 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{card.label}</p>
                <h3 className="text-3xl font-black text-gray-800 mt-2 tracking-tight">{card.value}</h3>
              </div>
              <div className={`p-3 rounded-2xl ${card.bg} ${card.color} group-hover:scale-110 transition-transform duration-300`}>
                <card.icon size={24} strokeWidth={2.5} />
              </div>
            </div>

            {/* Visual Chart Placeholder (Mini Wave) */}
            <div className={`h-10 flex items-end gap-1 mb-4 opacity-30 ${card.color}`}>
              {[0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 0.4].map((h, i) => (
                <div key={i} className="flex-1 bg-current rounded-t-sm" style={{ height: `${h * 100}%` }} />
              ))}
            </div>

            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 border-t border-gray-50 pt-4">
              <Clock size={12} />
              <span>Update: {card.update}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Interaction Chart Area */}
        <div className="lg:col-span-3 space-y-8">
          <UsageChart />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Transactions Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-8 pb-4 flex justify-between items-center">
            <h4 className="text-lg font-bold text-gray-800">Recent Transactions</h4>
            <button className="text-gray-400 hover:text-gray-600 outline-none">
              <Maximize size={16} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left bg-white">
              <thead className="bg-white text-gray-400 border-b border-gray-50">
                <tr>
                  <th className="px-8 py-4 text-[10px] font-extrabold uppercase tracking-widest">User / ID</th>
                  <th className="px-8 py-4 text-[10px] font-extrabold uppercase tracking-widest text-center">Date & Time</th>
                  <th className="px-8 py-4 text-[10px] font-extrabold uppercase tracking-widest text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((tx, i) => (
                    <tr key={tx.id || i} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#4d6bfe]/5 flex items-center justify-center text-[#4d6bfe]">
                            <TrendingUp size={14} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-700 truncate max-w-[150px] md:max-w-none">{tx.email}</p>
                            <p className="text-[10px] text-gray-400 font-medium">Pro Subscription ({tx.billingCycle})</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col items-center">
                          <p className="text-xs font-bold text-gray-700">
                            {tx.createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                          <p className="text-[10px] text-gray-400 font-bold">
                            {tx.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <p className="text-sm font-black text-[#4d6bfe]">₹{tx.amount.toLocaleString()}</p>
                        <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-wide">Success</p>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="px-8 py-12 text-center text-gray-400 italic">
                      No recent transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-6 border-t border-gray-50 flex justify-center">
            <button className="text-xs font-bold text-[#4d6bfe] hover:underline">View All Transactions</button>
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
            {activeUsers.length > 0 ? (
              activeUsers.map((user, i) => (
                <div key={user.id || i} className="flex gap-4 group cursor-pointer hover:translate-x-1 transition-transform">
                  <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm relative shrink-0">
                    <img
                      src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email || 'User')}&background=random`}
                      className="w-full h-full object-cover"
                      alt="User avatar"
                    />
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-xs font-bold text-gray-700 truncate">
                        {user.name || user.email?.split('@')[0] || "User"}
                      </p>
                      <span className="text-[9px] text-gray-400 font-bold whitespace-nowrap">Active</span>
                    </div>
                    <p className="text-[11px] text-gray-400 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Users size={24} className="text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-500 mb-1">No Active Users Yet</p>
                <p className="text-xs text-gray-400 max-w-[200px]">
                  Users will appear here when they start chatting
                </p>
              </div>
            )}
          </div>
          <div className="p-6 border-t border-gray-50 flex justify-center">
            <button className="text-xs font-bold text-[#4d6bfe] hover:underline">View all Activity</button>
          </div>
        </div>
      </div>

    </div>
  );
}
