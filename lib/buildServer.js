const chalk = require('chalk');
const inquirer = require('inquirer');
const prompt = inquirer.createPromptModule();
const runCommand = require('./runCommand');
const installMySQL = require('./installMySQL');
const choosePHPVersion = require('./choosePHPVersion');
const fail2Ban = require('./fail2Ban');
const ufw = require('./ufw');

const startMessage = `
► Building Server...
`;

module.exports = () => {
  let PHP_VERSION = '5.6';
  let SSH_PORT_NUMBER = 22;

  console.log(chalk.blue(startMessage));

  runCommand({
    loader: 'Installing Language Pack...',
    cmd: 'sudo apt-get install -qq language-pack-en-base',
    success: 'Language Pack Installed.'
  })
  .then(() => runCommand({
    loader: 'Adding Repsitory...',
    cmd: 'sudo add-apt-repository ppa:ondrej/php',
    success: 'Repository Added.'
  }))
  .then(() => runCommand({
    loader: 'Running Update...',
    cmd: 'sudo apt-get update',
    success: 'Updated.'
  }))
  .then(() => runCommand({
    loader: 'Installing Apache...',
    cmd: 'sudo apt-get install -qq apache2',
    success: 'Apache Installed.'
  }))
  .then(() => installMySQL({
    loader: 'Installing Apache...',
    passwordPrompt: 'Please enter a password for MySQL',
    success: 'MySQL Installed.'
  }))
  .then(() => choosePHPVersion())
  .then((version) => {
    return new Promise((resolve, reject) => {
      PHP_VERSION = version;
      resolve();
    })
  })
  .then(() => runCommand({
    loader: 'Installing PHP..',
    cmd: `sudo apt-get install -qq php${PHP_VERSION}-cli php${PHP_VERSION}-fpm php${PHP_VERSION}-mysql php${PHP_VERSION}-pgsql php${PHP_VERSION}-sqlite php${PHP_VERSION}-curl php${PHP_VERSION}-gd php${PHP_VERSION}-gmp php${PHP_VERSION}-mcrypt php${PHP_VERSION}-xdebug php${PHP_VERSION}-memcached php${PHP_VERSION}-imagick php${PHP_VERSION}-intl php${PHP_VERSION}-mbstring php${PHP_VERSION}-mbstring php${PHP_VERSION}-common`,
    success: 'PHP Installed.'
  }))
  .then(() => runCommand({
    loader: 'Editing FPM config...',
    cmd: `sudo sed -i "s/listen =.*/listen = 127.0.0.1:9000/" /etc/php/${PHP_VERSION}/fpm/pool.d/www.conf && sudo sed -i "s/;listen.allowed_clients/listen.allowed_clients/" /etc/php/${PHP_VERSION}/fpm/pool.d/www.conf && sudo service php${PHP_VERSION}-fpm restart`,
    success: 'Editing done.'
  }))
  .then(() => runCommand({
    loader: 'Enabling support for the FastCGI protocol...',
    cmd: `a2enmod proxy_fcgi setenvif && a2enconf php${PHP_VERSION}-fpm`,
    success: 'Support enabled for the FastCGI protocol.'
  }))
  .then(() => runCommand({
    loader: 'Restarting Apache...',
    cmd: 'service apache2 restart',
    success: 'Apache Restarted.'
  }))
  .then(() => {
    const options = {
      name: 'port',
      message: 'What port are you using for SSH?',
      validate: (input) => {
        if (!/\S/.test(input)) return `You can't leave this value blank`;
        if (isNaN(input)) return 'You must enter a valid number';
        return true;
      }
    };

    return prompt(options).then((input) => input.port);
  })
  .then((port) => {
    return new Promise((res, re) => {
      SSH_PORT_NUMBER = port;
      res();
    })
  })
  .then(() => fail2Ban(SSH_PORT_NUMBER))
  .then(() => ufw(SSH_PORT_NUMBER))
  .then(() => console.log(chalk.green(`► Completed. `)));
};