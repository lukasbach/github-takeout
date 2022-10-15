#!/usr/bin/env node
import { setupFileStructure } from "./file-structure";
import { cloneCode } from "./code";
import { zipOutput } from "./zip";
import { downloadIssues } from "./issues";
import { downloadReleases } from "./releases";
import { interview } from "./interview";
import { all } from "./common";
import { downloadGeneralMetaData, downloadRepoMetaData } from "./meta";

(async () => {
  const config = await interview();
  await setupFileStructure(config);
  await downloadGeneralMetaData(config);
  await all(
    config.repos.map(repo => async () => {
      await cloneCode(config, repo);
      await downloadIssues(config, repo);
      await downloadReleases(config, repo);
      await downloadRepoMetaData(config, repo);
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
