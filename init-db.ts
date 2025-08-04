import { db } from "@exulu/backend"

const init = async () => {
    await db.init()
}

init()