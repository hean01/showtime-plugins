
PLUGINS= \
	lubetube.zip \
	redtube.zip \
	fs_to.zip \
	ex_ua.zip \
	megogo.zip \
	uletno.zip \
	uletfilm.zip \
	watch_is.zip \
	porntube.zip \
	docuim.zip \
	baskino.zip \
	di.zip \
	icecast.zip \
	rad.io.zip \
	somafm.zip \
        btvm.zip \
	rua_osk.zip

%.zip:
	@echo "Bundle plugin '$*'"
	@rm -f ./plugins/$*.zip
	@cd $*; zip -r9 ../plugins/$*.zip * -x *.js\~ > /dev/null; cd ..

all: ${PLUGINS}
