"use client";
import { useEffect, useState } from "react";
import {
    MessageSquare,
    TrendingUp,
    Clock,
    ChevronUp,
    ChevronDown,
    Users,
    BarChart3,
    MoreHorizontal
} from "lucide-react";
import { motion } from "framer-motion";
import { db } from "../../../lib/firebase";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import UsageChart from "../components/UsageChart";

export default function ChatAnalytics() {
    const [totalChats, setTotalChats] = useState(0);
    const [chatData, setChatData] = useState([]);
    const [recentChats, setRecentChats] = useState([]);
    const [interactionRate, setInteractionRate] = useState(12);
    const [rpmDelta, setRpmDelta] = useState(0);

    useEffect(() => {
        // 1. Live Chat Counter
        const unsubscribeChats = onSnapshot(collection(db, "chats"), (snap) => {
            setTotalChats(snap.size);
        });

        // 2. Recent Chat Activity
        const q = query(collection(db, "chats"), orderBy("createdAt", "desc"), limit(6));
        const unsubscribeRecent = onSnapshot(q, (snap) => {
            setRecentChats(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        // 3. Mock Chart Data 
        const interval = setInterval(() => {
            setChatData(prev => {
                const nextValue = Math.floor(Math.random() * 20) + 10;
                const last = prev.length > 0 ? prev[prev.length - 1] : 15;
                const delta = ((nextValue - last) / last) * 100;
                setRpmDelta(Math.round(delta));
                setInteractionRate(nextValue);

                const newData = [...prev, nextValue].slice(-10);
                if (newData.length < 10) {
                    return Array(10 - newData.length).fill(15).concat(newData);
                }
                return newData;
            });
        }, 3000);

        return () => {
            unsubscribeChats();
            unsubscribeRecent();
            clearInterval(interval);
        };
    }, []);

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Chat Analytics</h2>
                    <p className="text-xs text-gray-400 mt-1">Deep dive into Bluebox's interaction metrics</p>
                </div>
                <div className="flex gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-100">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">Live Updates</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Graph Card */}
                <div className="lg:col-span-2 space-y-8">
                    <UsageChart
                        title="Interaction Velocity"
                        value={`${interactionRate} RPM`}
                        subValue={rpmDelta !== 0 ? `${rpmDelta > 0 ? '+' : ''}${rpmDelta}%` : 'Stable'}
                        data={chatData.map((val, i) => ({ name: `${i}m ago`, value: val }))}
                    />
                </div>

                {/* Counter Block & Activity */}
                <div className="space-y-8">
                    {/* Big Count Box */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#4d6bfe] rounded-3xl p-8 text-white shadow-xl shadow-[#4d6bfe]/20 relative overflow-hidden"
                    >
                        <div className="relative z-10">
                            <div className="p-3 bg-white/10 rounded-2xl w-fit mb-6">
                                <MessageSquare size={24} />
                            </div>
                            <p className="text-sm font-medium opacity-80 uppercase tracking-wider">Total Chats</p>
                            <h3 className="text-5xl font-black mt-2 tracking-tighter tabular-nums">
                                {totalChats}
                            </h3>
                            <div className="flex items-center gap-2 mt-4 text-xs font-bold bg-white/10 w-fit px-3 py-1.5 rounded-lg">
                                <ChevronUp size={14} className="text-emerald-300" />
                                <span>+12% vs last week</span>
                            </div>
                        </div>

                        {/* Decorative Circle */}
                        <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-[-40px] left-[-20px] w-48 h-48 bg-[#4d6bfe]/20 rounded-full blur-3xl"></div>
                    </motion.div>

                    {/* Live Feed */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 h-full">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="text-sm font-bold text-gray-800">Live Interactions</h4>
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        </div>
                        <div className="space-y-6">
                            {recentChats.map((chat, i) => (
                                <div key={chat.id || i} className="flex gap-3 group">
                                    <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 shrink-0 flex items-center justify-center overflow-hidden">
                                        <img
                                            src={`https://ui-avatars.com/api/?name=${chat.title || 'User'}&background=random`}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-bold text-gray-700 truncate group-hover:text-[#4d6bfe] transition-colors">
                                            {chat.title || "New Interaction"}
                                        </p>
                                        <p className="text-[9px] text-gray-400 font-medium">
                                            {chat.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || "Just now"}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {recentChats.length === 0 && (
                                <div className="py-12 text-center">
                                    <Clock size={20} className="text-gray-200 mx-auto mb-2" />
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Waiting for activity...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
