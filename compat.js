const { Clutter, GObject } = imports.gi;
const PopupMenu = imports.ui.popupMenu;
const Config = imports.misc.config;
const Local = imports.misc.extensionUtils.getCurrentExtension();
const Gettext = imports.gettext.domain(Local.metadata['gettext-domain']);
const _ = Gettext.gettext;

const IS_OLD_SHELL = (Config.PACKAGE_VERSION.split('.')[1] < 33);

var usedSignal = (IS_OLD_SHELL) ? 'button-release-event' : 'device-changed';
var activeDeviceIcon = 'input-dialpad-symbolic';

var TvDevicesMenuItem = (IS_OLD_SHELL) ?
	class TvDevicesMenuItem extends PopupMenu.PopupImageMenuItem
	{
		constructor(devId, opts)
		{
			/* TRANSLATORS: Undetected device name */
			opts.name = opts.name || _("Unknown");

			super(opts.name, '');

			this.devId = devId;
			this.signalIds = [];

			this.destroy = () =>
			{
				this.signalIds.forEach(signalId => this.disconnect(signalId));
				super.destroy();
			}
		}
	} :
	GObject.registerClass({
		Signals: { [usedSignal]: { param_types: [Clutter.Event.$gtype] }
		}
	},
	class TvDevicesMenuItem extends PopupMenu.PopupImageMenuItem
	{
		_init(devId, opts)
		{
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
	});

TvDevicesMenuItem.prototype._onButtonReleaseEvent = function(actor, event)
{
	actor.remove_style_pseudo_class('active');
	this._icon.icon_name = activeDeviceIcon;
	this.emit(usedSignal, event);

	return Clutter.EVENT_STOP;
}

var TvPopupBase = (IS_OLD_SHELL) ?
	class TvPopupBase extends PopupMenu.PopupBaseMenuItem
	{
		constructor()
		{
			super({ hover: false });
			this.actor.add_style_pseudo_class = () => { return null };
		}
	} :
	GObject.registerClass(
	class TvPopupBase extends PopupMenu.PopupBaseMenuItem
	{
		_init()
		{
			super._init({ hover: false });

			if(this.hasOwnProperty('actor'))
				this.actor.add_style_pseudo_class = () => { return null };
			else
				this.add_style_pseudo_class = () => { return null };
		}
	});

TvPopupBase.prototype._onButtonReleaseEvent = function(actor, event)
{
	return Clutter.EVENT_STOP;
}
