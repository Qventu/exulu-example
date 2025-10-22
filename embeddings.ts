import { exulu } from "./exulu";

// You can use the exported embeddings methods to programmatically 
// generate embeddings for all items in a context or a specific item.
const generate = async () => {
    const app = await exulu();
    const output = await app.embeddings.generate.all({
        context: "TBD"
    })
    console.log(output)
}

generate()