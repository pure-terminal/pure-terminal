CURL=curl
GREP=grep
RM=rm

README_TMP=readme.html
USER=pure-terminal
REPO=pure-terminal

.PHONY: purge

purge:
	$(CURL) -s https://github.com/$(USER)/$(REPO)/blob/master/README.md > $(README_TMP)
	$(GREP) -Eo '<img src=\\"[^"]+\\"' $(README_TMP) | $(GREP) camo | $(GREP) -Eo 'https[^"\\]+' | xargs -I {} $(CURL) -w "\n" -s -X PURGE {}
	$(RM) $(README_TMP)
