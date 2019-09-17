# Basic Makefile

UUID = tv-remote@rafostar.github.com
GETTEXT = tv-remote
PACKAGE = "TV Remote"
TOLOCALIZE = remote.js devices.js prefs.js
MSGSRC = $(wildcard ./po/*.po)
POTFILE = ./po/tv-remote.pot
ZIPFILES = *.js *.json schemas locale COPYING README.md
INSTALLPATH = ~/.local/share/gnome-shell/extensions

# Compile schemas #
glib-schemas:
	glib-compile-schemas ./schemas/

# Create/update potfile #
potfile:
	mkdir -p ./po
	xgettext -o $(POTFILE) --language=JavaScript --add-comments=TRANSLATORS: --package-name $(PACKAGE) $(TOLOCALIZE)

# Update '.po' from 'potfile' #
mergepo:
	for i in $(MSGSRC); do \
		msgmerge -U $$i $(POTFILE); \
	done;

# Compile .mo files #
compilemo:
	for i in $(MSGSRC); do \
		mkdir -p ./locale/`basename $$i .po`/LC_MESSAGES; \
		msgfmt -c -o ./locale/`basename $$i .po`/LC_MESSAGES/$(GETTEXT).mo $$i; \
	done;

# Create release zip #
zip-file: _build
	zip -qr $(UUID).zip $(ZIPFILES)

# Build and install #
install:
	ifeq ($(CUSTOMPATH),)
		_local-install
	else
		_global-install
	endif

_local-install: _build
	mkdir -p $(INSTALLPATH)/$(UUID)
	cp -r $(ZIPFILES) $(INSTALLPATH)/$(UUID)

_global-install: compilemo
	mkdir -p $(CUSTOMPATH)/$(UUID)
	cp -r $(filter-out schemas locale, $(ZIPFILES)) $(CUSTOMPATH)/$(UUID)
	mkdir -p /usr/share/glib-2.0/schemas
	cp -r ./schemas/*.gschema.* /usr/share/glib-2.0/schemas/
	mkdir -p /usr/share/locale
	cp -r ./locale/* /usr/share/locale/

_build: glib-schemas compilemo

