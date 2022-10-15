import prompts from "prompts";
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

  const { whatToDownload } = await prompts({
    type: "multiselect",
    name: "whatToDownload",
    message: "Which kind of issue data do you want to download?",
    choices: [
      { title: "HTML Thread", value: "report", selected: true },
      { title: ".diff files for PRs", value: "diff", selected: true },
      { title: ".patch files for PRs", value: "patch", selected: true },
      { title: "JSON Dump", value: "json", selected: true },
    ],
  });

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

      if (whatToDownload.includes("report")) {
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
            !whatToDownload.includes("diff") &&
            !whatToDownload.includes("patch") &&
            !whatToDownload.includes("report")
          ) {
            return;
          }

          await fs.ensureDir(path.join(folder, `${issue.number}`));

          if (whatToDownload.includes("report")) {
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
            if (whatToDownload.includes("diff") && issue.pull_request.diff_url) {
              await downloadFile(issue.pull_request.diff_url, path.join(folder, `${issue.number}/pr.diff`));
            }

            if (whatToDownload.includes("patch") && issue.pull_request.patch_url) {
              await downloadFile(issue.pull_request.patch_url, path.join(folder, `${issue.number}/pr.patch`));
            }
          }
        })
      );

      if (whatToDownload.includes("json")) {
        await fs.writeJSON(path.join(folder, "issues.json"), issues);
      }
    })
  );
};
