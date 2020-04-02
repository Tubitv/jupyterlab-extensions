import {
  transformToUserRedirectUrl,
  log,
} from './index';

const testUrls = {
  original: [
    "http://localhost:8000/lab/tree/path/to/notebook.ipynb",
    "http://localhost:8000/user/jovyan/lab/tree/path/to/notebook.ipynb",
    "http://localhost:8000/user/jovyan/dummy/lab/tree/path/to/notebook.ipynb",
  ],
  expected: [
    "http://localhost:8000/lab/tree/path/to/notebook.ipynb",
    "http://localhost:8000/user-redirect/lab/tree/path/to/notebook.ipynb",
    "http://localhost:8000/user-redirect/dummy/lab/tree/path/to/notebook.ipynb",
  ]
};

afterEach(() => {
  jest.restoreAllMocks();
});

describe('#log', () => {
  it('should call `console.debug` with debug message if it is available', () => {
    const debugSpy = jest.spyOn(console, 'debug');
    const message = 'shareable link';
    log(message);
    expect(debugSpy.mock.calls[0][1]).toBe(message);
  });
});

describe('#transformToUserRedirectUrl', () => {
  it ('should transform tree url to correct user redirect url', () => {
    testUrls.original.forEach((originalUrl, index) => {
      const transformedUrl = transformToUserRedirectUrl(originalUrl);
      log(transformedUrl);
      expect(transformedUrl).toBe(testUrls.expected[index]);
    });
  });
});
