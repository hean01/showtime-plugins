
PLUGINS= \
	xxxstream.zip

%.zip:
	@echo "Bundle plugin '$*'"
	@cd $*; zip -9 ../plugins/$*.zip * > /dev/null; cd ..

all: ${PLUGINS}