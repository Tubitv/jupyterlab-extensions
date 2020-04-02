# nteract Data Explorer

- A wrapper of [nteract Data Explorer](https://github.com/nteract/data-explorer)
- A JupyterLab extension for rendering tabular-data-resource files

## Prerequisites

* JupyterLab >=1.1.1

## Installation

```bash
# Make sure the package is compiled before installation
conda activate jupyterlab-ext
npx lerna bootstrap
npx lerna run build --scope @tubitv/nteract-data-explorer

jupyter labextension install packages/nteract-data-explorer
```

## Development

```bash
conda activate jupyterlab-ext

# Install npm package dependencies
npx lerna bootstrap

# Develop an extension
npx lerna run watch --stream --scope @tubitv/nteract-data-explorer
jupyter labextension install packages/nteract-data-explorer --no-build
jupyter lab --watch

# Publish changed extensions
npx lerna publish
```

## References
- https://github.com/nteract/data-explorer 
- https://github.com/jupyterlab/jupyter-renderers
- https://github.com/jupyterlab/mimerender-cookiecutter-ts
