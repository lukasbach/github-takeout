import { zip, tar } from "zip-a-folder";
import path from "path";
import * as fs from "fs-extra";
import { all, Config } from "./common";

export const zipOutput = async (config: Config) => {
  if (config.shouldZip === "no") {
    return;
  }

  await all(
    config.repos.map(({ name }) => async () => {
      const folder = path.join(config.output, name);
      if (config.shouldZip === "zip") {
        console.log(`Zipping ${folder}...`);
        await zip(folder, `${folder}.zip`, { compression: config.compression });
      }
      if (config.shouldZip === "tar") {
        console.log(`Tarring ${folder}...`);
        await tar(folder, `${folder}.tar`, { compression: config.compression });
      }
      await fs.remove(folder);
    })
  );
};
