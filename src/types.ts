import * as OctokitTypes from "@octokit/types";
import { RestEndpointMethodTypes } from "@octokit/rest";

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
  repos: (
    | RestEndpointMethodTypes["repos"]["listForOrg"]
    | RestEndpointMethodTypes["repos"]["listForUser"]
  )["response"]["data"];
}
