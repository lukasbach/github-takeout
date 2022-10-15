import path from "path";
import * as fs from "fs-extra";
import mustache from "mustache";
import { releaseReportTemplate } from "./templates";
import { all, Config, downloadBigFile, Repo } from "./common";

export const downloadReleases = async ({ octokit, iterate, ...config }: Config, { name, owner }: Repo) => {
  if (!config.features.includes("releases")) {
    return;
  }

  console.log(`${name}: Downloading releases...`);

  const folder = path.join(config.output, name, "releases");
  await fs.ensureDir(folder);
  const releases = config.downloadAllReleases
    ? await iterate(octokit.rest.repos.listReleases, {
        owner: owner.login,
        repo: name,
      })
    : [(await octokit.rest.repos.getLatestRelease({ owner: owner.login, repo: name })).data];

  if (config.downloadAllReleases) {
    console.log(`Found ${releases.length} releases for ${owner.login}/${name}`);
  }

  if (config.releasesDownloadOption.includes("report")) {
    await fs.writeFile(
      path.join(folder, `/index.html`),
      mustache.render(releaseReportTemplate, { releases, username: owner.login, repo: name })
    );
  }

  await all(
    releases.map(release => async () => {
      console.log(`${name}: Downloading release ${release.name}...`);
      const releaseFolder = path.join(folder, `${release.tag_name ?? release.name}`);

      await fs.ensureDir(releaseFolder);

      if (config.releasesDownloadOption.includes("assets")) {
        await all(
          release.assets.map(asset => async () => {
            console.log(`${name}: Downloading asset ${release.name}/${asset.name}...`);
            await downloadBigFile(asset.browser_download_url, path.join(releaseFolder, asset.name));
          }),
          1
        );
      }
    }),
    1
  );

  if (config.releasesDownloadOption.includes("json")) {
    await fs.writeJSON(path.join(folder, "releases.json"), releases);
  }
};
