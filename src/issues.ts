import prompts from "prompts";
import path from "path";
import * as fs from "fs-extra";
import mustache from "mustache";
import { Config } from "./types";

const reportIndexTemplate = `
<html>
  <head>
    <title>{{ username }}/{{ repo }} Issues</title>
  </head>
  <body>
    <h1>{{ username }}/{{ repo }} Issues</h1>
    <ul>
      {{#issues}}
      <li><a href="./{{ number }}/issue.html">{{ number }}: <strong>{{ title }}</strong></a> by {{ user.login }} on {{ created_at }}</li>
      {{/issues}}
    </ul>
  </body>
</html>
`;

const reportIssueTemplate = `
<html>
  <head>
    <title>{{ username }}/{{ repo }} Issue {{ number }}: {{ title }}</title>
  </head>
  <body>
  <p><a href="../index.html">Back to index</a></p>
    <h1>{{ username }}/{{ repo }} Issue {{ number }}: {{ title }}</h1>
    <p>
      Labels: 
      {{#labels}}
      <a href="{{ url }}" title="{{ description }}">{{ name }}</a>
      {{/labels}}
    </p>
    <p>
      Opened by <a href="{{ user.html_url }}">{{ user.login }}</a> at {{ created_at }}, 
      assigned to <a href="{{ assignee.html_url }}">{{ assignee.login }}</a>.
      Updated at {{ updated_at }}, closed at {{ closed_at }} by <a href="{{ closed_by.html_url }}">{{ closed_by.login }}</a>.
    </p>
    <h2>{{ title }}</h2>
    <p>By <a href="{{ user.html_url }}">{{ user.login }}</a></p>
    {{{ body }}}
    <hr/>
    {{#comments}}
    <h2>{{ title }}</h2>
    <p>By <a href="{{ user.html_url }}">{{ user.login }}</a>, created on {{ created_at }}, updated on {{ updated_at }}</p>
    {{{ body }}}
    <hr/>
    {{/comments}}
  </body>
</html>
`;

export const downloadIssues = async ({ octokit, iterate, username, ...config }: Config) => {
  if (!config.features.includes("issues")) {
    return;
  }

  const { whatToDownload } = await prompts({
    type: "multiselect",
    name: "whatToDownload",
    message: "Which kind of issue data do you want to download?",
    choices: [
      { title: "Each issue with comments as one HTML file", value: "report" },
      { title: "JSON Dump", value: "json" },
    ],
  });

  console.log(`Downloading issues...`);

  await Promise.all(
    config.repos.map(async ({ name }) => {
      const folder = path.join(config.output, name, "issues");
      await fs.ensureDir(folder);
      const issues = await iterate(octokit.rest.issues.listForRepo, {
        owner: username,
        repo: name,
      });

      if (whatToDownload.includes("report")) {
        await fs.writeFile(
          path.join(folder, `/index.html`),
          mustache.render(reportIndexTemplate, { issues, username, repo: name })
        );
      }

      await Promise.all(
        issues.map(async issue => {
          const comments = await iterate(octokit.rest.issues.listComments, {
            owner: username,
            repo: name,
            issue_number: issue.number,
          });
          await fs.ensureDir(path.join(folder, `${issue.number}`));

          if (whatToDownload.includes("report")) {
            const html = mustache.render(reportIssueTemplate, {
              ...issue,
              comments,
              username,
              repo: name,
            });
            await fs.writeFile(path.join(folder, `${issue.number}/issue.html`), html);
          }

          // eslint-disable-next-line no-param-reassign
          (issue as any).comments = comments;
        })
      );

      if (whatToDownload.includes("json")) {
        await fs.writeJSON(path.join(folder, "issues.json"), issues);
      }
    })
  );
};
