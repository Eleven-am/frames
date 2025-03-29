#!/bin/bash

# Function to check the exit status of the last command
check_status() {
    if [ $? -ne 0 ]; then
        echo "Error: $1"
        exit 1
    fi
}

# Get the current date and time in the format YYYY-MM-DD-HH-MM
DATE_TAG=$(date +"%Y-%m-%d-%H-%M")

# Build the Docker image with the current date-time tag
echo "Building Docker image..."
docker buildx build --platform linux/amd64 \
      --build-arg IMAGE_NAME=elevenam/frames \
      --build-arg IMAGE_TAG="$DATE_TAG" \
      -t elevenam/frames:"$DATE_TAG" .

check_status "Failed to build Docker image"

# Tag the newly built image as 'latest'
echo "Tagging image as latest..."
docker tag elevenam/frames:"$DATE_TAG" elevenam/frames:latest
check_status "Failed to tag Docker image"

# Push the date-tagged image
echo "Pushing date-tagged image..."
docker push elevenam/frames:"$DATE_TAG"
check_status "Failed to push date-tagged image"

# Push the 'latest' image
echo "Pushing latest image..."
docker push elevenam/frames:latest
check_status "Failed to push latest image"

echo "Docker image built and pushed successfully with tags: $DATE_TAG and latest"
