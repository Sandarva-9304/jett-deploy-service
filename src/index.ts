import { copyFinalDist, downloadS3Folder } from "./aws.js";
import { buildProject } from "./createbuild.js";
import { Redis } from "@upstash/redis";
import "dotenv/config";
import * as github from "@actions/github";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

async function main() {
  console.log(github.context.payload);
  const id = github.context.payload.inputs.job_id;
  console.log(id);

  await downloadS3Folder(`output/${id}/`);
  console.log("Building project...");
  await buildProject(id);

  copyFinalDist(id);
  await redis.hset("status", { [id]: "deployed" });
}
main().catch((err) => {
  console.error("Error in worker:", err);
  process.exit(1);
});
