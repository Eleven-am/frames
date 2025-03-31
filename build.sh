#!/bin/bash

# Function to check the exit status of the last command
check_status() {
    if [ $? -ne 0 ]; then
        echo "Error: $1"
        exit 1
    fi
}

# Function to display usage information
usage() {
    echo "Usage: $0 -n IMAGE_NAME [-p PREFIX]"
    echo "  -n IMAGE_NAME   Name of the Docker image (e.g., 'elevenam/frames')"
    echo "  -p PREFIX       Optional prefix for the image tag (e.g., 'dev', 'staging')"
    echo "                  If provided, tags will be PREFIX-{timestamp} and PREFIX"
    echo "                  If not provided, tags will be {timestamp} and latest"
    exit 1
}

# Set default values
IMAGE_NAME=""
PREFIX=""

# Parse command line arguments
while getopts ":n:p:" opt; do
    case $opt in
        n) IMAGE_NAME="$OPTARG" ;;
        p) PREFIX="$OPTARG" ;;
        \?) echo "Invalid option: -$OPTARG"; usage ;;
        :) echo "Option -$OPTARG requires an argument."; usage ;;
    esac
done

# Check if image name was provided
if [ -z "$IMAGE_NAME" ]; then
    echo "Error: Image name is required"
    usage
fi

# Get the current date and time in the format YYYY-MM-DD-HH-MM
TIMESTAMP=$(date +"%Y-%m-%d-%H-%M")

# Determine the tag formats based on prefix
if [ -z "$PREFIX" ]; then
    # No prefix - use timestamp as tag and "latest" as the stable tag
    TIMESTAMP_TAG="$TIMESTAMP"
    STABLE_TAG="latest"
    echo "Using timestamp tag: $TIMESTAMP_TAG and stable tag: $STABLE_TAG"
else
    # With prefix - use prefix-timestamp as tag and just prefix as the stable tag
    TIMESTAMP_TAG="$PREFIX-$TIMESTAMP"
    STABLE_TAG="$PREFIX"
    echo "Using prefixed timestamp tag: $TIMESTAMP_TAG and stable tag: $STABLE_TAG"
fi

# Build the Docker image with the timestamp tag
echo "Building Docker image..."
docker buildx build --platform linux/amd64 \
      --build-arg IMAGE_NAME="$IMAGE_NAME" \
      --build-arg IMAGE_TAG="$TIMESTAMP_TAG" \
      -t "$IMAGE_NAME":"$TIMESTAMP_TAG" .

check_status "Failed to build Docker image"

# Tag the newly built image with the stable tag (latest or prefix)
echo "Tagging image as $STABLE_TAG..."
docker tag "$IMAGE_NAME":"$TIMESTAMP_TAG" "$IMAGE_NAME":"$STABLE_TAG"
check_status "Failed to tag Docker image"

# Push the timestamp-tagged image
echo "Pushing timestamp-tagged image..."
docker push "$IMAGE_NAME":"$TIMESTAMP_TAG"
check_status "Failed to push timestamp-tagged image"

# Push the stable-tagged image (latest or prefix)
echo "Pushing $STABLE_TAG image..."
docker push "$IMAGE_NAME":"$STABLE_TAG"
check_status "Failed to push $STABLE_TAG image"

echo "Docker image built and pushed successfully with tags: $TIMESTAMP_TAG and $STABLE_TAG"
