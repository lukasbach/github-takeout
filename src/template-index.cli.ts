#!/usr/bin/env node
// TODO run `yarn add commander`
// eslint-disable-next-line import/no-unresolved
import { program } from "commander";
import * as fs from "fs";
import * as path from "path";

interface Options {
  small?: boolean;
  pizzaType: string;
}

program
  .version(JSON.parse(fs.readFileSync(path.join(__dirname, "../package.json"), { encoding: "utf-8" })).version)
  .option("-s, --small", "small pizza size")
  .requiredOption("-p, --pizza-type <type>", "flavour of pizza");

program.parse(process.argv);

const options = program.opts() as Options;

// eslint-disable-next-line no-console
console.log(options);
