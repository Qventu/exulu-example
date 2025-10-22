import { type Request, type Response } from "express";
import { exulu } from "./exulu";

const start = async () => {

  const app = await exulu();
  const server = await app.express.init();
  
  if (!server) {
    throw new Error("Failed to create Exulu server.");
  }
  server.get("/", (req: Request, res: Response) => {
    res.status(200).json({
      message: "Hello, welcome to the Exulu backend ❤️."
    })
    return;
  });

  server.listen(9001, () => {});
}
start();