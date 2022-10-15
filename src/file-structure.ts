import * as fs from "fs-extra";
import path from "path";
import prompts from "prompts";
import { Config } from "./types";

export const setupFileStructure = async (config: Config) => {
  console.log(`Using output directory: ${config.output}`);

  if (fs.existsSync(config.output)) {
    const { whatToDo } = await prompts({
      type: "select",
      name: "whatToDo",
      message: "The output folder already exists",
      choices: [
        { title: "Delete and continue", value: "delete" },
        { title: "Abort", value: "abort" },
      ],
    });

    if (whatToDo === "abort") {
      console.log("Aborting");
      process.exit(0);
    }

    console.log(`Deleting ${config.output}...`);
    await fs.remove(config.output);
  }

  await Promise.all(
    config.repos.map(async ({ name }) => {
      await fs.ensureDir(path.join(config.output, name));
      await fs.outputJSON(path.join(config.output, name, "repo.json"), config);
    })
  );

  console.log("Filestructure initialized.");
};
