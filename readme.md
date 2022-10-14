# github-takeout

> A utility for cloning all your repos, including issues, discussions, stargazers and more!

<!--
![Pretty](https://github.com/lukasbach/github-takeout/workflows/verify/badge.svg)
![Testing](https://github.com/lukasbach/github-takeout/workflows/publish/badge.svg)
-->

 Features

- Test setup with Jest
- Eslint setup with airbnb defaults and prettier
- Setup with Yarn
- Builds for multiple targets cjs, esm and esnext
- Github Actions CI Pipeline for testing and publishing

## Setup template

- Clone the template via the _Use this template_ button or by clicking
  [here](https://github.com/lukasbach/ts-starter/generate).
- Search for "TODO" in the project and adjust everything applicable, and replace "{NAME}" with your project name
- (optionally) Add a secret to GitHub with the name `npm_token` to allow NPM releases
- (optionally) enable packaging an exported CLI via `pkg` if enabled in the CI file
- remove or adapt from the following sections to adjust to the package

---

## How to use

Install globally via

    npm install -g github-takeout

or directly use via

    npx github-takeout

You can also [download a prebuilt binary](https://github.com/lukasbach/github-takeout/releases) and run that.

Usage:

    Usage: npx github-takeout [options]

    Options:
    -V, --version            output the version number
    -s, --small              small pizza size
    -p, --pizza-type <type>  flavour of pizza
    -h, --help               display help for command

## How to develop

- `yarn` to install dependencies
- `yarn start` to run in dev mode
- `yarn test` to run tests
- `yarn lint` to test and fix linter errors

To publish a new version, the publish pipeline can be manually
invoked.
