import { PathExt } from '@jupyterlab/coreutils';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { Contents } from '@jupyterlab/services';

import {
  copyDirectory,
  getCopiedDirectoryPath,
  log,
} from './index';

function createContent(options: Partial<Contents.IModel> = {}): Contents.IModel {
  const defaultDirectory = {
    name: 'jovyan',
    path: 'home/jovyan',
    type: 'directory' as Contents.ContentType,
    writable: true,
    created: '1581665248391',
    last_modified: '1581665248391',
    mimetype: 'text/directory',
    content: [] as any,
    format: 'file' as Contents.FileFormat,
  };
  return {
    ...defaultDirectory,
    ...options,
  };
}

function createManager(getMethod?: (path: string) => Partial<Contents.IModel>, others?: object): IDocumentManager {
  return {
    services: {
      contents: {
        get: getMethod || (() => ({
          name: 'home',
          content: [] as Contents.IModel[],
        })),
      },
    },
    ...(others || {}),
  } as unknown as IDocumentManager;
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('#log', () => {
  it('should call `console.debug` with debug message if it is available', () => {
    const debugSpy = jest.spyOn(console, 'debug');
    const message = 'deep copy';

    log(message);
    expect(debugSpy.mock.calls[0][1]).toBe(message);
  });
});

describe('#getCopiedDirectoryPath', () => {
  it('should use the same name if no conflicts with the target directory contents', async () => {
    const directory = createContent();
    const toDir = 'shared';
    const manager = createManager();
    const result = await getCopiedDirectoryPath(directory, toDir, manager);

    expect(result).toBe(`${toDir}/${directory.name}`);
  });

  it('should remove the copy suffix in the copied directory', async () => {
    const directory = createContent({ name: 'jovyan-Copy1' });
    const toDir = 'shared';
    const manager = createManager();
    const result = await getCopiedDirectoryPath(directory, toDir, manager);

    expect(result).toBe(`${toDir}/${directory.name}`);
  });

  it('should append suffix if there is a name conflict with the target directory contents', async () => {
    const directory = createContent();
    const toDir = 'shared';
    const manager = createManager(() => ({
      name: 'home',
      content: [
        createContent({ name: directory.name }),
      ] as Contents.IModel[],
    }));
    const result = await getCopiedDirectoryPath(directory, toDir, manager);

    expect(result).toBe(`${toDir}/${directory.name}-Copy1`);
  });

  it('should increase suffix serial number if there is name conflict with a content with copy suffix', async () => {
    const directory = createContent({ name: 'jovyan' });
    const toDir = 'shared';
    const manager = createManager(() => ({
      name: 'home',
      content: [
        createContent({ name: `${directory.name}` }),
        createContent({ name: `${directory.name}-Copy1` }),
      ] as Contents.IModel[],
    }));
    const result = await getCopiedDirectoryPath(directory, toDir, manager);

    expect(result).toBe(`${toDir}/${directory.name}-Copy2`);
  });

  it('should increase suffix serial number if there are name conflicts with multiple contents with copy suffix', async () => {
    const directory = createContent({ name: 'jovyan' });
    const toDir = 'shared';
    const manager = createManager(() => ({
      name: 'home',
      content: [
        createContent({ name: `${directory.name}` }),
        createContent({ name: `${directory.name}-Copy1` }),
        createContent({ name: `${directory.name}-Copy3` }),
      ] as Contents.IModel[],
    }));
    const result = await getCopiedDirectoryPath(directory, toDir, manager);

    expect(result).toBe(`${toDir}/${directory.name}-Copy4`);
  });
});

describe('#copyDirectory', () => {
  let directory: Contents.IModel;
  const toDir = 'shared';
  const manager = createManager(
    (path: string) => {
      // Only `getCopiedDirectoryPath` queries with `toDir` prefix, so directly return an
      // empty directory in order to simulate deep copy
      if (path.startsWith(toDir)) {
        return createContent({
          name: toDir,
          path: toDir,
        });
      }

      const findContent = (contentPath: string, content: Contents.IModel): Contents.IModel | undefined => {
        if (content.path === contentPath) return content;
        let result: Contents.IModel | undefined;
        Array.from(content.content).some((item: any) => {
          result = findContent(path, item);
          return !!result;
        });
        return result;
      };

      return findContent(path, directory);
    },
    {
      copy: (fromPath: string, toDir: string) => createContent({
        name: PathExt.basename(fromPath),
        path: `${toDir}/${PathExt.basename(fromPath)}`,
        type: 'file',
      }),
      newUntitled: ({ path }: { path: string }) => createContent({
        name: 'Untitled',
        path: `${path}/Untitled`,
      }),
      rename: (fromPath: string, toPath: string) => createContent({
        name: PathExt.basename(toPath),
        path: toPath,
      }),
    },
  );

  it('should copy directory to new path', async () => {
    directory = createContent();
    const result = await copyDirectory(directory, toDir, manager);
    expect(result).toHaveProperty('path', `${toDir}/${directory.name}`);
  });

  it('should copy all contents of the directory to new path', async () => {
    directory = createContent({
      name: 'jovyan',
      path: 'home/jovyan',
      content: [
        createContent({
          name: 'child1',
          path: 'home/jovyan/child1',
          type: 'file',
        }),
        createContent({
          name: 'child2',
          path: 'home/jovyan/child2',
          content: [
            createContent({
              name: 'grandChild1',
              path: 'home/jovyan/child2/grandChild1',
              type: 'file',
            }),
          ],
        }),
      ],
    });
    const spyCopy = jest.spyOn(manager, 'copy');
    const spyRename = jest.spyOn(manager, 'rename');
    const result = await copyDirectory(directory, toDir, manager);

    expect(result.path).toBe(`${toDir}/${directory.name}`);

    expect(spyCopy).toHaveBeenCalledTimes(2);
    expect(spyCopy.mock.calls[0][1]).toBe(`${toDir}/${directory.name}`);
    expect(spyCopy.mock.calls[1][1]).toBe(`${toDir}/${directory.name}/child2`);

    expect(spyRename).toHaveBeenCalledTimes(2);
    expect(spyRename.mock.calls[1][1]).toBe(`${toDir}/${directory.name}/child2`);
  });
});
