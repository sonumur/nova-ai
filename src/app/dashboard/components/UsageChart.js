"use client";

import { useEffect, useState, useMemo } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { Calendar } from "lucide-react";

export default function UsageChart({
    title = "Daily Active Users",
    value = "3",
    subValue = "peak",
    data = null
}) {
    const defaultData = useMemo(() => {
        const days = ["Feb 1", "Feb 4", "Feb 7", "Feb 10", "Feb 13", "Feb 16", "Feb 19", "Feb 22", "Feb 25"];
        return days.map((day, index) => {
            let val = 0;
            if (index === 4) val = 0;
            if (index === 5) val = 3;
            if (index > 5) val = 3;
            return { name: day, value: val };
        });
    }, []);

    const chartData = data || defaultData;

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-4 border-2 border-[#1c1917] shadow-none">
                    <p className="text-[10px] font-black text-stone-400 mb-2 uppercase tracking-widest">{label}</p>
                    <p className="text-xl font-black text-[#1c1917] tabular-nums">
                        {payload[0].value} <span className="text-[10px] uppercase font-black text-[#4d6bfe]">Units</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white p-12 border-b-2 border-[#1c1917] w-full transition-all">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-8 border-b border-stone-100 pb-10">
                <div>
                    <h3 className="text-[11px] font-black text-stone-400 uppercase tracking-[0.3em] mb-4">{title}</h3>
                    <div className="flex items-baseline gap-4">
                        <span className="text-6xl font-black text-[#1c1917] tracking-tighter tabular-nums leading-none">{value}</span>
                        <span className="text-[10px] text-stone-400 font-black uppercase tracking-widest">{subValue}</span>
                    </div>
                </div>

                <div className="flex items-center gap-4 px-6 py-3 bg-stone-50 border-2 border-[#1c1917] cursor-pointer hover:bg-stone-100 transition-human active:scale-95 group">
                    <Calendar size={18} className="text-[#1c1917]" />
                    <span className="text-[11px] text-[#1c1917] font-black uppercase tracking-widest">Historical View</span>
                </div>
            </div>

            <div className="h-[380px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: -20, bottom: 0 }}
                    >
                        <CartesianGrid
                            strokeDasharray="0"
                            vertical={false}
                            stroke="#f5f5f4"
                        />
                        <XAxis
                            dataKey="name"
                            axisLine={{ stroke: '#1c1917', strokeWidth: 2 }}
                            tickLine={false}
                            tick={{ fill: '#a8a29e', fontSize: 10, fontWeight: 900 }}
                            dy={15}
                        />
                        <YAxis
                            axisLine={{ stroke: '#1c1917', strokeWidth: 2 }}
                            tickLine={false}
                            tick={{ fill: '#a8a29e', fontSize: 10, fontWeight: 900 }}
                            domain={[0, 'auto']}
                            tickCount={5}
                        />
                        <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ stroke: '#1c1917', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                        />
                        <Line
                            type="linear" // Sharp linear lines for boxy look
                            dataKey="value"
                            stroke="#1c1917"
                            strokeWidth={3}
                            dot={{ r: 4, fill: "#fff", stroke: "#1c1917", strokeWidth: 2 }}
                            activeDot={{ r: 6, fill: "#4d6bfe", stroke: "#1c1917", strokeWidth: 2 }}
                            animationDuration={1000}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-12 text-center pt-8 border-t border-stone-100">
                <p className="text-[10px] text-stone-300 font-black uppercase tracking-[0.4em]">Integrated System Telemetry &mdash; LOG_V_1.0.4</p>
            </div>
        </div>
    );
}
