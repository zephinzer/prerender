define HELP_OUTPUT

Prerender Image
---------------

Make recipes:
- quickstart
- quickpublish
- prereq
- dep
- build_image
- start_container
- publish_image

Run `cat Makefile` to output the Makefile

endef
export HELP_OUTPUT
help:
	@printf -- "$${HELP_OUTPUT}"
DOCKER_REGISTRY=docker.io
DOCKER_NAMESPACE=zephinzer
DOCKER_IMAGE=prerender
DOCKER_TAG=latest

# override the above variables by creating a file named
# Makefile.properties and redeclaring the above variables
-include Makefile.properties

DOCKER_REPO_URL=$(DOCKER_REGISTRY)/$(DOCKER_NAMESPACE)/$(DOCKER_IMAGE):$(DOCKER_TAG)

# for running only in fresh clone conditions
# - unless you don't mind waiting
quickstart:
	@$(MAKE) prereq
	@$(MAKE) dep
	@$(MAKE) build_image
	@$(MAKE) start_container

# for publishing the image stored herein
quickpublish:
	@$(MAKE) prereq
	@$(MAKE) build_image
	@$(MAKE) publish_image

##########################
# actual commands follow #
##########################

prereq:
	#
	# checking for system requirements
	#
	@which node && ls -al $$(which node)
	@which npm && ls -al $$(which npm)
	@which docker && ls -al $$(which docker)

dep:
	#
	# installing node dependeices
	#
	@npm install

build_image:
	#
	# build the docker image
	#
	@docker build \
		--tag $(DOCKER_REPO_URL) \
		.

start_container:
	#
	# start the container
	#
	@docker run -it \
		--volume $$(pwd):/app \
		--volume $$(pwd)/node_modules:/app/node_modules \
		--publish 3000:3000 \
		$(DOCKER_REPO_URL);

publish_image: build_image
	@docker push $(DOCKER_REPO_URL)
