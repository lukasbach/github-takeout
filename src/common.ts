import * as OctokitTypes from "@octokit/types";
import { Octokit, RestEndpointMethodTypes } from "@octokit/rest";
import * as fs from "fs-extra";
import { pipeline } from "node:stream";
import { promisify } from "node:util";
import { createWriteStream } from "fs-extra";
import fetch from "node-fetch";

const streamPipeline = promisify(pipeline);

type IterateFunc = <R extends OctokitTypes.RequestInterface>(
  request: R,
  parameters?: Parameters<R>[0]
) => Promise<OctokitTypes.GetResponseTypeFromEndpointMethod<R>["data"]>;

export type Repo = (
  | RestEndpointMethodTypes["repos"]["listForOrg"]
  | RestEndpointMethodTypes["repos"]["listForUser"]
)["response"]["data"][0];

export interface Config {
  isOrg: boolean;
  username: string;
  features: string[];
  iterate: IterateFunc;
  output: string;
  downloadAllBranches: boolean;
  issueDownloadOption: Array<"report" | "diff" | "patch" | "json">;
  releasesDownloadOption: Array<"report" | "assets" | "json">;
  downloadAllReleases: boolean;
  metaDownloadOption: Array<
    "mystars" | "mywatching" | "stars" | "watchers" | "artifacts" | "secrets" | "deploykeys" | "contributors"
  >;
  metaDownloadOption2: Array<"report" | "json">;
  shouldZip: "no" | "zip" | "tar";
  compression: number;
  octokit: Octokit;
  repos: Repo[];
  initialRatelimit: { limit: number; remaining: number };
}

export const downloadFile = async (url: string, target: string, isJson = false, attempts = 0) => {
  try {
    const resp = await fetch(url);
    if (isJson) {
      await fs.writeJson(target, await resp.json());
    } else {
      await fs.writeFile(target, await resp.text());
    }
  } catch (e) {
    if (attempts > 5) {
      console.error(`Failed to download ${url} after 5 attempts`);
      await fs.writeJson(target, { error: "Failed to download", url });
    } else {
      console.error(`Failed to download ${url}, trying again...`);
      await new Promise<void>(r => {
        setTimeout(r, 500);
      });
      await downloadFile(url, target, isJson, attempts + 1);
    }
  }
};

export const downloadBigFile = async (url: string, target: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`unexpected response ${response.statusText} when fetching ${url}`);
  await streamPipeline(response.body, createWriteStream(target));
};

export const all = async <T>(values: Array<() => Promise<T>>, batch = 10): Promise<T[]> => {
  const results: T[] = [];
  while (values.length) {
    // eslint-disable-next-line no-await-in-loop
    results.push(...(await Promise.all(values.splice(0, batch).map(f => f()))));
  }
  return results;
};
