#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"

GREEN='\033[0;32m'
PLAIN='\033[0m'

function install_conda() {
  CONDA_DIR=$HOME/miniconda
  export PATH=$CONDA_DIR/bin:$PATH
  which conda && conda -V && return 0

  case $(uname | tr '[:upper:]' '[:lower:]') in
  linux*)
    OS_NAME=Linux
    ;;
  darwin*)
    OS_NAME=MacOSX
    ;;
  *)
    OS_NAME=""
    echo "$uname is not supported yet"
    exit 1
    ;;
  esac

  mkdir -p "$CONDA_DIR" "$HOME/.conda"
  wget -q "https://repo.continuum.io/miniconda/Miniconda3-latest-${OS_NAME}-x86_64.sh" -O miniconda.sh
  bash miniconda.sh -f -b -p "$CONDA_DIR" && rm miniconda.sh
  conda -V
}

NODE_VERSION=v12.16.1

function install_node() {
  pushd $HOME

  version=$NODE_VERSION
  case $(uname | tr '[:upper:]' '[:lower:]') in
  linux*)
    OS_NAME=linux
    NODE_DIR="node-${version}-${OS_NAME}-x64"
    NODE_URL="https://nodejs.org/dist/${version}/${NODE_DIR}.tar.xz"
    ;;
  darwin*)
    OS_NAME=darwin
    NODE_DIR="node-${version}-${OS_NAME}-x64"
    NODE_URL="https://nodejs.org/dist/${version}/${NODE_DIR}.tar.gz"
    ;;
  *)
    echo "$uname is not supported yet"
    exit 1
    ;;
  esac

  export PATH=$HOME/$NODE_DIR/bin:$PATH
  which node && {
    node -v
    popd
    return 0
  }

  wget -q "$NODE_URL"
  NODE_FILE=$(basename "$NODE_URL")
  [[ "$OS_NAME" == "linux" ]] && tar xf $NODE_FILE || tar zxf $NODE_FILE
  rm $NODE_FILE

  node -v
  npx -v
  npm -v

  popd
}

which conda && conda -V || install_conda
which node && node -v || install_node

# 1. Create Python environment with necessary PyPI dependencies
conda create -n jupyterlab-ext python=3.7 -y

# init conda in bash
conda init bash
eval "$(command conda 'shell.bash' 'hook' 2> /dev/null)"
conda activate jupyterlab-ext
conda info -e
pip install -r $SCRIPT_DIR/requirements.txt

# 2. Clean existed npm packages
# Fix "sh: 1: node: Permission denied"
if [[ $UID -eq 0 ]]; then
  npm config set user $UID
  npm config set unsafe-perm true
fi
npx lerna clean --yes
rm -rf node_modules # `lerna clean` does not remove modules from the root node_modules directory

# 3. Install npm package dependencies
npx lerna bootstrap

# 4. Compile all packages
npx lerna run build

# 5. Disable JupyterLab share-file
jupyter labextension disable @jupyterlab/filebrowser-extension:share-file

# 6. Install extensions
jupyter labextension install packages/filebrowser-share-file
jupyter labextension install packages/filebrowser-deep-copy-paste
jupyter labextension install packages/nteract-data-explorer

# 7. List installed extensions
jupyter labextension list

echo -e "If you haven't set up your own conda and node,\nexecute the following commands to use ${GREEN}conda${PLAIN} and ${GREEN}node${PLAIN} installed by this script:"
echo -e "${GREEN}export PATH=$CONDA_DIR/bin:\$PATH${PLAIN}"
echo -e "${GREEN}export PATH=$HOME/$NODE_DIR/bin:\$PATH${PLAIN}"
