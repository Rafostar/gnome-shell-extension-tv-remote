const { St, Clutter, Soup } = imports.gi;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Local = imports.misc.extensionUtils.getCurrentExtension();
const Gettext = imports.gettext.domain(Local.metadata['gettext-domain']);
const _ = Gettext.gettext;
const Layout = Local.imports.layout;
const { DevicesSubMenu } = Local.imports.devices;
const { PopupBase } = Local.imports.compat;
const noop = () => {};

const REMOTE_LABEL = _("TV Remote");

var webConfig =
{
	ip: '127.0.0.1',
	port: 8080
}

var TvRemoteMenu = class extends PanelMenu.Button
{
	constructor()
	{
		super(0.5, REMOTE_LABEL, false);

		this.box = new St.BoxLayout();
		this.icon = new St.Icon({
			icon_name: 'input-dialpad-symbolic',
			style_class: 'system-status-icon'
		});
		this.toplabel = new St.Label({
			text: _(REMOTE_LABEL),
			y_expand: true,
			y_align: Clutter.ActorAlign.CENTER
		});
		this._soupSession = new Soup.SessionAsync();
		this.remoteButtons = [];

		/* Display app icon, label and dropdown arrow */
		this.box.add(this.icon);
		this.box.add(this.toplabel);
		this.box.add(PopupMenu.arrowIcon(St.Side.BOTTOM));

		if(this.hasOwnProperty('actor'))
			this.actor.add_child(this.box);
		else
			this.add_child(this.box);

		this.apiRequest = (query, cb) =>
		{
			cb = cb || noop;

			/* Cancel pending message */
			this._soupSession.abort();

			let ip = webConfig.ip || '127.0.0.1';
			let port = webConfig.port || 8080;

			query = (typeof query !== 'string' || !this.devicesMenu) ? ''
				: (query === 'changeSource') ? 'dev0/' + query
				: this.devicesMenu.activeDevId + '/' + query;

			let message = Soup.Message.new('GET',
				'http://' + ip + ':' + port + '/' + query
			);

			this._soupSession.queue_message(message, () =>
			{
				let respObj = {};

				if(
					typeof message === 'object'
					&& message.response_body
					&& typeof message.response_body === 'object'
					&& message.response_body.data
				) {
					try { respObj = JSON.parse(message.response_body.data); }
					catch(err) {}
				}

				return cb(respObj);
			});
		}

		/* Assemble remote controls */
		Layout.remoteLayout.forEach(row =>
		{
			let popupBase = new PopupBase();
			let buttonsBox = new St.BoxLayout({
				x_align: Clutter.ActorAlign.CENTER,
				x_expand: true
			});

			row.forEach(item =>
			{
				let button = new RemoteButton(item);

				let query = (item.action) ? 'sendKey?value=' + item.action :
					(item.query) ? item.query : null;

				if(query)
				{
					button.signalIds.push(
						button.connect('clicked', this.apiRequest.bind(this, query, null))
					);
				}

				this.remoteButtons.push(button);
				buttonsBox.add(button);
			});

			if(popupBase.hasOwnProperty('actor'))
				popupBase.actor.add(buttonsBox);
			else
				popupBase.add(buttonsBox);

			this.menu.addMenuItem(popupBase);
		});

		this.devicesMenu = new DevicesSubMenu();
		this.menu.addMenuItem(this.devicesMenu);

		this.getDevices = () =>
		{
			this.apiRequest(null, (respObj) =>
			{
				this.devicesMenu.updateList(respObj);
			});
		}

		this.openSignal = this.devicesMenu.menu.connect('open-state-changed', (source, isOpen) =>
		{
			if(isOpen) this.getDevices();
		});

		this.destroy = () =>
		{
			this.devicesMenu.menu.disconnect(this.openSignal);
			this.remoteButtons.forEach(remoteButton => remoteButton.destroy());

			super.destroy();
		}
	}
}

class RemoteButton extends St.Button
{
	constructor(opts)
	{
		let color = (opts.color) ? 'color: ' + opts.color + '; ' : '';
		opts.size = opts.size || 26;
		opts.margin_lr = opts.margin_lr || 0;
		opts.margin_top = opts.margin_top || 0;
		opts.margin_bottom = opts.margin_bottom || 0;

		let buttonChild = (opts.icon) ?
			new St.Icon({
				style_class: 'popup-menu-icon',
				style: 'margin-top: ' + opts.margin_top + 'px; ' +
					'margin-bottom: ' + opts.margin_bottom + 'px; ' +
					'margin-left: ' + opts.margin_lr + 'px; ' +
					'margin-right: ' + opts.margin_lr + 'px;',
				icon_size: opts.size,
				icon_name: opts.icon
			}) : (opts.text) ?
			new St.Label({
				style: 'font-family: Sans-serif; ' +
					'font-weight: bold; ' +
					'font-size: 22px; ' +
					'margin-top: ' + opts.margin_top + 'px; ' +
					'margin-bottom: ' + opts.margin_bottom + 'px; ' +
					'margin-left: ' + opts.margin_lr + 12 + 'px; ' +
					'margin-right: ' + opts.margin_lr + 12 + 'px;',
				text: opts.text
			}) :
			new St.Label({
				style: 'margin-top: ' + opts.margin_top + 'px; ' +
					'margin-bottom: ' + opts.margin_bottom + 'px; ' +
					'margin-left: ' + opts.margin_lr + 'px; ' +
					'margin-right: ' + opts.margin_lr + 'px;'
			});

		super({
			style: color + 'margin-left: 6px; margin-right: 6px;',
			opacity: 130,
			child: buttonChild
		});

		let callback = () => this.opacity = (this.hover) ? 255 : 130;

		this.signalIds = [
			this.connect('notify::hover', callback),
			this.connect('destroy', () => {
				this.signalIds.forEach(signalId => this.disconnect(signalId));
			})
		];
	}
}
