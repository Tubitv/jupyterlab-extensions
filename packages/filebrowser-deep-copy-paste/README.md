# filebrowser-deep-copy-paste

A JupyterLab extension to make deep copy and paste possible, which means,
you can copy and paste not only notebooks, files, but also directories.

## Prerequisites

* JupyterLab >=1.1.1

**If you're using latest JupyterLab, you might need to upgrade `@jupyterlab/services:^4.1.0"` to a newer version.**

## Installation

```bash
# Make sure the package is compiled before installation
conda activate jupyterlab-ext
npx lerna bootstrap
npx lerna run build --scope @tubitv/filebrowser-deep-copy-paste

jupyter labextension install packages/filebrowser-deep-copy-paste
```

## Development

```bash
conda activate jupyterlab-ext

# Install npm package dependencies
npx lerna bootstrap

# Develop an extension
npx lerna run watch --stream --scope @tubitv/filebrowser-deep-copy-paste
jupyter labextension install packages/filebrowser-deep-copy-paste --no-build
jupyter lab --watch

# Publish changed extensions
npx lerna publish
```
