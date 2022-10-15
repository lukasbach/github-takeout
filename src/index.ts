#!/usr/bin/env node
import { program } from "commander";
import * as fs from "fs-extra";
import * as path from "path";
import prompts from "prompts";
import { Octokit } from "@octokit/rest";
import * as OctokitTypes from "@octokit/types";
import { setupFileStructure } from "./file-structure";
import { Config } from "./common";
import { cloneCode } from "./code";
import { zipOutput } from "./zip";
import { downloadIssues } from "./issues";

program.version(JSON.parse(fs.readFileSync(path.join(__dirname, "../package.json"), { encoding: "utf-8" })).version);

program.parse(process.argv);

// const options = program.opts()
(async () => {
  const { auth } = await prompts({
    type: "text",
    name: "auth",
    message: "Enter a Github access token (https://github.com/settings/tokens/new):",
  });

  const octokit = new Octokit({ auth });
  const {
    data: { rate: initialRatelimit },
  } = await octokit.rest.rateLimit.get();
  console.log(
    `Rate Limit details: You currently have ${initialRatelimit.remaining} of ${initialRatelimit.limit} requests remaining.`
  );

  const { orgOrUser } = await prompts({
    type: "select",
    name: "orgOrUser",
    message: "Is this an organization or a user?",
    choices: ["user", "org"],
  });

  const { username } = await prompts({
    type: "text",
    name: "username",
    message: "Enter the username or organization name:",
  });

  const isOrg = orgOrUser === "org";

  async function iterate<R extends OctokitTypes.RequestInterface>(
    request: R,
    parameters?: Parameters<R>[0]
  ): Promise<OctokitTypes.GetResponseTypeFromEndpointMethod<R>["data"]> {
    const asyncIterator = octokit.paginate.iterator(request, parameters);
    const arr: any[] = [];
    // eslint-disable-next-line no-restricted-syntax
    for await (const i of asyncIterator) arr.push(i);
    return arr.reduce((acc, cur) => acc.concat(cur.data), []);
  }

  const repos = await iterate(isOrg ? octokit.rest.repos.listForOrg : octokit.rest.repos.listForUser, {
    username,
    type: "all",
  });

  console.log(`Found ${repos.length} repos`);

  const { features } = await prompts({
    type: "multiselect",
    name: "features",
    message: "Which features do you want to download?",
    choices: [
      { title: "Code repo", description: "Requires git installed locally", value: "code", selected: true },
      { title: "Issues including PR diffs", value: "issues", selected: true },
      { title: "Releases", value: "releases" },
    ],
  });

  const { output } = await prompts({
    type: "text",
    name: "output",
    message: "Output folder",
    initial: "./output",
  });

  const config: Config = {
    username,
    isOrg,
    features,
    iterate,
    octokit,
    output: path.resolve(process.cwd(), output),
    repos: repos.filter(({ name }) => name === "react-complex-tree"), // TODO!!
  };

  await setupFileStructure(config);
  await cloneCode(config);
  await downloadIssues(config);
  await zipOutput(config);

  console.log("You are done!");
  const {
    data: { rate: finalRateLimit },
  } = await octokit.rest.rateLimit.get();
  console.log(
    `\n\nRate Limit details\nYou currently have ${finalRateLimit.remaining} of ${finalRateLimit.limit} requests remaining.`
  );
  console.log(`This used up ${initialRatelimit.remaining - finalRateLimit.remaining} requests.`);
  console.log(`Your rate limit will reset in ${finalRateLimit.reset}TODO minutes.`);
})();
