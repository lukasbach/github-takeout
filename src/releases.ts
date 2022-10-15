import path from "path";
import * as fs from "fs-extra";
import mustache from "mustache";
import { releaseReportTemplate } from "./templates";
import { all, Config, downloadBigFile } from "./common";

export const downloadReleases = async ({ octokit, iterate, username, ...config }: Config) => {
  if (!config.features.includes("releases")) {
    return;
  }

  console.log(`Downloading releases...`);

  await all(
    config.repos.map(({ name }) => async () => {
      const folder = path.join(config.output, name, "releases");
      await fs.ensureDir(folder);
      const releases = config.downloadAllReleases
        ? await iterate(octokit.rest.repos.listReleases, {
            owner: username,
            repo: name,
          })
        : [(await octokit.rest.repos.getLatestRelease({ owner: username, repo: name })).data];

      if (config.downloadAllReleases) {
        console.log(`Found ${releases.length} releases for ${username}/${name}`);
      }

      if (config.releasesDownloadOption.includes("report")) {
        await fs.writeFile(
          path.join(folder, `/index.html`),
          mustache.render(releaseReportTemplate, { releases, username, repo: name })
        );
      }

      await all(
        releases.map(release => async () => {
          console.log(`Downloading release ${username}/${name} ${release.name}...`);
          const releaseFolder = path.join(folder, `${release.tag_name ?? release.name}`);

          await fs.ensureDir(releaseFolder);

          if (config.releasesDownloadOption.includes("assets")) {
            await all(
              release.assets.map(
                asset => async () => downloadBigFile(asset.browser_download_url, path.join(releaseFolder, asset.name))
              ),
              1
            );
          }
        }),
        1
      );

      if (config.releasesDownloadOption.includes("json")) {
        await fs.writeJSON(path.join(folder, "releases.json"), releases);
      }
    }),
    1
  );
};
