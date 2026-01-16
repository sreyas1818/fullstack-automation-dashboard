const { Client } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

/**
 * n8n Webhook URL
 * 👉 Make sure this matches your WhatsApp Merge workflow
 */
const N8N_WEBHOOK_URL = "http://localhost:5678/webhook/whatsapp-pdf";





/**
 * Create WhatsApp client
 */
const client = new Client({
  puppeteer: {
    headless: true, // set false if you want to see browser
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

/**
 * Show QR code in terminal
 */
client.on("qr", (qr) => {
  console.log("Scan this QR code with WhatsApp:");
  qrcode.generate(qr, { small: true });
});

/**
 * When WhatsApp is ready
 */
client.on("ready", () => {
  console.log("✅ WhatsApp Bot Connected");
});

/**
 * Listen for incoming messages
 */
client.on("message", async (msg) => {
  try {
    // Ignore messages without media
    if (!msg.hasMedia) return;

    const media = await msg.downloadMedia();

    // Process only PDF files
    if (!media || media.mimetype !== "application/pdf") {
      return;
    }

    console.log("📄 PDF received from WhatsApp");

    /**
     * Save PDF temporarily
     */
    const tempFilePath = path.join(__dirname, "whatsapp.pdf");
    const buffer = Buffer.from(media.data, "base64");
    fs.writeFileSync(tempFilePath, buffer);

    /**
     * Send PDF to n8n webhook
     */
    const form = new FormData();
    form.append("data", fs.createReadStream(tempFilePath)); // MUST be "data"

    await axios.post(N8N_WEBHOOK_URL, form, {
      headers: form.getHeaders(),
      maxBodyLength: Infinity,
    });

    console.log("🚀 PDF sent to n8n successfully");

    /**
     * Optional: delete temp file
     */
    fs.unlinkSync(tempFilePath);
  } catch (error) {
    console.error("❌ Error processing PDF:", error.message);
  }
});

/**
 * Start the client
 */
client.initialize();
