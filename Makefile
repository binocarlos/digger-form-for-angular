
build: templates components index.js
	@component build --dev

templates:
	@component convert field.html
	@component convert form.html

components: component.json
	@component install --dev

clean:
	rm -fr build components field.js form.js

.PHONY: clean
