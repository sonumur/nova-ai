function calculateNewExpiry(currentExpiryStr, billingCycle) {
    let baseDate = new Date();
    if (currentExpiryStr) {
        const currentExpiry = new Date(currentExpiryStr);
        if (currentExpiry > baseDate) {
            baseDate = currentExpiry;
        }
    }

    const expiryDate = new Date(baseDate);
    if (billingCycle === "yearly") {
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    } else {
        expiryDate.setMonth(expiryDate.getMonth() + 1);
    }
    return expiryDate.toISOString();
}

console.log("--- Testing Subscription Expiry Logic ---");

const now = new Date();
console.log("Current Date:", now.toISOString());

// Test Case 1: Standard Monthly (New User)
console.log("\nTest Case 1: Standard Monthly (New User)");
console.log("Result:", calculateNewExpiry(null, "monthly"));

// Test Case 2: Early Renewal (10 days remaining)
const tenDaysFuture = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString();
console.log("\nTest Case 2: Early Renewal (10 days remaining)");
console.log("Current Expiry:", tenDaysFuture);
console.log("Result:", calculateNewExpiry(tenDaysFuture, "monthly"));
// Expected: currentExpiry + 1 month

// Test Case 3: Late Renewal (Expired 5 days ago)
const fiveDaysPast = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString();
console.log("\nTest Case 3: Late Renewal (Expired 5 days ago)");
console.log("Current Expiry:", fiveDaysPast);
console.log("Result:", calculateNewExpiry(fiveDaysPast, "monthly"));
// Expected: now + 1 month

// Test Case 4: Yearly Renewal
console.log("\nTest Case 4: Yearly Renewal");
console.log("Result:", calculateNewExpiry(null, "yearly"));
