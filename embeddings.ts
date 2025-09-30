import {exulu} from "./server";


// You can use the exported embeddings methods to programmatically 
// generate embeddings for all items in a context or a specific item.
const output = await exulu.embeddings.generate.all({
    context: "TBD"
})

console.log(output)