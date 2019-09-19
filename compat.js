const { Clutter, GObject } = imports.gi;
const PopupMenu = imports.ui.popupMenu;
const Config = imports.misc.config;
const Local = imports.misc.extensionUtils.getCurrentExtension();
const Gettext = imports.gettext.domain(Local.metadata['gettext-domain']);
const _ = Gettext.gettext;

const GNOME_MINOR_VER = Object.assign(Config.PACKAGE_VERSION).split('.')[1];

var usedSignal = (GNOME_MINOR_VER >= 31) ? 'device-changed' : 'button-release-event';
var activeDeviceIcon = 'input-dialpad-symbolic';

var DevicesMenuItem = (GNOME_MINOR_VER >= 31) ?
	GObject.registerClass({
		Signals: { [usedSignal]: { param_types: [Clutter.Event.$gtype] }
		}
	},
	class extends PopupMenu.PopupImageMenuItem
	{
		_init(devId, opts)
		{
			/* TRANSLATORS: Undetected device name */
			opts.name = opts.name || _("Unknown");

			super._init(opts.name, '');

			this.devId = devId;
			this.signalIds = [];
		}

		destroy()
		{
			this.signalIds.forEach(signalId => this.disconnect(signalId));
			super.destroy();
		}
	}) :
	class extends PopupMenu.PopupImageMenuItem
	{
		constructor(devId, opts)
		{
			opts.name = opts.name || _("Unknown");

			super(opts.name, '');

			this.devId = devId;
			this.signalIds = [];
		}

		destroy()
		{
			this.signalIds.forEach(signalId => this.disconnect(signalId));
			super.destroy();
		}
	};

DevicesMenuItem.prototype._onButtonReleaseEvent = function(actor, event)
{
	actor.remove_style_pseudo_class('active');
	this._icon.icon_name = activeDeviceIcon;
	this.emit(usedSignal, event);

	return Clutter.EVENT_STOP;
}

var PopupBase = (GNOME_MINOR_VER >= 31) ?
	GObject.registerClass(
	class extends PopupMenu.PopupBaseMenuItem
	{
		_init()
		{
			super._init({ hover: false, reactive: true });

			if(this.hasOwnProperty('actor'))
				this.actor.add_style_pseudo_class = () => { return null };
			else
				this.add_style_pseudo_class = () => { return null };
		}
	}) :
	class extends PopupMenu.PopupBaseMenuItem
	{
		constructor()
		{
			super({ hover: false, reactive: true });
			this.actor.add_style_pseudo_class = () => { return null };
		}
	}

PopupBase.prototype._onButtonReleaseEvent = function(actor, event)
{
	return Clutter.EVENT_STOP;
}
