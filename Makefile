ci: clean build deploy

clean:
	rm -rf dist

build:
	npm run build

deploy:
	aws s3 sync dist/ s3://admin.hkfcloud.net/ --delete