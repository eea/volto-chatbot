/**
 * Generic Jest configuration for Volto addons
 *
 * This configuration automatically:
 * - Detects the addon name from the config file path
 * - Configures test coverage to focus on the specific test path
 * - Handles different ways of specifying test paths:
 *   - Full paths like src/addons/addon-name/src/components
 *   - Just filenames like Component.test.jsx
 *   - Just directory names like components
 *
 * Usage:
 * RAZZLE_JEST_CONFIG=src/addons/addon-name/jest-addon.config.js CI=true yarn test [test-path] --collectCoverage
 */

require('dotenv').config({ path: __dirname + '/.env' });

const path = require('path');
const fs = require('fs');
const fg = require('fast-glob');

// Get the addon name from the current file path
const pathParts = __filename.split(path.sep);
const addonsIdx = pathParts.lastIndexOf('addons');
const addonName =
  addonsIdx !== -1 && addonsIdx < pathParts.length - 1
    ? pathParts[addonsIdx + 1]
    : path.basename(path.dirname(__filename)); // Fallback to folder name
const addonBasePath = `src/addons/${addonName}/src`;

// --- Performance caches ---
const fileSearchCache = new Map();
const dirSearchCache = new Map();
const dirListingCache = new Map();
const statCache = new Map();
const implementationCache = new Map();

/**
 * Cached fs.statSync wrapper to avoid redundant filesystem calls
 * @param {string} p
 * @returns {fs.Stats|null}
 */
const getStatSync = (p) => {
  if (statCache.has(p)) return statCache.get(p);
  try {
    const s = fs.statSync(p);
    statCache.set(p, s);
    return s;
  } catch {
    statCache.set(p, null);
    return null;
  }
};

/**
 * Find files that match a specific pattern using fast-glob
 * @param {string} baseDir - The base directory to search in
 * @param {string} fileName - The name of the file to find
 * @param {string} [pathPattern=''] - Optional path pattern to filter results
 * @returns {string[]} - Array of matching file paths
 */
const findFilesWithPattern = (baseDir, fileName, pathPattern = '') => {
  const cacheKey = `${baseDir}|${fileName}|${pathPattern}`;
  if (fileSearchCache.has(cacheKey)) {
    return fileSearchCache.get(cacheKey);
  }

  let files = [];
  try {
    const patterns = fileName
      ? [`${baseDir}/**/${fileName}`]
      : [`${baseDir}/**/*.{js,jsx,ts,tsx}`];

    files = fg.sync(patterns, { onlyFiles: true });

    if (pathPattern) {
      files = files.filter((file) => file.includes(pathPattern));
    }
  } catch {
    files = [];
  }

  fileSearchCache.set(cacheKey, files);
  return files;
};

/**
 * Find directories that match a specific pattern using fast-glob
 * @param {string} baseDir - The base directory to search in
 * @param {string} dirName - The name of the directory to find
 * @param {string} [pathPattern=''] - Optional path pattern to filter results
 * @returns {string[]} - Array of matching directory paths
 */
const findDirsWithPattern = (baseDir, dirName, pathPattern = '') => {
  const cacheKey = `${baseDir}|${dirName}|${pathPattern}`;
  if (dirSearchCache.has(cacheKey)) {
    return dirSearchCache.get(cacheKey);
  }

  let dirs = [];
  try {
    const patterns = dirName
      ? [`${baseDir}/**/${dirName}`]
      : [`${baseDir}/**/`];

    dirs = fg.sync(patterns, { onlyDirectories: true });

    if (pathPattern) {
      dirs = dirs.filter((dir) => dir.includes(pathPattern));
    }
  } catch {
    dirs = [];
  }

  dirSearchCache.set(cacheKey, dirs);
  return dirs;
};

/**
 * Find files or directories in the addon using fast-glob
 * @param {string} name - The name to search for
 * @param {string} type - The type of item to find ('f' for files, 'd' for directories)
 * @param {string} [additionalOptions=''] - Additional options for flexible path matching
 * @returns {string|null} - The path of the found item or null if not found
 */
const findInAddon = (name, type, additionalOptions = '') => {
  const isFile = type === 'f';
  const isDirectory = type === 'd';
  const isFlexiblePathMatch = additionalOptions.includes('-path');

  let pathPattern = '';
  if (isFlexiblePathMatch) {
    const match = additionalOptions.match(/-path "([^"]+)"/);
    if (match && match[1]) {
      pathPattern = match[1].replace(/\*/g, '');
    }
  }

  try {
    let results = [];
    if (isFile) {
      results = findFilesWithPattern(addonBasePath, name, pathPattern);
    } else if (isDirectory) {
      results = findDirsWithPattern(addonBasePath, name, pathPattern);
    }
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    return null;
  }
};

/**
 * Find the implementation file for a test file
 * @param {string} testPath - Path to the test file
 * @returns {string|null} - Path to the implementation file or null if not found
 */
