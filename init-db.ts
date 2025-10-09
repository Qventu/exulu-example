import { db } from "@exulu/backend"
import { exulu } from "./exulu"

const init = async () => {
    const app = await exulu();
    await db.init({
        contexts: app.contexts
    })
    // Important to exit here to avoid hanging the 
    // process of this script in deployments.
    process.exit(0)
}

init()