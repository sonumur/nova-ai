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
                <div className="bg-white p-3 border border-gray-100 shadow-lg rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">{label}</p>
                    <p className="text-sm font-bold text-gray-800">
                        {payload[0].value} <span className="text-xs font-normal text-gray-500">active</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h3 className="text-base font-medium text-gray-600">{title}</h3>
                    <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-3xl font-normal text-gray-900">{value}</span>
                        <span className="text-xs text-gray-500">{subValue}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                    <Calendar size={14} className="text-gray-500" />
                    <span className="text-xs text-gray-600 font-medium">Feb 1 - Feb 28 (PST)</span>
                </div>
            </div>

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: -20, bottom: 0 }}
                    >
                        <CartesianGrid
                            strokeDasharray="0"
                            vertical={false}
                            stroke="#e5e7eb"
                        />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                            domain={[0, 'auto']}
                            tickCount={5}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }} />
                        <Line
                            type="linear"
                            dataKey="value"
                            stroke="#1a73e8" // Google Blue
                            strokeWidth={2}
                            dot={{ r: 4, fill: "#1a73e8", strokeWidth: 0 }}
                            activeDot={{ r: 6, fill: "#1a73e8", strokeWidth: 0 }}
                            animationDuration={1500}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 text-center border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-500">{title} (per day)</p>
            </div>
        </div>
    );
}
