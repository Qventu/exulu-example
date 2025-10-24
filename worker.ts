import {exulu} from "./exulu";

const worker = async () => {
  const app = await exulu();
  const worker = await app.bullmq.workers.create();
  return worker;
}

worker();