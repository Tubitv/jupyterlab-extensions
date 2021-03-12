const func = require('@jupyterlab/testutils/lib/jest-config');

const local = {
  globals: { 'ts-jest': { tsConfig: 'tsconfig.json' } },
  testRegex: `.*\.spec\.tsx?$`,
  transform: {
    '\\.(ts|tsx)?$': 'ts-jest',
    '\\.(js|jsx)?$': 'babel-jest',
  },
  transformIgnorePatterns: ['/node_modules/(?!(@jupyterlab/.*)/)']
};

const upstream = func('voila_utils', __dirname);
const reuseFromUpstream = [
  'moduleNameMapper',
  'setupFilesAfterEnv',
  'setupFiles',
  'moduleFileExtensions',
];
for(option of reuseFromUpstream) {
  local[option] = upstream[option];
}

module.exports = local;
