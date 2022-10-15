import * as OctokitTypes from "@octokit/types";
import { Octokit, RestEndpointMethodTypes } from "@octokit/rest";
import * as fs from "fs-extra";

type IterateFunc = <R extends OctokitTypes.RequestInterface>(
  request: R,
  parameters?: Parameters<R>[0]
) => Promise<OctokitTypes.GetResponseTypeFromEndpointMethod<R>["data"]>;

export interface Config {
  isOrg: boolean;
  username: string;
  features: string[];
  iterate: IterateFunc;
  output: string;
  octokit: Octokit;
  repos: (
    | RestEndpointMethodTypes["repos"]["listForOrg"]
    | RestEndpointMethodTypes["repos"]["listForUser"]
  )["response"]["data"];
}

export const downloadFile = async (url: string, target: string, isJson = false, attempts = 0) => {
  const { default: fetch } = await import("node-fetch");
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

export const all = async <T>(values: Array<PromiseLike<T>>): Promise<Awaited<T>[]> => {
  const results: Awaited<T>[] = [];
  while (values.length) {
    // eslint-disable-next-line no-await-in-loop
    results.push(...(await Promise.all(values.splice(0, 10))));
  }
  return results;
};
