# Makefile made by Muisnow

BUILD_FOLDER = build
SOURCE_FOLDER = src
RELEASE_FOLDER = release

BUILD_VERSION = 1.0.1

FILE = manifest.json main.js content.js popup.html popupScript.js version

$(shell mkdir -p $(BUILD_FOLDER))
$(shell mkdir -p $(RELEASE_FOLDER))

all: $(FILE)

manifest.json:
	cp $(SOURCE_FOLDER)/manifest.json $(BUILD_FOLDER)/manifest.json

main.js:
	browserify $(SOURCE_FOLDER)/main.js -o $(BUILD_FOLDER)/background-bundle.js

content.js:
	browserify $(SOURCE_FOLDER)/content.js -o $(BUILD_FOLDER)/content-bundle.js

popup.html:
	cp $(SOURCE_FOLDER)/popup.html $(BUILD_FOLDER)

popupScript.js:
	cp $(SOURCE_FOLDER)/popupScript.js $(BUILD_FOLDER)/popupScript.js

version:
	echo $(BUILD_VERSION) > $(BUILD_FOLDER)/version

makezip:
	make
	mkdir -p $(RELEASE_FOLDER)/$(BUILD_VERSION)
	cp -r $(BUILD_FOLDER)/*.* $(RELEASE_FOLDER)/$(BUILD_VERSION)
	zip -r $(BUILD_VERSION).zip $(RELEASE_FOLDER)

clean:
	make cleanbuild
	make cleanrelease

cleanbuild:
	rm -rf $(BUILD_FOLDER)

cleanrelease:
	rm -rf $(RELEASE_FOLDER)