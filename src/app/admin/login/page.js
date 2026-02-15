"use client";

import { useEffect, useState } from "react";
import { auth, googleProvider } from "../../../lib/firebase";
import { signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [isSigningIn, setIsSigningIn] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);

    const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user && user.email === ADMIN_EMAIL) {
                // Admin is already logged in, redirect to dashboard
                router.push("/dashboard");
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [router, ADMIN_EMAIL]);

    const handleGoogleSignIn = async () => {
        if (isSigningIn) return;
        setIsSigningIn(true);
        setErrorMsg(null);
        try {
            const result = await signInWithPopup(auth, googleProvider);

            // Check if user is admin
            if (result.user.email === ADMIN_EMAIL) {
                router.push("/dashboard");
            } else {
                setErrorMsg("Access denied. Only authorized administrators can login here.");
                setIsSigningIn(false);
            }
        } catch (error) {
            console.error("Admin Login Error:", error);
            if (error.code !== "auth/cancelled-popup-request") {
                setErrorMsg(error.message);
            }
            setIsSigningIn(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-[#4d6bfe] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fcfcfc] flex flex-col items-center justify-center font-sans text-gray-900 border-t-4 border-[#4d6bfe]">
            <div className="w-full max-w-md px-8 py-12 bg-white rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col items-center text-center">

                {/* Admin Badge */}
                <div className="w-20 h-20 bg-[#4d6bfe]/10 text-[#4d6bfe] rounded-3xl flex items-center justify-center mb-8 relative">
                    <img src="/logo.svg" alt="Bluebox Logo" className="w-12 h-12" />
                    <div className="absolute -top-2 -right-2 bg-[#4d6bfe] text-white text-[9px] font-bold px-2 py-1 rounded-full">
                        ADMIN
                    </div>
                </div>

                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-2">
                    Admin Panel Login
                </h1>
                <p className="text-gray-500 mb-10 text-[15px] max-w-[280px]">
                    Secure access for authorized administrators only.
                </p>

                {/* Google Sign-In Button */}
                <button
                    onClick={handleGoogleSignIn}
                    disabled={isSigningIn}
                    className={`w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border border-gray-200 rounded-2xl text-gray-700 font-semibold transition-all hover:shadow-md active:scale-[0.98] ${isSigningIn ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50 hover:border-gray-300"
                        }`}
                >
                    {isSigningIn ? (
                        <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg" className="w-6 h-6" alt="Google" />
                    )}
                    {isSigningIn ? "Verifying..." : "Sign in as Administrator"}
                </button>

                {errorMsg && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                        <p className="text-xs text-red-600 font-medium">{errorMsg}</p>
                    </div>
                )}

                <div className="mt-10 pt-10 border-t border-gray-50 w-full">
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mb-4">
                        🔒 Secured Access
                    </p>
                    <a
                        href="/"
                        className="text-[11px] text-[#4d6bfe] font-medium hover:underline"
                    >
                        ← Back to regular login
                    </a>
                </div>
            </div>

            <div className="mt-8 text-center">
                <p className="text-[12px] text-gray-400 font-medium">
                    Bluebox AI - Admin Dashboard
                </p>
            </div>
        </div>
    );
}
