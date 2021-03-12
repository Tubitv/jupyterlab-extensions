import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import {
  Clipboard
} from '@jupyterlab/apputils';

import {
  PageConfig,
  URLExt
} from '@jupyterlab/coreutils';

import {
  IFileBrowserFactory
} from '@jupyterlab/filebrowser';

import {
  toArray
} from '@lumino/algorithm';

const shareFile: JupyterFrontEndPlugin<void> = {
  activate: activateShareFile,
  id: '@tubitv/filebrowser-extension:share-file',
  requires: [IFileBrowserFactory],
  autoStart: true
};

export default shareFile;

/**
 * Log debugging information
 */
export function log(...args: any[]): void {
  if (console && console.debug) {
    console.debug('[filebrowser-share-file]', ...args);
  }
}

/**
 * transform tree url to `/user-redirect/` url for JupyterHub
 * see https://jupyterhub.readthedocs.io/en/stable/reference/urls.html#user-redirect
 * @param url
 */
export function transformToUserRedirectUrl(url: string): string {
  return url.replace(/\/user\/([^\/]+)\//, "/user-redirect/");
}

function activateShareFile(
  app: JupyterFrontEnd,
  factory: IFileBrowserFactory
): void {
  log('Custom plugin is activated!');
  const { commands } = app;
  const { tracker } = factory;

  commands.addCommand("filebrowser:share-main", {
    execute: () => {
      const widget = tracker.currentWidget;
      if (!widget) {
        return;
      }
      // https://jupyterhub.readthedocs.io/en/stable/reference/urls.html#user-redirect
      // Replace a URL like
      // https://example.com/user/someone/files/shared/README.md
      // to
      // https://example.com/user-redirect/lab/tree/shared/README.md
      // e.g. shared/README.md
      const path = encodeURI(widget.selectedItems().next().path);
      // e.g. https://domain/user/username/lab/tree
      // e.g. https://domain/user/username/servername/lab/tree
      const treeUrl = PageConfig.getTreeUrl();
      // replace `/user/username/` to `/user-redirect/` if any
      // for local JupyterLab, it won't change anything, because there is no `/user/username/` part in the URL
      const userRedirectTreeUrl = transformToUserRedirectUrl(treeUrl);
      // 1. local: replace https://domain/other-part with https://domain/other-part
      // 2. default server: replace https://domain/user/usr/other-part with https://domain/user-redirect/other-part
      // 3. named server: replace https://domain/user/usr/svc/other-part with https://domain/user-redirect/svc/other-part
      const shareableLink = URLExt.join(userRedirectTreeUrl, path);
      log("Tree URL is", treeUrl);
      log("User Redirect Tree URL is", userRedirectTreeUrl);
      log("Path is", path);
      log("Final link is", shareableLink);

      Clipboard.copyToSystem(shareableLink);
    },
    isVisible: () =>
      tracker.currentWidget &&
      toArray(tracker.currentWidget.selectedItems()).length === 1,
    iconClass: 'jp-MaterialIcon jp-LinkIcon',
    label: 'Copy Shareable Link'
  });
}
