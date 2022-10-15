import path from "path";
import * as fs from "fs-extra";
import mustache from "mustache";
import { marked } from "marked";
import sanitize from "sanitize-html";
import { all, Config, downloadFile, Repo } from "./common";
import { reportIndexTemplate, reportIssueTemplate } from "./templates";

export const downloadIssues = async ({ octokit, iterate, ...config }: Config, { name, owner }: Repo) => {
  if (!config.features.includes("issues")) {
    return;
  }

  console.log(`${name}: Downloading issues...`);

  const folder = path.join(config.output, name, "issues");
  await fs.ensureDir(folder);
  const issues = await iterate(octokit.rest.issues.listForRepo, {
    owner: owner.login,
    repo: name,
    state: "all",
  });

  console.log(`${name}: Found ${issues.length} issues`);

  if (config.issueDownloadOption.includes("report")) {
    await fs.writeFile(
      path.join(folder, `/index.html`),
      mustache.render(reportIndexTemplate, { issues, username: owner.login, repo: name })
    );
  }

  await all(
    issues.map(issue => async () => {
      console.log(`${name}: Downloading issue #${issue.number}...`);
      const comments = await iterate(octokit.rest.issues.listComments, {
        owner: owner.login,
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
          username: owner.login,
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
    }),
    5
  );

  if (config.issueDownloadOption.includes("json")) {
    await fs.writeJSON(path.join(folder, "issues.json"), issues);
  }
};
