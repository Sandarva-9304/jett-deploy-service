// import { createClient } from "redis";  for connecting to locally running redis server
import { copyFinalDist, downloadS3Folder } from "./aws.js";
import { buildProject } from "./createbuild.js";
import { Redis } from "@upstash/redis";
import "dotenv/config";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// const subscriber = createClient();
// subscriber.connect();

// const publisher = createClient();
// publisher.connect();

async function main() {
  while (1) {
    const res = await redis.rpop(
      //   commandOptions({ isolated: true }),
      "build-queue",
      1
    );
    console.log(res);
    if (Array.isArray(res) && res.length === 0) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      continue;
    }
    const id = res || "";

    await downloadS3Folder(`output/${id}/`);

    await buildProject(id);

    copyFinalDist(id);
    await redis.hset("status", { [id]: "deployed" });
  }
}
main();
