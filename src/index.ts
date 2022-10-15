#!/usr/bin/env node
import { program } from "commander";
import * as fs from "fs-extra";
import * as path from "path";
import { setupFileStructure } from "./file-structure";
import { cloneCode } from "./code";
import { zipOutput } from "./zip";
import { downloadIssues } from "./issues";
import { downloadReleases } from "./releases";
import { interview } from "./interview";
import { all } from "./common";

program.version(JSON.parse(fs.readFileSync(path.join(__dirname, "../package.json"), { encoding: "utf-8" })).version);

program.parse(process.argv);

(async () => {
  const config = await interview();
  await setupFileStructure(config);
  await all(
    config.repos.map(repo => async () => {
      await cloneCode(config, repo);
      await downloadIssues(config, repo);
      await downloadReleases(config, repo);
    }),
    5
  );
  await zipOutput(config);

  console.log("You are done!");
  const {
    data: { rate: finalRateLimit },
  } = await config.octokit.rest.rateLimit.get();
  console.log(
    `\n\nRate Limit details\nYou currently have ${finalRateLimit.remaining} of ${finalRateLimit.limit} requests remaining.`
  );
  console.log(`This used up ${config.initialRatelimit.remaining - finalRateLimit.remaining} requests.`);
})();
