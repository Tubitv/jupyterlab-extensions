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

const voilaUtils: JupyterFrontEndPlugin<void> = {
  activate: activateUtils,
  id: '@tubitv/voila-utils',
  requires: [IFileBrowserFactory],
  autoStart: true
};

export default voilaUtils;

/**
 * Log debugging information
 */
export function log(...args: any[]): void {
  if (console && console.debug) {
    console.debug('[voila-utils]', ...args);
  }
}

/**
 * transform tree url to `/user-redirect/` url for JupyterHub
 * see https://jupyterhub.readthedocs.io/en/stable/reference/urls.html#user-redirect
 * @param url
 */
export function transformToUserRedirectUrl(url: string): string {
  return url.replace(/\/user\/([^\/]+)\//, '/user-redirect/');
}

function activateUtils(
  app: JupyterFrontEnd,
  factory: IFileBrowserFactory
): void {
  console.log('Custom plugin is activated! : voila-utils');
  const { commands } = app;
  const { tracker } = factory;

  commands.addCommand("voila-utils:share-dashboard", {
    execute: () => {
      const widget = tracker.currentWidget;
      if (!widget) {
        return;
      }
      // https://jupyterhub.readthedocs.io/en/stable/reference/urls.html#user-redirect
      // e.g. shared/README.md
      const path = encodeURI(widget.selectedItems().next().path);
      const voilaBase = `${PageConfig.getBaseUrl()}voila/render`;

      // replace `/user/username/` to `/user-redirect/` if any
      // for local JupyterLab, it won't change anything, because there is no `/user/username/` part in the URL
      const userRedirectVoilaUrl = transformToUserRedirectUrl(voilaBase);
      const shareableLink = URLExt.join(userRedirectVoilaUrl, path);
      log("Base Voila URL is", voilaBase);
      log("User Redirect Voila URL", userRedirectVoilaUrl);
      log("Path is", path);
      log("Final link is", shareableLink);

      Clipboard.copyToSystem(shareableLink);
    },
    isVisible: () =>
      tracker.currentWidget &&
      toArray(tracker.currentWidget.selectedItems()).length === 1,
    iconClass: 'jp-MaterialIcon jp-LinkIcon',
    label: 'Copy Shareable Dashboard Link'
  });

  const selectorNotDir = '.jp-DirListing-item[data-isdir="false"]';
  app.contextMenu.addItem({
    command: "voila-utils:share-dashboard",
    selector: selectorNotDir,
    rank: 13
  });
}
