import * as fs from "fs-extra";
import path from "path";
import prompts from "prompts";
import { simpleGit } from "simple-git";
import { all, Config } from "./common";

export const cloneCode = async (config: Config) => {
  if (!config.features.includes("code")) {
    return;
  }

  console.log(`Cloning code...`);

  const { allBranches } = await prompts({
    type: "toggle",
    name: "allBranches",
    message: "Do you want to download all branches? (using git pull --all)",
    initial: false,
    active: "Download all branches",
    inactive: "Only download the default branch",
  });

  await all(
    config.repos.map(async ({ clone_url, name }) => {
      const repoPath = path.join(config.output, name, "code");
      console.log(`${name}: Cloning ${clone_url} to ${repoPath}...`);
      await fs.ensureDir(repoPath);
      const git = simpleGit(repoPath);
      git.clone(clone_url!);
      if (allBranches) {
        console.log(`${name}: Downloading all branches...`);
        git.pull(["--all"]);
      }
    })
  );
};
