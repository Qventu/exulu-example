import { ExuluDatabase } from "@exulu/backend";
await ExuluDatabase.init();
console.log("Successfully initialized database.");
process.exit(0);