import * as fs from "fs-extra";
import path from "path";
import { simpleGit } from "simple-git";
import { Config, Repo } from "./common";

export const cloneCode = async (config: Config, { name, clone_url }: Repo) => {
  if (!config.features.includes("code")) {
    return;
  }

  console.log(`${name}: Cloning code...`);

  const repoPath = path.join(config.output, name, "code");
  console.log(`${name}: Cloning ${clone_url} to ${repoPath}...`);
  await fs.ensureDir(repoPath);
  const git = simpleGit(repoPath);
  git.clone(clone_url!);
  if (config.downloadAllBranches) {
    console.log(`${name}: Downloading all branches...`);
    git.pull(["--all"]);
  }
};
