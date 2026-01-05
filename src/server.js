import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { initializeFirebase } from "./config/firebase.js";

const PORT = process.env.PORT || 5000;

/**
 * Start the server
 */
const startServer = async () => {
  try {
    // Initialize Firebase Admin
    initializeFirebase();

    // Connect to MongoDB
    await connectDB();

    // Start Express server
    app.listen(PORT, () => {
      if (process.env.NODE_ENV !== "production") {
        console.log(`🚀 Server running on: http://localhost:${PORT}`);
      }
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("💥 UNCAUGHT EXCEPTION! Shutting down...");
  console.error(error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (error) => {
  console.error("💥 UNHANDLED REJECTION! Shutting down...");
  console.error(error);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  process.exit(0);
});

process.on("SIGINT", () => {
  process.exit(0);
});

// Start the server
startServer();
