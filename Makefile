
build: templates components index.js
	@component build --dev

templates:
	@component convert field.html
	@component convert fieldrender.html
	@component convert form.html
	@component convert list.html

components: component.json
	@component install --dev

clean:
	rm -fr build components field.js form.js fieldrender.js

.PHONY: clean
