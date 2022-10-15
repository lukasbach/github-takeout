import { zip, tar, COMPRESSION_LEVEL } from "zip-a-folder";
import prompts from "prompts";
import path from "path";
import * as fs from "fs-extra";
import { all, Config } from "./common";

export const zipOutput = async (config: Config) => {
  const { whatToDo } = await prompts({
    type: "select",
    name: "whatToDo",
    message: "Do you want to compress the output for each repo in an archive?",
    choices: [
      { title: "No", value: "no" },
      { title: "As Zip files", value: "zip" },
      { title: "As Tar files", value: "tar" },
    ],
  });

  if (whatToDo === "no") {
    return;
  }

  const { compression } = await prompts({
    type: "select",
    name: "compression",
    message: "With which compression level do you want to compress the files?",
    choices: [
      { title: "High", value: COMPRESSION_LEVEL.high },
      { title: "Medium", value: COMPRESSION_LEVEL.medium },
      { title: "Uncompressed", value: COMPRESSION_LEVEL.uncompressed },
    ],
  });

  await all(
    config.repos.map(async ({ name }) => {
      const folder = path.join(config.output, name);
      if (whatToDo === "zip") {
        console.log(`Zipping ${folder}...`);
        await zip(folder, `${folder}.zip`, { compression });
      }
      if (whatToDo === "tar") {
        console.log(`Tarring ${folder}...`);
        await tar(folder, `${folder}.tar`, { compression });
      }
      await fs.remove(folder);
    })
  );
};
