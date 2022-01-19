const fs = require("fs");
const path = require("path");
const Client = require("ssh2-sftp-client");

const { configFile } = require("./config.js");

main();

function main() {
  const watch = () => watchFiles(getFiles(configFile));

  let watchers = watch();

  // watch config file for changes and rewatch files
  fs.watch(configFile, (ev) => {
    if (ev == "change") {
      logNormal("a change in config file ...");
      watchers.forEach((w) => w.close());
      watchers = watch();
    }
  });
}

function watchFiles(files) {
  // uniq source dirs to avoid multiple watchers for a dir with more than one file
  return [...new Set(files.map((f) => f.sourceDir))].map((sourceDir) => {
    try {
      return fs.watch(sourceDir, createWatchHandler(sourceDir, files));
    } catch (e) {
      logError(e.message);
      // return something that's `.close()`able
      return { close: Function };
    }
  });
}

function getFiles(configFile) {
  return fs
    .readFileSync(configFile, { encoding: "utf8" })
    .split(/\n\r|\n|\r/)
    .map((s) => s.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => line.split(/\s+/).map((word) => word.trim()))
    .map(
      ([fileName, username, host, port, password, sourceDir, destination]) => {
        return {
          fileName,
          username,
          host,
          port,
          password,
          sourceDir,
          destination,
        };
      }
    );
}

function createWatchHandler(sourceDir, files) {
  return (event, fileName) => {
    console.log(event, " ---> ", fileName);
    if (
      event == "change"
      // optionally filter for a file extension
      // && /.*xlsx?/.test(fileName)
    ) {
      let f = files.find((f) => f.fileName == fileName);
      if (f) uploadFile({ ...f, sourceDir });
      else
        logError(
          `${new Date().toLocaleString()} |> Warning: Couldn't find ${fileName} in the config file\n`
        );
    }
  };
}

function uploadFile(f) {
  let client = new Client();

  client
    .connect(f)
    .then(() =>
      client.put(
        path.join(f.sourceDir, f.fileName),
        // assuming the destination will be a unix like os
        f.destination + "/" + f.fileName
      )
    )
    .then(() => logNormal(`uploaded ${f.fileName} successfully`))
    .then(() => client.end())
    .catch((e) =>
      logError(`Error: Couldn't upload ${f.fileName} . ${e.message}`)
    );
}

function logError(s) {
  console.error(`${new Date().toLocaleString()} |> ${s}\n`);
}

function logNormal(s) {
  console.log(`${new Date().toLocaleString()} |> ${s}\n`);
}
