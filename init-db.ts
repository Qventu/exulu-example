import { db } from "@exulu/backend"

const init = async () => {
    await db.init()
    // Important to exit here to avoid hanging the 
    // process of this script in deployments.
    process.exit(0)
}

init()