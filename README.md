# Auto ftp upload files on change

This script watches a set of directories for changes in files and uploads them to a distant ftp server.

Each file has its own source and destination directories, and its own credentials for the ftp server.

An example config for the files is in the `config.txt` file.

The script also watches the config file for changes to account for new files without restarting it.

First install dependencies with: `npm install`

Then run it with: `npm start`

This is free software, feel free to adapt it to your own needs.
