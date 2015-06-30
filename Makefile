init:
	@echo 'install dependencies'
	npm install
	@echo 'create git pre-commit hook'
	ln -fs ../../lint.sh .git/hooks/pre-commit	
	@echo 'adjust pre-commit hook file permission'
	chmod +x .git/hooks/pre-commit
	@echo 'done'

.PHONY: lint
lint:
	sh lint.sh

.PHONY: test
test:
	./node_modules/mocha/bin/mocha test/index.js -s 10 -R spec -b --timeout 10000
