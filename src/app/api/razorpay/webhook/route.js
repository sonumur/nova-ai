import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "../../../../lib/firebase";
import { doc, updateDoc, serverTimestamp, setDoc, addDoc, collection } from "firebase/firestore";

export async function POST(req) {
    try {
        const body = await req.text();
        const signature = req.headers.get("x-razorpay-signature");
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

        if (!secret) {
            console.error("RAZORPAY_WEBHOOK_SECRET is not set");
            return NextResponse.json({ error: "Configuration Error" }, { status: 500 });
        }

        // Verify signature
        const generated_signature = crypto
            .createHmac("sha256", secret)
            .update(body)
            .digest("hex");

        if (generated_signature !== signature) {
            console.error("Invalid signature received");
            return NextResponse.json(
                { error: "Invalid signature" },
                { status: 400 }
            );
        }

        const event = JSON.parse(body);
        console.log("Received Razorpay Event:", event.event);

        // Handle the event
        switch (event.event) {
            case "payment.captured":
                const payment = event.payload.payment.entity;
                const userId = payment.notes?.userId;
                const email = payment.notes?.email;
                const billingCycle = payment.notes?.billingCycle || "monthly";
                const amount = payment.amount / 100; // Convert from paise

                if (userId) {
                    console.log(`Processing Pro upgrade for User ID: ${userId} (${billingCycle})`);

                    // 1. Calculate Expiry
                    const now = new Date();
                    const daysToAdd = billingCycle === "yearly" ? 365 : 30;
                    const expiryDate = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

                    // 2. Log Payment Record (Idempotent using payment.id)
                    await setDoc(doc(db, "payments", payment.id), {
                        userId,
                        email,
                        amount,
                        currency: "INR",
                        billingCycle,
                        paymentId: payment.id,
                        orderId: payment.order_id,
                        status: "captured",
                        createdAt: serverTimestamp()
                    });

                    // 3. Update User Status
                    await setDoc(doc(db, "users", userId), {
                        email: email,
                        isPro: true,
                        role: "pro",
                        subscriptionPlan: "Pro",
                        billingCycle: billingCycle,
                        messageLimit: "unlimited",
                        tokenLimit: "unlimited",
                        modelTier: "premium",
                        subscriptionExpiry: expiryDate.toISOString(),
                        lastPaymentId: payment.id,
                        subscriptionUpdatedAt: serverTimestamp()
                    }, { merge: true });

                    console.log(`Successfully upgraded User ID: ${userId} to Pro. Expiry: ${expiryDate.toISOString()}`);
                } else {
                    console.error("No userId found in payment notes.");
                }
                break;

            case "payment.failed":
                const failure = event.payload.payment.entity;
                console.log("Payment failed:", failure.id, failure.error_description);
                break;

            default:
                console.log("Unhandled event:", event.event);
        }

        return NextResponse.json({ status: "ok" });
    } catch (error) {
        console.error("Webhook Error:", error);
        return NextResponse.json(
            { error: "Webhook handler failed" },
            { status: 500 }
        );
    }
}
