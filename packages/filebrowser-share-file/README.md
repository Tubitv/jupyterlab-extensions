# filebrowser-share-file

It's a replacement of [`@jupyterlab/filebrowser-extension:share-file`](https://jupyterlab.readthedocs.io/en/stable/developer/extension_points.html#copy-shareable-link).

## Prerequisites

* JupyterLab >=3.0.0

## Installation

```bash
# Make sure the package is compiled before installation
conda activate jupyterlab-ext
npx lerna bootstrap
npx lerna run build --scope @tubitv/filebrowser-share-file

# Disable JupyterLab share-file
jupyter labextension disable @jupyterlab/filebrowser-extension:share-file
jupyter labextension install packages/filebrowser-share-file
```

## Development

```bash
conda activate jupyterlab-ext

# Install npm package dependencies
npx lerna bootstrap

# Develop an extension
npx lerna run watch --stream --scope @tubitv/filebrowser-share-file
jupyter labextension install packages/filebrowser-share-file --no-build
jupyter lab --watch

# Publish changed extensions
npx lerna publish
```
