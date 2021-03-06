const shell = require('shelljs');
const chalk = require('chalk');

const toInsert = site =>`
#!/bin/sh
git --work-tree=/var/www/${site} --git-dir=/var/repo/${site}.git checkout -f
EOF
`;

module.exports = (site) => {
  return new Promise((resolve, reject) => {
    shell.exec([
      `sudo mkdir -p /var/www/${site}`,
      `sudo mkdir -p /var/repo/${site}.git`,
      `cd /var/repo/${site}.git`,
      'git init --bare',
      `cat > hooks/post-receive <<-EOF ${toInsert(site)}`
    ].join(' && '), { async: true, silent: true }, () => {
      shell.chmod('+x', `/var/repo/${site}.git/hooks/post-receive`);
      console.log(chalk.green(`► Set up git workflow.`));
      resolve(site);
    });
  });
}
