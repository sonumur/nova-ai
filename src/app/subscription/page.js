"use client";

import { useState, useEffect } from "react";
import { Check, Sparkles, Zap, ArrowRight, X, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { auth } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function SubscriptionPage() {
    const [billingCycle, setBillingCycle] = useState("monthly");
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            setUser(u);
        });
        return () => unsubscribe();
    }, []);

    const loadRazorpay = () => {
        return new Promise((resolve) => {
            if (window.Razorpay) {
                resolve(true);
                return;
            }
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleUpgrade = async (plan) => {
        const currentUser = user || auth.currentUser;

        if (!currentUser) {
            alert("Please sign in to upgrade your plan.");
            return;
        }

        if (plan.name === "Free") return;

        setLoading(true);
        const sdkLoaded = await loadRazorpay();
        if (!sdkLoaded) {
            alert("Failed to load payment gateway. Please check your internet connection.");
            setLoading(false);
            return;
        }

        try {
            const price = billingCycle === "monthly" ? plan.price.monthly : plan.price.yearly;

            const orderRes = await fetch("/api/razorpay/order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: price,
                    billingCycle: billingCycle,
                    email: currentUser.email,
                    userId: currentUser.uid
                }),
            });

            const orderData = await orderRes.json();

            if (!orderRes.ok) {
                throw new Error(orderData.message || orderData.error || "Failed to create order");
            }

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: orderData.amount,
                currency: orderData.currency || "INR",
                name: "Bluebox AI",
                description: `Upgrade to ${plan.name} (${billingCycle})`,
                image: window.location.origin + "/logo.svg",
                order_id: orderData.id,
                handler: function (response) {
                    alert("Payment Successful! Your account will be upgraded shortly.");
                },
                modal: {
                    ondismiss: function () {
                        setLoading(false);
                    }
                },
                prefill: {
                    email: currentUser.email,
                    name: currentUser.displayName || "",
                },
                theme: {
                    color: "#4d6bfe",
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error) {
            console.error("Payment Error:", error);
            alert(`Payment Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const plans = [
        {
            name: "Free",
            price: { monthly: 0, yearly: 0 },
            description: "Essential AI access",
            features: [
                "20-30 messages per day",
                "Basic AI model",
                "Standard response time",
                "Community support",
                "Limited features"
            ],
            icon: Sparkles,
            popular: false,
            cta: "Current Plan"
        },
        {
            name: "Pro",
            price: { monthly: 249, yearly: 2490 },
            description: "Maximum performance & access",
            features: [
                "Unlimited messages",
                "Unlimited tokens",
                "Better / Premium AI model",
                "Fast / Priority response",
                "Priority Access"
            ],
            icon: Zap,
            popular: true,
            cta: "Upgrade to Pro"
        }
    ];

    return (
        <div className="min-h-screen bg-[#fcfcfc] font-sans text-gray-900 flex flex-col items-center">
            {/* Simple Header */}
            <div className="w-full max-w-5xl px-6 py-8 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#4d6bfe]/10 rounded-lg flex items-center justify-center p-1.5">
                        <img src="/logo.svg" alt="Bluebox" className="w-full h-full" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-gray-800">Subscription</span>
                </div>
            </div>

            <div className="max-w-4xl w-full px-6 pb-20">
                <div className="text-center mb-12">
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight"
                    >
                        Upgrade your Plan
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-lg text-gray-500 max-w-xl mx-auto mb-8"
                    >
                        Choose the perfect plan for your needs. Cancel anytime.
                    </motion.p>

                    {/* Billing Toggle */}
                    <div className="inline-flex items-center bg-gray-100 rounded-xl p-1.5">
                        <button
                            onClick={() => setBillingCycle("monthly")}
                            className={`px-6 py-2 rounded-lg font-semibold text-sm transition-all ${billingCycle === "monthly" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setBillingCycle("yearly")}
                            className={`px-6 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${billingCycle === "yearly" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
                        >
                            Yearly
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                -17%
                            </span>
                        </button>
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-2 gap-6">
                    {plans.map((plan, index) => {
                        const Icon = plan.icon;
                        const price = billingCycle === "monthly" ? plan.price.monthly : plan.price.yearly;

                        return (
                            <motion.div
                                key={plan.name}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: index * 0.1 }}
                                className={`relative bg-white rounded-2xl p-8 border transition-all ${plan.popular ? "border-[#4d6bfe] ring-4 ring-[#4d6bfe]/5 shadow-xl shadow-[#4d6bfe]/10" : "border-gray-100 shadow-sm hover:border-gray-200"}`}
                            >
                                {plan.popular && (
                                    <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
                                        <div className="bg-[#4d6bfe] text-white px-3 py-1 rounded-bl-xl rounded-tr-xl text-[10px] font-bold uppercase tracking-wider">
                                            Recommended
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                                        <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                                        <Icon className="text-gray-600" size={20} />
                                    </div>
                                </div>

                                <div className="mb-8">
                                    <div className="flex items-baseline">
                                        <span className="text-4xl font-black text-gray-900 tracking-tight">₹{price}</span>
                                        <span className="text-gray-500 ml-1 text-sm font-medium">
                                            /{billingCycle === "monthly" ? "mo" : "yr"}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-8">
                                    {plan.features.map((feature, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <div className="mt-0.5 text-[#4d6bfe]">
                                                <Check size={16} strokeWidth={3} />
                                            </div>
                                            <span className="text-sm text-gray-600 font-medium">{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => handleUpgrade(plan)}
                                    disabled={loading || plan.name === "Free"}
                                    className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${plan.popular ? "bg-gradient-to-r from-[#4d6bfe] to-[#3d56d1] text-white shadow-lg" : "bg-gray-50 text-gray-900 hover:bg-gray-100 border border-gray-200"} ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
                                >
                                    {loading && plan.name !== "Free" ? (
                                        <Loader2 className="animate-spin" size={16} />
                                    ) : (
                                        <>
                                            {plan.cta}
                                            {plan.popular && <ArrowRight size={16} />}
                                        </>
                                    )}
                                </button>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Security Badge */}
                <div className="mt-12 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span>Secure Payment via Razorpay</span>
                </div>
            </div>
        </div>
    );
}
