import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { PathExt } from '@jupyterlab/coreutils';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { Contents } from '@jupyterlab/services';
import { each, map, toArray } from '@lumino/algorithm';

const CommandIDs = {
  deepCopy: 'filebrowser:deep-copy',
  deepCut: 'filebrowser:deep-cut',
  deepPaste: 'filebrowser:deep-paste'
};
const selectorContent = '.jp-DirListing ul.jp-DirListing-content';
const selectorItem = '.jp-DirListing-item[data-isdir]';
const regCopySuffix = /(-Copy\d+)?$/;

/**
 * Escape the `RegExp` special characters in `text` string
 * @link https://github.com/lodash/lodash/blob/4.17.15/lodash.js#L14258-L14278
 */
const regRegExpChar = /[\\^$.*+?()[\]{}|]/g;
const regHasRegExpChar = RegExp(regRegExpChar.source);
const escapeRegExp = (text: string): string => (
  (text && regHasRegExpChar.test(text))
    ? text.replace(regRegExpChar, '\\$&')
    : text
);

/**
 * Log debugging information
 */
export function log(...args: any[]): void {
  if (console && console.debug) {
    console.debug('[filebrowser-deep-copy-paste]', ...args);
  }
}

/**
 * Get copied directory name
 * If there is an exisiting directory or file having the same name, suffix it with `Copy 1`, `Copy 2`, etc
 */
export async function getCopiedDirectoryPath(directory: Contents.IModel, toDir: string, manager: IDocumentManager): Promise<string> {
  const directoryPath = PathExt.join(toDir, directory.name);
  const destinationDirectory = await manager.services.contents.get(toDir, { content: true });
  const existingContents = toArray(destinationDirectory.content) as Contents.IModel[];
  const hasSameNameContent = !!existingContents.find((content: Contents.IModel) => content.name === directory.name);
  if (!hasSameNameContent) {
    return directoryPath;
  }

  const rawDirectoryName = directory.name.replace(regCopySuffix, '');
  const regCopyName = new RegExp(`^${escapeRegExp(rawDirectoryName)}-Copy(\\d+)$`);
  const maxSerialNumber = existingContents.reduce((serial: number, content: Contents.IModel) => {
    const matches = content.name.match(regCopyName);
    return matches === null ? serial : Math.max(Number(matches[1]), serial);
  }, 0);
  log('getCopiedDirectoryPath', 'same directory or file exists', directoryPath, maxSerialNumber);

  return PathExt.join(toDir, directory.name.replace(regCopySuffix, `-Copy${maxSerialNumber + 1}`));
}

/**
 * Copy a directory recursively
 */
export async function copyDirectory(directory: Contents.IModel, toDir: string, manager: IDocumentManager): Promise<Contents.IModel> {
  const copiedDirectoryPath = await getCopiedDirectoryPath(directory, toDir, manager);
  const untitledDirectory = await manager.newUntitled({ path: toDir, type: 'directory' });
  const copiedDirectory = await manager.rename(untitledDirectory.path, copiedDirectoryPath);
  log('copyDirectory', 'new directory created', copiedDirectory);

  await Promise.all(
    toArray(map(directory.content, async (item: Contents.IModel) => {
      log('copyDirectory', `copy ${item.type} '${item.name}' in directory '${directory.path}'`);
      if (item.type === 'directory') {
        const directoryItem = await manager.services.contents.get(item.path, { content: true });
        await copyDirectory(directoryItem, copiedDirectory.path, manager);
      } else {
        await manager.copy(item.path, copiedDirectory.path);
      }
    }))
  );

  return copiedDirectory;
}

/**
 * Plugin activate handler
 */
function activate(
  app: JupyterFrontEnd,
  factory: IFileBrowserFactory
): void {
  log('Custom plugin is activated!');
  const { commands } = app;
  const { tracker } = factory;
  let clipboard: string[] = [];
  let isCut = false;
  const copySelectedItemsToClipboard = () => {
    const widget = tracker.currentWidget;
    if (!widget) {
      return;
    }

    clipboard.length = 0;
    each(widget.selectedItems(), item => {
      clipboard.push(item.path);
    });
  };

  commands.addCommand(CommandIDs.deepCopy, {
    execute: () => {
      copySelectedItemsToClipboard();
    },
    iconClass: 'jp-MaterialIcon jp-CopyIcon',
    label: 'Deep Copy'
  });

  commands.addCommand(CommandIDs.deepCut, {
    execute: () => {
      isCut = true;
      copySelectedItemsToClipboard();
    },
    iconClass: 'jp-MaterialIcon jp-CutIcon',
    label: 'Deep Cut'
  });

  commands.addCommand(CommandIDs.deepPaste, {
    execute: async () => {
      const widget = tracker.currentWidget;
      if (!widget) {
        return;
      }
      if (!clipboard.length) {
        isCut = false;
        return;
      }

      const { manager, path: basePath } = widget.model;
      log('deep paste basePath', basePath);
      // Use serial execution rather than parallel to avoid name conflicts in new copied files
      for (let i = 0; i < clipboard.length; i++) {
        const path = clipboard[i];
        if (isCut) {
          const newPath = PathExt.join(basePath, PathExt.basename(path));
          log('deep paste cut item', path);
          await manager.rename(path, newPath);
          break;
        }

        const item = await manager.services.contents.get(path, { content: true });
        log('deep paste copied item', item);
        if (item.type === 'directory') {
          await copyDirectory(item, basePath, manager);
        } else {
          await manager.copy(path, basePath);
        }
      }

      clipboard.length = 0;
      isCut = false;
    },
    iconClass: 'jp-MaterialIcon jp-PasteIcon',
    label: 'Deep Paste'
  });

  // Tune rank parameter to put these commands as close as possible
  // @link https://github.com/jupyterlab/lumino/blob/master/packages/widgets/src/contextmenu.ts#L159-L171
  app.contextMenu.addItem({
    command: CommandIDs.deepCopy,
    selector: selectorItem,
    rank: 500
  });
  app.contextMenu.addItem({
    command: CommandIDs.deepCut,
    selector: selectorItem,
    rank: 500
  });
  app.contextMenu.addItem({
    command: CommandIDs.deepPaste,
    selector: selectorContent,
    rank: 0
  });
}

const deepCopyPaste: JupyterFrontEndPlugin<void> = {
  activate: activate,
  id: '@tubitv/filebrowser-deep-copy-paste',
  requires: [IFileBrowserFactory],
  autoStart: true
};

export default deepCopyPaste;
