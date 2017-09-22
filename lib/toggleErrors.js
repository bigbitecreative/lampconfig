const shell = require('shelljs');
const inquirer = require('inquirer');
const prompt = inquirer.createPromptModule();

const capitalize = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

const message = (currentStatus, nextStatus) =>
  `PHP error logging is turned ${currentStatus}. Do you want to turn it ${nextStatus}?`;

const toggleErrors = (status, phpVersion) => {
  shell.exec([
    `sudo sed -i "s/display_errors = .*/display_errors = ${capitalize(status)}/" /etc/php/${phpVersion}/fpm/php.ini`
    `sudo service php${phpVersion}-fpm restart > /dev/nul`
  ].join(' && '));
  console.log(chalk.green(`► PHP error logs turned ${status}.`));
};

module.exports = (store) => {
  const getAnswer = {
    name: 'setting',
    message: message(currentStatus, nextStatus),
    type: 'confirm',
  };

  store.get(['php_version', 'log_php_errors'], ([phpVersion, phpErrorStatus]) => {
    const currentStatus = phpErrorStatus ? 'on' : 'off';
    const nextStatus = phpErrorStatus ? 'off' : 'on';

    prompt(getAnswer).then((answer) => {
      if (!answer.setting) return;
      toggleErrors(nextStatus, phpVersion);
      store.save('log_php_errors', !phpErrorStatus);
    });
  });
};