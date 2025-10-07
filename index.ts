import { ApiServer } from "./src/server";

// Get port from environment or default to 3000
const PORT = parseInt(process.env.PORT || "3000");

// Create and start the API server
const server = new ApiServer(PORT);
server.start();
