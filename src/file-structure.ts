import * as fs from "fs-extra";
import path from "path";
import { all, Config } from "./common";

export const setupFileStructure = async (config: Config) => {
  console.log(`Using output directory: ${config.output}`);

  if (fs.existsSync(config.output)) {
    console.log(`Deleting ${config.output}...`);
    await fs.remove(config.output);
  }

  await all(
    config.repos.map(({ name }) => async () => {
      await fs.ensureDir(path.join(config.output, name));
      await fs.outputJSON(path.join(config.output, name, "repo.json"), config);
    })
  );

  console.log("Filestructure initialized.");
};
