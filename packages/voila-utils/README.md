# voila-utils

Derived from [`@jupyterlab/filebrowser-extension:share-file`](https://jupyterlab.readthedocs.io/en/stable/developer/extension_points.html#copy-shareable-link).

This is to add a context menu item to the file browser "Copy Shareable Dashboard Link".

The link is "shareable" in that references to the Jupyterhub user and server name in the URL are replaced with "user-redirect".

In order for that jupyterlab to *handle* the generated Voila URL, be sure to install the jupyterlab voila serverextension:
https://voila.readthedocs.io/en/stable/install.html

## Prerequisites

* JupyterLab >=3.0.0

## Installation

```bash
# Make sure the package is compiled before installation
conda activate jupyterlab-ext
npx lerna bootstrap
npx lerna run build --scope @tubitv/voila-utils

# Install extension
jupyter labextension install packages/voila-utils
```

## Development

```bash
conda activate jupyterlab-ext

# Install npm package dependencies
npx lerna bootstrap

# Develop an extension
npx lerna run watch --stream --scope @tubitv/voila-utils
jupyter labextension install packages/voila-utils --no-build
jupyter lab --watch

# Publish changed extensions
npx lerna publish
```
