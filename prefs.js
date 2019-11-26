imports.gi.versions.Gtk = '3.0';

const { Gio, Gtk } = imports.gi;
const Local = imports.misc.extensionUtils.getCurrentExtension();
const Convenience = Local.imports.convenience;
const Settings = Convenience.getSettings();
const Gettext = imports.gettext.domain(Local.metadata['gettext-domain']);
const _ = Gettext.gettext;

function init()
{
	Convenience.initTranslations();
}

var SettingLabel = class
{
	constructor(text, isTitle, isTopMargin)
	{
		let label = null;
		let marginLeft = 0;
		let marginTop = 0;

		if(isTitle) label = '<span font="12.5"><b>' + text + '</b></span>';
		else
		{
			label = text;
			marginLeft = 12;
		}

		if(isTopMargin) marginTop = 20;

		return new Gtk.Label({
			label: label,
			use_markup: true,
			hexpand: true,
			halign: Gtk.Align.START,
			margin_top: marginTop,
			margin_left: marginLeft
		});
	}
}

class TvRemoteSettings extends Gtk.VBox
{
	constructor()
	{
		super();
		let label = null;
		let widget = null;
		let box = null;

		let grid = new Gtk.Grid({ margin: 20, row_spacing: 6 });
		this.pack_start(grid, false, false, 0);

		/* Label: CEC-Web-API Options */
		label = new SettingLabel('CEC-Web-API', true);
		grid.attach(label, 0, 0, 1, 1);

		/* CEC-Web-API Device IP */
		label = new SettingLabel(_("Device IP"));
		widget = new Gtk.Entry({halign:Gtk.Align.END});
		widget.set_placeholder_text('127.0.0.1');
		Settings.bind('cec-web-api-ip', widget, 'text', Gio.SettingsBindFlags.DEFAULT);
		grid.attach(label, 0, 1, 1, 1);
		grid.attach(widget, 1, 1, 1, 1);

		/* CEC-Web-API Port */
		label = new SettingLabel(_("Listening port"));
		widget = new Gtk.SpinButton({halign:Gtk.Align.END});
		widget.set_sensitive(true);
		widget.set_range(1, 65535);
		widget.set_value(Settings.get_int('cec-web-api-port'));
		widget.set_increments(1, 2);
		Settings.bind('cec-web-api-port', widget, 'value', Gio.SettingsBindFlags.DEFAULT);
		grid.attach(label, 0, 2, 1, 1);
		grid.attach(widget, 1, 2, 1, 1);

		/* Label: TV Remote Options */
		label = new SettingLabel(_("TV Remote"), true);
		grid.attach(label, 0, 3, 1, 1);

		/* Remote Position */
		label = new SettingLabel(_("Remote position"));
		widget = new Gtk.ComboBoxText({halign:Gtk.Align.END});
		widget.append('left', _("Left"));
		widget.append('center-left', _("Center (left side)"));
		widget.append('center-right', _("Center (right side)"));
		widget.append('right', _("Right"));
		Settings.bind('tv-remote-position', widget, 'active-id', Gio.SettingsBindFlags.DEFAULT);
		grid.attach(label, 0, 4, 1, 1);
		grid.attach(widget, 1, 4, 1, 1);

		/* Remote Label */
		label = new SettingLabel(_("Show remote label"));
		widget = new Gtk.Switch({halign:Gtk.Align.END});
		widget.set_sensitive(true);
		widget.set_active(Settings.get_boolean('show-remote-label'));
		Settings.bind('show-remote-label', widget, 'active', Gio.SettingsBindFlags.DEFAULT);
		grid.attach(label, 0, 5, 1, 1);
		grid.attach(widget, 1, 5, 1, 1);

		/* CEC-Web-API link */
		this.extLinkButton = new Gtk.LinkButton({
			uri: 'http://github.com/Rafostar/cec-web-api',
			label: _("CEC-Web-API GitHub page"),
			expand: false,
			halign:Gtk.Align.CENTER
		});

		let ceclinkButton = new Gtk.LinkButton({
			uri: Local.metadata.url,
			label: _("Extension Homepage"),
			expand: false,
			halign:Gtk.Align.CENTER
		});

		box = new Gtk.VBox({
			margin: 5,
			hexpand: true,
			valign:Gtk.Align.END,
			halign:Gtk.Align.CENTER
		});

		box.pack_start(ceclinkButton, false, false, 0);
		box.pack_start(this.extLinkButton, false, false, 0);
		this.pack_end(box, false, false, 0);
	}
}

function buildPrefsWidget()
{
	let widget = new TvRemoteSettings();
	widget.show_all();
	widget.extLinkButton.grab_focus();

	return widget;
}
