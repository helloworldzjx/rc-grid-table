import pkg from '../package.json';

const rcGridTableVersion = pkg.version;

const addDependencies = (pkgJson: string) => {
  const pkg = JSON.parse(pkgJson);

  pkg.dependencies = {
    ...pkg.dependencies,
    'rc-grid-table': rcGridTableVersion,
  };

  return JSON.stringify(pkg, null, 2);
};

export function modifyCodeSandboxData(memo: any) {
  const pkgFile = memo.files?.['package.json'];

  if (pkgFile?.content) {
    pkgFile.content = addDependencies(pkgFile.content);
  }

  return memo;
}

export function modifyStackBlitzData(memo: any) {
  if (memo.files?.['package.json']) {
    memo.files['package.json'] = addDependencies(memo.files['package.json']);
  }

  return memo;
}
