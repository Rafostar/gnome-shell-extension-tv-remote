# Basic Makefile

EXTNAME = gnome-shell-extension-tv-remote
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
install: compilemo
ifeq ($(CUSTOMPATH),)
	glib-compile-schemas ./schemas/
	mkdir -p $(INSTALLPATH)/$(UUID)
	cp -r $(ZIPFILES) $(INSTALLPATH)/$(UUID)
else
	mkdir -p $(CUSTOMPATH)/$(UUID)
	cp -r $(filter-out schemas locale README.md COPYING, $(ZIPFILES)) $(CUSTOMPATH)/$(UUID)
	mkdir -p /usr/share/glib-2.0/schemas
	cp -r ./schemas/*.gschema.* /usr/share/glib-2.0/schemas/
	mkdir -p /usr/share/locale
	cp -r ./locale/* /usr/share/locale/
	mkdir -p /usr/share/doc/$(EXTNAME)
	cp ./README.md /usr/share/doc/$(EXTNAME)/
	mkdir -p /usr/share/licenses/$(EXTNAME)
	cp ./COPYING /usr/share/licenses/$(EXTNAME)/
endif

_build: glib-schemas compilemo

