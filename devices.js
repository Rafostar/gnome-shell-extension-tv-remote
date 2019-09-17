const { Clutter } = imports.gi;
const PopupMenu = imports.ui.popupMenu;
const Local = imports.misc.extensionUtils.getCurrentExtension();
const Gettext = imports.gettext.domain(Local.metadata['gettext-domain']);
const _ = Gettext.gettext;

const ACTIVE_DEVICE_ICON = 'input-dialpad-symbolic';

var DevicesSubMenu = class extends PopupMenu.PopupSubMenuMenuItem
{
	constructor()
	{
		super(_("Devices"), true);

		this.icon.icon_name = 'view-list-symbolic';
		this.menuDevices = [];

		this.activeDevId = 'dev0';

		let callback = () =>
		{
			if(this.hasOwnProperty('actor'))
				this.actor.opacity = (this.actor.hover) ? 255 : (this.menu.isOpen) ? 255 : 130;
			else
				this.opacity = (this.hover) ? 255 : (this.menu.isOpen) ? 255 : 130;
		}

		this.menu.connect('open-state-changed', callback);

		if(this.hasOwnProperty('actor'))
		{
			this.actor.opacity = 130;
			this.actor.connect('notify::hover', callback);
		}
		else
		{
			this.opacity = 130;
			this.connect('notify::hover', callback);
		}

		this.updateActiveDev = (source, data) =>
		{
			if(
				data
				&& typeof data === 'object'
				&& data.hasOwnProperty('devId')
			) {
				this.menuDevices.forEach(menuDevice =>
				{
					if(menuDevice !== source)
						menuDevice._icon.icon_name = '';
				});

				this.activeDevId = data.devId;
			}
		}

		this.updateList = (listObj) =>
		{
			if(this.menuDevices.length && !this.menu.isOpen)
				return;

			Object.keys(listObj).forEach(key =>
			{
				if(
					key.startsWith('dev')
					&& typeof listObj[key] === 'object'
					&& listObj[key].hasOwnProperty('osdString')
					&& listObj[key].osdString !== 'CEC-WEB-API'
					&& !this.menuDevices.some(element => element.devId === key)
				) {
					let device = new DevicesMenuItem(key, listObj[key]);

					if(key === this.activeDevId)
						device._icon.icon_name = ACTIVE_DEVICE_ICON;

					device.signalIds.push(
						device.connect('button-release-event', this.updateActiveDev.bind(this))
					);

					this.menuDevices.push(device);
					this.menu.addMenuItem(device);
				}
			});
		}
	}

	destroy()
	{
		this.menuDevices.forEach(menuDevice => menuDevice.destroy());

		super.destroy();
	}
}

class DevicesMenuItem extends PopupMenu.PopupImageMenuItem
{
	constructor(devId, opts)
	{
		opts.name = opts.name || _("Unknown");

		super(opts.name, '');

		this.devId = devId;
		this.signalIds = [];
	}

	_onButtonReleaseEvent(actor, event)
	{
		actor.remove_style_pseudo_class('active');
		this._icon.icon_name = ACTIVE_DEVICE_ICON;
		this.emit('button-release-event', { devId : this.devId });

		return Clutter.EVENT_STOP;
	}

	destroy()
	{
		this.signalIds.forEach(signalId => this.disconnect(signalId));

		super.destroy();
	}
}