const findImplementationFile = (testPath) => {
  if (implementationCache.has(testPath)) {
    return implementationCache.get(testPath);
  }

  if (!fs.existsSync(testPath)) {
    implementationCache.set(testPath, null);
    return null;
  }

  const dirPath = path.dirname(testPath);
  const fileName = path.basename(testPath);

  // Regex for common test file patterns (e.g., .test.js, .spec.ts)
  const TEST_OR_SPEC_FILE_REGEX = /\.(test|spec)\.[jt]sx?$/;

  if (!TEST_OR_SPEC_FILE_REGEX.test(fileName)) {
    implementationCache.set(testPath, null);
    return null;
  }

  const baseFileName = path
    .basename(fileName, path.extname(fileName))
    .replace(/\.(test|spec)$/, ''); // Remove .test or .spec

  let dirFiles = dirListingCache.get(dirPath);
  if (!dirFiles) {
    dirFiles = fs.readdirSync(dirPath);
    dirListingCache.set(dirPath, dirFiles);
  }

  const exactMatch = dirFiles.find((file) => {
    const fileBaseName = path.basename(file, path.extname(file));
    return (
      fileBaseName === baseFileName && !TEST_OR_SPEC_FILE_REGEX.test(file) // Ensure it's not another test/spec file
    );
  });

  if (exactMatch) {
    const result = `${dirPath}/${exactMatch}`;
    implementationCache.set(testPath, result);
    return result;
  }

  const similarMatch = dirFiles.find((file) => {
    if (
      TEST_OR_SPEC_FILE_REGEX.test(file) ||
      (getStatSync(`${dirPath}/${file}`)?.isDirectory() ?? false)
    ) {
      return false;
    }
    const fileBaseName = path.basename(file, path.extname(file));
    return (
      fileBaseName.toLowerCase().includes(baseFileName.toLowerCase()) ||
      baseFileName.toLowerCase().includes(fileBaseName.toLowerCase())
    );
  });

  if (similarMatch) {
    const result = `${dirPath}/${similarMatch}`;
    implementationCache.set(testPath, result);
    return result;
  }

  implementationCache.set(testPath, null);
  return null;
};

/**
 * Get the test path from command line arguments
 * @returns {string|null} - The resolved test path or null if not found
 */
const getTestPath = () => {
  const args = process.argv;
  let testPath = null;
  const TEST_FILE_REGEX = /\.test\.[jt]sx?$/; // Matches .test.js, .test.jsx, .test.ts, .test.tsx

  testPath = args.find(
    (arg) =>
      arg.includes(addonName) &&
      !arg.startsWith('--') &&
      arg !== 'test' &&
      arg !== 'node',
  );

  if (!testPath) {
    const testIndex = args.findIndex((arg) => arg === 'test');
    if (testIndex !== -1 && testIndex < args.length - 1) {
      const nextArg = args[testIndex + 1];
      if (!nextArg.startsWith('--')) {
        testPath = nextArg;
      }
    }
  }

  if (!testPath) {
    testPath = args.find((arg) => TEST_FILE_REGEX.test(arg));
  }

  if (!testPath) {
    return null;
  }

  if (!testPath.includes(path.sep)) {
    if (TEST_FILE_REGEX.test(testPath)) {
      const foundTestFile = findInAddon(testPath, 'f');
      if (foundTestFile) {
        return foundTestFile;
      }
    } else {
      const foundDir = findInAddon(testPath, 'd');
      if (foundDir) {
        return foundDir;
      }
      const flexibleDir = findInAddon(testPath, 'd', `-path "*${testPath}*"`);
      if (flexibleDir) {
        return flexibleDir;
      }
    }
  } else if (
    TEST_FILE_REGEX.test(testPath) && // Check if it looks like a test file path
    !testPath.startsWith('src/addons/')
  ) {
    const testFileName = path.basename(testPath);
    const foundTestFile = findInAddon(testFileName, 'f');
    if (foundTestFile) {
      const relativePath = path.dirname(testPath);
      if (foundTestFile.includes(relativePath)) {
        return foundTestFile;
      }
      const similarFiles = findFilesWithPattern(
        addonBasePath,
        testFileName,
        relativePath,
      );
      if (similarFiles && similarFiles.length > 0) {
        return similarFiles[0];
      }
    }
  }

  if (
    !path
      .normalize(testPath)
      .startsWith(path.join('src', 'addons', addonName, 'src')) &&
    !path.isAbsolute(testPath) // Use path.isAbsolute for robust check
  ) {
    testPath = path.join(addonBasePath, testPath); // Use path.join for OS-agnostic paths
  }

  if (fs.existsSync(testPath)) {
    return testPath;
  }

  const pathWithoutTrailingSlash = testPath.endsWith(path.sep)
    ? testPath.slice(0, -1)
    : null;
  if (pathWithoutTrailingSlash && fs.existsSync(pathWithoutTrailingSlash)) {
    return pathWithoutTrailingSlash;
  }

  const pathWithTrailingSlash = !testPath.endsWith(path.sep)
    ? testPath + path.sep
    : null;
  if (pathWithTrailingSlash && fs.existsSync(pathWithTrailingSlash)) {
    // Generally, return paths without trailing slashes for consistency,
    // unless it's specifically needed for a directory that only exists with it (rare).
    return testPath;
  }
  return testPath; // Return the original path if no variations exist
};

