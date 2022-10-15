export const reportIndexTemplate = `
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

export const reportIssueTemplate = `
<html>
  <head>
    <title>{{ username }}/{{ repo }} Issue {{ number }}: {{ title }}</title>
  </head>
  <body>
  <p><a href="../index.html">Back to index</a></p>
    <small>{{ username }}/{{ repo }} Issue {{ number }}</small>
    <h1>{{ title }}</h1>
    <p>
      Labels: 
      {{#labels}}
      <a href="{{ url }}" title="{{ description }}">{{ name }}</a>
      {{/labels}}
    </p>
    <p>
      Opened by <a href="{{ user.html_url }}">{{ user.login }}</a> at {{ created_at }}.
      {{#assignee}}Assigned to <a href="{{ assignee.html_url }}">{{ assignee.login }}</a>.{{/assignee}}
      {{#updated_at}}Updated at {{ updated_at }}</a>.{{/updated_at}}
      {{#closed_at}}Updated at {{ closed_at }}</a> by <a href="{{ closed_by.html_url }}">{{ closed_by.login }}</a>.{{/closed_at}}
      {{#pull_request}}This is a pull request. <a href="./pr.diff">diff</a> - <a href="./pr.patch">patch</a>{{/pull_request}}
    </p>
    <section>
      <h2>{{ title }}</h2>
      <p>By <a href="{{ user.html_url }}">{{ user.login }}</a></p>
      {{{ body }}}
    </section>
    <hr/>
    {{#comments}}
    <section>
      <h2>{{ title }}</h2>
      <p>
      By <a href="{{ user.html_url }}">{{ user.login }}</a>, created on {{ created_at }}, updated on {{ updated_at }}
      </p>
      {{{ body }}}
    </section>
    <hr/>
    {{/comments}}
  </body>
</html>
`;
