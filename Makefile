
PLUGINS= \
	xxxstream.zip \
	di.zip \
	icecast.zip

%.zip:
	@echo "Bundle plugin '$*'"
	@cd $*; zip -r9 ../plugins/$*.zip * > /dev/null; cd ..

all: ${PLUGINS}