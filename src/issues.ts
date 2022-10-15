import path from "path";
import * as fs from "fs-extra";
import mustache from "mustache";
import { marked } from "marked";
import sanitize from "sanitize-html";
import { all, Config, downloadFile } from "./common";
import { reportIndexTemplate, reportIssueTemplate } from "./templates";

export const downloadIssues = async ({ octokit, iterate, username, ...config }: Config) => {
  if (!config.features.includes("issues")) {
    return;
  }

  console.log(`Downloading issues...`);

  await all(
    config.repos.map(({ name }) => async () => {
      const folder = path.join(config.output, name, "issues");
      await fs.ensureDir(folder);
      const issues = await iterate(octokit.rest.issues.listForRepo, {
        owner: username,
        repo: name,
        state: "all",
      });

      console.log(`Found ${issues.length} issues for ${username}/${name}`);

      if (config.issueDownloadOption.includes("report")) {
        await fs.writeFile(
          path.join(folder, `/index.html`),
          mustache.render(reportIndexTemplate, { issues, username, repo: name })
        );
      }

      await all(
        issues.map(issue => async () => {
          console.log(`Downloading issue ${username}/${name}#${issue.number}...`);
          const comments = await iterate(octokit.rest.issues.listComments, {
            owner: username,
            repo: name,
            issue_number: issue.number,
          });

          // eslint-disable-next-line no-param-reassign
          (issue as any).comments = comments;

          if (
            !config.issueDownloadOption.includes("diff") &&
            !config.issueDownloadOption.includes("patch") &&
            !config.issueDownloadOption.includes("report")
          ) {
            return;
          }

          await fs.ensureDir(path.join(folder, `${issue.number}`));

          if (config.issueDownloadOption.includes("report")) {
            const html = mustache.render(reportIssueTemplate, {
              ...issue,
              comments: comments.map(comment => ({
                ...comment,
                body: sanitize(marked.parse(comment.body ?? "No Content")),
              })),
              username,
              repo: name,
              body: sanitize(marked.parse(issue.body ?? "No Content")),
            });
            await fs.writeFile(path.join(folder, `${issue.number}/issue.html`), html);
          }

          if (issue.pull_request) {
            if (config.issueDownloadOption.includes("diff") && issue.pull_request.diff_url) {
              await downloadFile(issue.pull_request.diff_url, path.join(folder, `${issue.number}/pr.diff`));
            }

            if (config.issueDownloadOption.includes("patch") && issue.pull_request.patch_url) {
              await downloadFile(issue.pull_request.patch_url, path.join(folder, `${issue.number}/pr.patch`));
            }
          }
        })
      );

      if (config.issueDownloadOption.includes("json")) {
        await fs.writeJSON(path.join(folder, "issues.json"), issues);
      }
    })
  );
};
