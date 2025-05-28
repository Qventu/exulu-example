import { ExuluDatabase } from "@exulu/backend";
await ExuluDatabase.generateApiKey("test", "test@exulu.com");
console.log("Successfully initialized database.");
process.exit(0);