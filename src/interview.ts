import { Octokit } from "@octokit/rest";
import * as OctokitTypes from "@octokit/types";
import * as fs from "fs-extra";
import prompts from "prompts";
import { COMPRESSION_LEVEL } from "zip-a-folder";
import { Config } from "./common";

export const interview = async () => {
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

  const { output } = await prompts({
    type: "text",
    name: "output",
    message: "Output folder",
    initial: "./output",
  });

  if (fs.existsSync(output)) {
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
  }

  const { features } = await prompts({
    type: "multiselect",
    name: "features",
    message: "Which features do you want to download?",
    choices: [
      { title: "Code repo", description: "Requires git installed locally", value: "code", selected: true },
      { title: "Issues including PR diffs", value: "issues", selected: true },
      { title: "Releases", value: "releases", selected: true },
    ],
  });

  const { downloadAllBranches } = await prompts({
    type: features.includes("code") ? "toggle" : null,
    name: "downloadAllBranches",
    message: "Do you want to download all branches? (using git pull --all)",
    initial: false,
    active: "Download all branches",
    inactive: "Only download the default branch",
  });

  const { issueDownloadOption } = await prompts({
    type: features.includes("issues") ? "multiselect" : null,
    name: "issueDownloadOption",
    message: "Which kind of issue data do you want to download?",
    choices: [
      { title: "HTML Thread", value: "report", selected: true },
      { title: ".diff files for PRs", value: "diff", selected: true },
      { title: ".patch files for PRs", value: "patch", selected: true },
      { title: "JSON Dump", value: "json", selected: true },
    ],
  });

  const { releasesDownloadOption } = await prompts({
    type: features.includes("releases") ? "multiselect" : null,
    name: "releasesDownloadOption",
    message: "Which kind of release data do you want to download?",
    choices: [
      { title: "HTML Description", value: "report", selected: true },
      { title: "Release assets (Warning: This might be very big)", value: "assets", selected: false },
      { title: "JSON Dump", value: "json", selected: true },
    ],
  });

  const { downloadAllReleases } = await prompts({
    type: features.includes("releases") ? "toggle" : null,
    name: "downloadAllReleases",
    message: "Do you want to download all releases, or only the latest one?",
    initial: false,
    active: "Download all releases",
    inactive: "Only latest one",
  });

  const { shouldZip } = await prompts({
    type: "select",
    name: "shouldZip",
    message: "Do you want to compress the output for each repo in an archive?",
    choices: [
      { title: "No", value: "no" },
      { title: "As Zip files", value: "zip" },
      { title: "As Tar files", value: "tar" },
    ],
  });

  const { compression } = await prompts({
    type: shouldZip !== "no" ? "select" : null,
    name: "compression",
    message: "With which compression level do you want to compress the files?",
    choices: [
      { title: "High", value: COMPRESSION_LEVEL.high },
      { title: "Medium", value: COMPRESSION_LEVEL.medium },
      { title: "Uncompressed", value: COMPRESSION_LEVEL.uncompressed },
    ],
  });

  console.log(`Thanks for bearing with me. I'll start now, this might take a while.`);
  await new Promise<void>(r => {
    setTimeout(r, 3000);
  });

  const config: Config = {
    isOrg,
    username,
    features,
    iterate,
    output,
    downloadAllBranches,
    issueDownloadOption,
    releasesDownloadOption,
    downloadAllReleases,
    shouldZip,
    compression,
    octokit,
    repos: repos.filter(({ name }) => name === "pauspapier"), // TODO!!
    initialRatelimit,
  };

  return config;
};
