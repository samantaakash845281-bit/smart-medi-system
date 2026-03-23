const Razorpay = require('razorpay');
require('dotenv').config();

async function testRazorpay() {
    console.log("Testing Razorpay integration...");
    console.log("Key ID:", process.env.RAZORPAY_KEY_ID);
    
    try {
        const instance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const options = {
            amount: 100 * 100, // INR 100
            currency: "INR",
            receipt: "test_receipt_1",
        };

        const order = await instance.orders.create(options);
        console.log("SUCCESS! Order created:", order.id);
        process.exit(0);
    } catch (err) {
        console.error("FAILURE! Razorpay Error:", err);
        process.exit(1);
    }
}

testRazorpay();
