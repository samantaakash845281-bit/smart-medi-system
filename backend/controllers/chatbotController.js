// @route   POST /api/chatbot
// @desc    Process chatbot messages
const processMessage = async (req, res, next) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }

        const lowerMessage = message.toLowerCase();
        let reply = "Our support team will contact you soon.";

        if (lowerMessage.includes('appointment')) {
            reply = "You can book an appointment from the Patient Dashboard. Once you select a doctor and slot, you'll be redirected to payment.";
        } else if (lowerMessage.includes('payment')) {
            reply = "Payments are required before confirming your booking. We support GPay, Paytm, and other UPI methods.";
        } else if (lowerMessage.includes('doctor')) {
            reply = "You can check doctor availability and specializations in the booking section of your dashboard.";
        } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
            reply = "Hello 👋 Welcome to Smart Medi. How can I help you today?";
        }

        res.json({ success: true, reply });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    processMessage
};
