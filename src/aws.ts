import pkg from "aws-sdk";
const { S3 } = pkg;
// import { S3 } from "aws-sdk";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getAllFiles } from "./file.js";
// import { dir } from "console";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const endpoint = process.env.S3_ENDPOINT ?? "";
const accessKeyId = process.env.S3_ACCESS_KEY_ID ?? "";
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY ?? "";
const s3 = new S3({
  endpoint: endpoint,
  accessKeyId: accessKeyId,
  secretAccessKey: secretAccessKey,
});

export async function downloadS3Folder(prefix: string) {
  const allFiles = await s3
    .listObjectsV2({
      Bucket: "jett",
      Prefix: prefix,
    })
    .promise();

  //   console.log("all files: ", allFiles);

  //
  const allPromises =
    allFiles.Contents?.map(async ({ Key }) => {
      return new Promise(async (resolve) => {
        if (!Key) {
          resolve("");
          return;
        }
        const finalOutputPath = path.join(__dirname, Key);
        console.log("Downloading to ", finalOutputPath);
        const outputFile = fs.createWriteStream(finalOutputPath);
        const dirName = path.dirname(finalOutputPath);
        if (!fs.existsSync(dirName)) {
          fs.mkdirSync(dirName, { recursive: true });
        }
        s3.getObject({
          Bucket: "jett",
          Key,
        })
          .createReadStream()
          .pipe(outputFile)
          .on("finish", () => {
            resolve("");
          });
      });
    }) || [];
  console.log("awaiting");

  await Promise.all(allPromises?.filter((x) => x !== undefined));
}

export function copyFinalDist(id: string) {
  const folderPath = path.join(__dirname, `output/${id}/build`);
  const allFiles = getAllFiles(folderPath);
  allFiles.forEach((file) => {
    uploadFile(
      `dist/${id}/` + file.slice(folderPath.length + 1).replaceAll("\\", "/"),
      file
    );
  });
}

const uploadFile = async (fileName: string, localFilePath: string) => {
  const fileContent = fs.readFileSync(localFilePath);
  const response = await s3
    .upload({
      Body: fileContent,
      Bucket: "jett",
      Key: fileName,
    })
    .promise();
  console.log(response);
};
