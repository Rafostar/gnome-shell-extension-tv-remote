const PopupMenu = imports.ui.popupMenu;
const Local = imports.misc.extensionUtils.getCurrentExtension();
const Gettext = imports.gettext.domain(Local.metadata['gettext-domain']);
const _ = Gettext.gettext;
const Compat = Local.imports.compat;
const { DevicesMenuItem } = Compat;

var DevicesSubMenu = class extends PopupMenu.PopupSubMenuMenuItem
{
	constructor()
	{
		super(_("Devices"), true);

		this.icon.icon_name = 'view-list-symbolic';
		this.menuDevices = [];
		this.activeDevId = 'dev0';

		this.tempMenuItem = new PopupMenu.PopupMenuItem(_("No devices"));
		this.tempMenuItem.setSensitive(false);
		this.menu.addMenuItem(this.tempMenuItem);

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

		this.updateActiveDev = (source, event) =>
		{
			if(
				source
				&& typeof source === 'object'
				&& source.hasOwnProperty('devId')
			) {
				this.menuDevices.forEach(menuDevice =>
				{
					if(menuDevice !== source)
						menuDevice._icon.icon_name = '';
				});

				this.activeDevId = source.devId;
			}
		}

		this.updateList = (listObj) =>
		{
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
						device._icon.icon_name = Compat.activeDeviceIcon;

					device.signalIds.push(
						device.connect(Compat.usedSignal, this.updateActiveDev.bind(this))
					);

					this.menuDevices.push(device);
					this.menu.addMenuItem(device);
				}
			});

			if(this.tempMenuItem && this.menuDevices.length > 0)
			{
				this.tempMenuItem.destroy();
				this.tempMenuItem = null;
			}
		}
	}

	destroy()
	{
		if(this.tempMenuItem)
			this.tempMenuItem.destroy();

		this.menuDevices.forEach(menuDevice => menuDevice.destroy());

		super.destroy();
	}
}
