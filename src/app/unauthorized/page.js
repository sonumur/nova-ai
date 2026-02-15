"use client";

import { useEffect } from "react";
import { auth } from "../../lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function UnauthorizedPage() {
    const router = useRouter();

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            router.push("/");
        } catch (error) {
            console.error("Sign out error:", error);
        }
    };

    return (
        <div className="min-h-screen bg-[#fcfcfc] flex flex-col items-center justify-center font-sans text-gray-900">
            <div className="w-full max-w-md px-8 py-12 bg-white rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col items-center text-center">

                {/* Icon */}
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mb-8">
                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>

                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-2">
                    Access Denied
                </h1>
                <p className="text-gray-500 mb-8 text-[15px] max-w-[320px]">
                    You don't have permission to access the admin dashboard. This area is restricted to authorized administrators only.
                </p>

                {/* Sign Out Button */}
                <button
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#4d6bfe] rounded-2xl text-white font-semibold transition-all hover:bg-[#3d56d1] active:scale-[0.98] shadow-lg shadow-[#4d6bfe]/20"
                >
                    Sign Out
                </button>

                <div className="mt-8 pt-8 border-t border-gray-50 w-full">
                    <p className="text-[11px] text-gray-400 font-medium">
                        If you believe this is an error, please contact the system administrator.
                    </p>
                </div>
            </div>

            <div className="mt-8 text-center">
                <p className="text-[12px] text-gray-400 font-medium">
                    Bluebox AI - Secure Admin Panel
                </p>
            </div>
        </div>
    );
}
