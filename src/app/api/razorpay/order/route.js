import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const body = await req.json();
        const { amount, billingCycle, email, userId } = body;

        const keyId = process.env.RAZORPAY_KEY_ID?.trim();
        const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

        if (!keyId || !keySecret) {
            return NextResponse.json({
                error: "Config Error",
                message: "RAZORPAY_KEY_ID or SECRET is missing in .env.local"
            }, { status: 500 });
        }

        const amountInPaise = Math.round(Number(amount) * 100);
        const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

        const payload = {
            amount: amountInPaise,
            currency: "INR",
            receipt: `rcpt_${Date.now()}`,
            notes: {
                userId: userId || "anonymous",
                email: email || "no-email",
                plan: "Pro",
                billingCycle: billingCycle || "monthly"
            }
        };

        const rzpResponse = await fetch("https://api.razorpay.com/v1/orders", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Basic ${auth}`
            },
            body: JSON.stringify(payload)
        });

        const rzpData = await rzpResponse.json();

        if (!rzpResponse.ok) {
            // Extract description from Razorpay's error format
            const description = rzpData.error?.description || rzpData.error?.reason || "Authentication failed or account restricted.";
            return NextResponse.json({
                error: "Razorpay Error",
                message: description
            }, { status: rzpResponse.status });
        }

        return NextResponse.json(rzpData);

    } catch (err) {
        console.error("Order Creation Catch:", err);
        return NextResponse.json({
            error: "Server Error",
            message: "An unexpected error occurred while creating the order."
        }, { status: 500 });
    }
}
