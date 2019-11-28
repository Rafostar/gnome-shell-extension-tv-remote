/*
GNOME Shell Extension TV Remote
Developer: Rafostar
Extension GitHub: https://github.com/Rafostar/gnome-shell-extension-tv-remote
*/

const Main = imports.ui.main;
const Local = imports.misc.extensionUtils.getCurrentExtension();
const Convenience = Local.imports.convenience;
const Settings = Convenience.getSettings();
const { TvRemoteMenu, webConfig } = Local.imports.remote;

let remote;
let signals;

function setRemotePosition()
{
	let itemIndex = 0;
	let remotePosition = Settings.get_string('tv-remote-position');

	switch(remotePosition)
	{
		case 'left':
			itemIndex = Main.panel._leftBox.get_children().length;
			break;
		case 'center-left':
			remotePosition = 'center';
			break;
		case 'center-right':
			itemIndex = Main.panel._centerBox.get_children().length;
			remotePosition = 'center';
			break;
		default:
			break;
	}

	/* Place remote on top bar */
	Main.panel.addToStatusArea('tv-remote', remote, itemIndex, remotePosition);
}

function changeLabelVisibility()
{
	let showLabel = Settings.get_boolean('show-remote-label');

	if(showLabel) remote.toplabel.show();
	else remote.toplabel.hide();
}

function recreateRemote()
{
	/* Remove previous indicator */
	remote.destroy();
	remote = new TvRemoteMenu(Settings.get_boolean('show-remote-label'));

	setRemotePosition();
}

function updateWebConfig(value, type)
{
	webConfig[value] = Settings['get_' + type]('cec-web-api-' + value);

	if(!webConfig.ip)
		webConfig.ip = '127.0.0.1';
}

function init()
{
	Convenience.initTranslations();
}

function enable()
{
	/* Configure web api ip and port */
	webConfig.ip = Settings.get_string('cec-web-api-ip');
	webConfig.port = Settings.get_int('cec-web-api-port');

	/* Create new remote object from class */
	remote = new TvRemoteMenu(Settings.get_boolean('show-remote-label'));

	/* Clear signals array */
	signals = [];

	/* Connect signals */
	signals.push(Settings.connect('changed::cec-web-api-ip', updateWebConfig.bind(this, 'ip', 'string')));
	signals.push(Settings.connect('changed::cec-web-api-port', updateWebConfig.bind(this, 'port', 'int')));
	signals.push(Settings.connect('changed::tv-remote-position', recreateRemote.bind(this)));
	signals.push(Settings.connect('changed::show-remote-label', changeLabelVisibility.bind(this)));

	/* Add remote to top bar */
	setRemotePosition();

	/* Restore label visibility setting */
	changeLabelVisibility();

	/* Set remote to last used device */
	remote.devicesMenu.activeDevId = Settings.get_string('last-device');

	/* Reload devices list */
	remote.getDevices();
}

function disable()
{
	/* Save last used device before disable */
	Settings.set_string('last-device', remote.devicesMenu.activeDevId);

	/* Disconnect signals from settings */
	signals.forEach(signal => Settings.disconnect(signal));
	signals = null;

	/* Remove TV Remote */
	remote.destroy();
	remote = null;
}
