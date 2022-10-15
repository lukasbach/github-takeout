import * as fs from "fs-extra";
import path from "path";
import mustache from "mustache";
import { Config, Repo } from "./common";
import { metaContainerTemplate, metaTemplates } from "./templates";

const buildDownloadJson = (config: Partial<Config>, basePath: string) => async (data: any, filename: string) => {
  if (config.metaDownloadOption2?.includes("json")) {
    if (!data) {
      return;
    }

    await fs.writeJSON(path.join(basePath, filename), data);
  }
};
const buildDownloadReport =
  (config: Partial<Config>, domain: string, basePath: string) =>
  async (template: string, filename: string, kind: string, data: Array<any>) => {
    if (config.metaDownloadOption2?.includes("report")) {
      const list = data.map(item => mustache.render(template, { ...item, ...config, domain, kind })).join("");
      await fs.writeFile(
        path.join(basePath, filename),
        mustache.render(metaContainerTemplate, { ...config, domain, list, kind, count: data.length })
      );
    }
  };

export const downloadGeneralMetaData = async ({ username, octokit, iterate, ...config }: Config) => {
  if (!config.features.includes("meta")) {
    return;
  }

  console.log(`Downloading general meta data...`);

  const downloadJson = buildDownloadJson(config, config.output);
  const downloadReport = buildDownloadReport(config, username, config.output);

  if (config.metaDownloadOption.includes("mystars")) {
    const myStars = await iterate(octokit.rest.activity.listReposStarredByUser, {
      username,
    });
    await downloadJson(myStars, "my-stars.json");
    await downloadReport(metaTemplates.mystars, "my-stars.html", "Stars", myStars);
  }
  if (config.metaDownloadOption.includes("mywatching")) {
    const myWatching = await iterate(await octokit.rest.activity.listReposWatchedByUser, {
      username,
    });
    await downloadJson(myWatching, "my-watched-repos.json");
    await downloadReport(metaTemplates.mywatching, "my-watched-repos.html", "Watched Repos", myWatching);
  }
};

export const downloadRepoMetaData = async ({ octokit, iterate, ...config }: Config, { name, owner }: Repo) => {
  if (!config.features.includes("meta")) {
    return;
  }

  console.log(`${name}: Downloading meta data...`);
  const repoPath = path.join(config.output, name);
  const downloadJson = buildDownloadJson(config, repoPath);
  const downloadReport = buildDownloadReport(config, `${owner.login}/${name}`, repoPath);

  if (config.metaDownloadOption.includes("stars")) {
    const listStargazersForRepo = await iterate(octokit.rest.activity.listStargazersForRepo, {
      owner: owner.login,
      repo: name,
    });
    await downloadJson(listStargazersForRepo, "stargazers.json");
    await downloadReport(metaTemplates.stars, "stargazers.html", "Stargazers", listStargazersForRepo);
  }

  if (config.metaDownloadOption.includes("watchers")) {
    const listWatchersForRepo = await iterate(octokit.rest.activity.listWatchersForRepo, {
      owner: owner.login,
      repo: name,
    });
    await downloadJson(listWatchersForRepo, "watchers.json");
    await downloadReport(metaTemplates.watchers, "watchers.html", "Watchers", listWatchersForRepo);
  }

  if (config.metaDownloadOption.includes("artifacts")) {
    const listArtifactsForRepo = (await iterate(octokit.rest.actions.listArtifactsForRepo, {
      owner: owner.login,
      repo: name,
    })) as any;
    await downloadJson(listArtifactsForRepo, "artifacts.json");
    await downloadReport(metaTemplates.artifacts, "artifacts.html", "Artifacts", listArtifactsForRepo);
  }

  if (config.metaDownloadOption.includes("secrets")) {
    const listRepoSecrets = (await iterate(octokit.rest.actions.listRepoSecrets, {
      owner: owner.login,
      repo: name,
    })) as any;
    await downloadJson(listRepoSecrets, "secrets.json");
    await downloadReport(metaTemplates.secrets, "secrets.html", "Secrets", listRepoSecrets);
  }

  if (config.metaDownloadOption.includes("deploykeys")) {
    const listDeployKeys = await iterate(octokit.rest.repos.listDeployKeys, {
      owner: owner.login,
      repo: name,
    });
    await downloadJson(listDeployKeys, "deploy-keys.json");
    await downloadReport(metaTemplates.deploykeys, "deploy-keys.html", "Deploy Keys", listDeployKeys);
  }

  if (config.metaDownloadOption.includes("contributors")) {
    const listContributors = await iterate(octokit.rest.repos.listContributors, {
      owner: owner.login,
      repo: name,
    });
    await downloadJson(listContributors, "contributors.json");
    await downloadReport(metaTemplates.contributors, "contributors.html", "Contributors", listContributors);
  }
};
