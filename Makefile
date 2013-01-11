
PLUGINS= \
	xxxstream.zip \
	di.zip \
	icecast.zip \
	somafm.zip \
	rad.io.zip \
	lubetube.zip \
	redtube.zip \
	fs_ua.zip \
	ex_ua.zip

%.zip:
	@echo "Bundle plugin '$*'"
	@rm -f ./plugins/$*.zip
	@cd $*; zip -r9 ../plugins/$*.zip * -x *.js\~ > /dev/null; cd ..

all: ${PLUGINS}