/**
 * Determine collectCoverageFrom patterns based on test path
 * @returns {string[]} - Array of coverage patterns
 */
const getCoveragePatterns = () => {
  const excludePatterns = [
    '!src/**/*.d.ts',
    '!**/*.test.{js,jsx,ts,tsx}',
    '!**/*.spec.{js,jsx,ts,tsx}',
  ];

  const defaultPatterns = [
    `${addonBasePath}/**/*.{js,jsx,ts,tsx}`,
    ...excludePatterns,
  ];

  const ANY_SCRIPT_FILE_REGEX = /\.[jt]sx?$/;

  const directoryArg = process.argv.find(
    (arg) =>
      !arg.includes(path.sep) &&
      !arg.startsWith('--') &&
      arg !== 'test' &&
      arg !== 'node' &&
      !ANY_SCRIPT_FILE_REGEX.test(arg) &&
      ![
        'yarn',
        'npm',
        'npx',
        'collectCoverage',
        'CI',
        'RAZZLE_JEST_CONFIG',
      ].some(
        (reserved) =>
          arg === reserved || arg.startsWith(reserved.split('=')[0] + '='),
      ) &&
      process.argv.indexOf(arg) >
        process.argv.findIndex((item) => item === 'test'),
  );

  if (directoryArg) {
    const foundDir = findInAddon(directoryArg, 'd');
    if (foundDir) {
      return [`${foundDir}/**/*.{js,jsx,ts,tsx}`, ...excludePatterns];
    }
  }

  let testPath = getTestPath();

  if (!testPath) {
    return defaultPatterns;
  }

  if (testPath.endsWith(path.sep)) {
    testPath = testPath.slice(0, -1);
  }

  const stats = getStatSync(testPath);

  if (stats && stats.isFile()) {
    const implFile = findImplementationFile(testPath);
    if (implFile) {
      return [implFile, '!src/**/*.d.ts'];
    }
    const dirPath = path.dirname(testPath);
    return [`${dirPath}/**/*.{js,jsx,ts,tsx}`, ...excludePatterns];
  } else if (stats && stats.isDirectory()) {
    return [`${testPath}/**/*.{js,jsx,ts,tsx}`, ...excludePatterns];
  }

  return defaultPatterns;
};

const coverageConfig = getCoveragePatterns();

module.exports = {
  testMatch: ['**/src/addons/**/?(*.)+(spec|test).[jt]s?(x)'],
  collectCoverageFrom: coverageConfig,
  coveragePathIgnorePatterns: [
    '/node_modules/',
    'schema\\.[jt]s?$',
    'index\\.[jt]s?$',
    'config\\.[jt]sx?$',
  ],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '@plone/volto/cypress': '<rootDir>/node_modules/@plone/volto/cypress',
    '@plone/volto/babel': '<rootDir>/node_modules/@plone/volto/babel',
    '@plone/volto/(.*)$': '<rootDir>/node_modules/@plone/volto/src/$1',
    '@package/(.*)$': '<rootDir>/node_modules/@plone/volto/src/$1',
    '@root/(.*)$': '<rootDir>/node_modules/@plone/volto/src/$1',
    '@plone/volto-quanta/(.*)$': '<rootDir>/src/addons/volto-quanta/src/$1',
    '@eeacms/search/(.*)$': '<rootDir>/src/addons/volto-searchlib/searchlib/$1',
    '@eeacms/search': '<rootDir>/src/addons/volto-searchlib/searchlib',
    '@eeacms/(.*?)/(.*)$': '<rootDir>/node_modules/@eeacms/$1/src/$2',
    '@plone/volto-slate$':
      '<rootDir>/node_modules/@plone/volto/packages/volto-slate/src',
    '@plone/volto-slate/(.*)$':
      '<rootDir>/node_modules/@plone/volto/packages/volto-slate/src/$1',
    '~/(.*)$': '<rootDir>/src/$1',
    'load-volto-addons':
      '<rootDir>/node_modules/@plone/volto/jest-addons-loader.js',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(@plone|@root|@package|@eeacms)/).*/',
  ],
  transform: {
    '^.+\\.js(x)?$': 'babel-jest',
    '^.+\\.ts(x)?$': 'babel-jest',
    '^.+\\.(png)$': 'jest-file',
    '^.+\\.(jpg)$': 'jest-file',
    '^.+\\.(svg)$': './node_modules/@plone/volto/jest-svgsystem-transform.js',
  },
  coverageThreshold: {
    global: {
      branches: 5,
      functions: 5,
      lines: 5,
      statements: 5,
    },
  },
  ...(process.env.JEST_USE_SETUP === 'ON' && {
    setupFilesAfterEnv: [
      fs.existsSync(
        path.join(
          __dirname,
          'node_modules',
          '@eeacms',
          addonName,
          'jest.setup.js',
        ),
      )
        ? `<rootDir>/node_modules/@eeacms/${addonName}/jest.setup.js`
        : `<rootDir>/src/addons/${addonName}/jest.setup.js`,
    ],
  }),
};
