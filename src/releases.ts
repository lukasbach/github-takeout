import prompts from "prompts";
import path from "path";
import * as fs from "fs-extra";
import mustache from "mustache";
import sanitize from "sanitize-html";
import { marked } from "marked";
import { releaseReportReleaseIndexTemplate } from "./templates";
import { all, Config, downloadBigFile, downloadFile } from "./common";

export const downloadReleases = async ({ octokit, iterate, username, ...config }: Config) => {
  if (!config.features.includes("releases")) {
    return;
  }

  const { whatToDownload } = await prompts({
    type: "multiselect",
    name: "whatToDownload",
    message: "Which kind of release data do you want to download?",
    choices: [
      { title: "HTML Description", value: "report", selected: true },
      { title: "Release assets (Warning: This might be very big)", value: "assets", selected: false },
      { title: "JSON Dump", value: "json", selected: true },
    ],
  });

  console.log(`Downloading releases...`);

  await all(
    config.repos.map(({ name }) => async () => {
      const folder = path.join(config.output, name, "releases");
      await fs.ensureDir(folder);
      const releases = await iterate(octokit.rest.repos.listReleases, {
        owner: username,
        repo: name,
      });

      console.log(`Found ${releases.length} releases for ${username}/${name}`);

      if (whatToDownload.includes("report")) {
        await fs.writeFile(
          path.join(folder, `/index.html`),
          mustache.render(releaseReportReleaseIndexTemplate, { releases, username, repo: name })
        );
      }

      await all(
        releases.map(release => async () => {
          console.log(`Downloading release ${username}/${name}#${release.name}...`);
          const releaseFolder = path.join(folder, `${release.tag_name ?? release.name}`);

          await fs.ensureDir(releaseFolder);

          if (whatToDownload.includes("report")) {
          }

          if (whatToDownload.includes("assets")) {
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

      if (whatToDownload.includes("json")) {
        await fs.writeJSON(path.join(folder, "releases.json"), releases);
      }
    }),
    1
  );
};
