#!/bin/bash
set -e

# Function to check the exit status of the last command
check_status() {
    if [ $? -ne 0 ]; then
        echo "Error: $1"
        exit 1
    fi
}

# Function to display usage information
usage() {
    echo "Usage: $0 -n IMAGE_NAME [-p PREFIX1,PREFIX2,...] [-l]"
    echo "  -n, --name IMAGE_NAME    Name of the Docker image (e.g., 'elevenam/frames')"
    echo "  -p, --prefix PREFIXES    Optional comma-separated list of prefixes (e.g., 'dev,staging')"
    echo "                           For each prefix, tags will be PREFIX-{timestamp} and PREFIX"
    echo "  -l, --latest             Also publish images with 'latest' tag"
    exit 1
}

# Set default values
IMAGE_NAME=""
PREFIXES=()
USE_LATEST=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -n|--name)
            IMAGE_NAME="$2"
            shift 2
            ;;
        -p|--prefix)
            # Split the comma-separated list into an array
            IFS=',' read -ra PREFIXES <<< "$2"
            shift 2
            ;;
        -l|--latest)
            USE_LATEST=true
            shift
            ;;
        -h|--help)
            usage
            ;;
        *)
            echo "Unknown option: $1"
            usage
            ;;
    esac
done

# Check if image name was provided
if [ -z "$IMAGE_NAME" ]; then
    echo "Error: Image name is required"
    usage
fi

# If no prefixes were provided, use empty prefix
if [ ${#PREFIXES[@]} -eq 0 ]; then
    PREFIXES=("")
fi

# Get the current date and time in the format YYYY-MM-DD-HH-MM
TIMESTAMP=$(date +"%Y-%m-%d-%H-%M")

# Setup buildx for multi-architecture builds
echo "Setting up Docker BuildX for multi-architecture builds..."
docker buildx create --name multiarch-builder --use 2>/dev/null || true
check_status "Failed to create Docker BuildX builder"

# Base tag for built images (without prefix)
BASE_X86_TAG="$IMAGE_NAME:build-$TIMESTAMP-x86"
BASE_ARM_TAG="$IMAGE_NAME:build-$TIMESTAMP-arm"

# Step 1: Build once for each architecture
echo "Building x86 image..."
docker buildx build --platform linux/amd64 \
    --build-arg IMAGE_NAME="$IMAGE_NAME" \
    --build-arg IMAGE_TAG="build-$TIMESTAMP-x86" \
    -t "$BASE_X86_TAG" \
    --load \
    .
check_status "Failed to build x86 Docker image"

echo "Building ARM image..."
docker buildx build --platform linux/arm64 \
    --build-arg IMAGE_NAME="$IMAGE_NAME" \
    --build-arg IMAGE_TAG="build-$TIMESTAMP-arm" \
    -t "$BASE_ARM_TAG" \
    --load \
    .
check_status "Failed to build ARM Docker image"

echo "Base images built successfully!"

# Step 2: Tag and push for each prefix
for PREFIX in "${PREFIXES[@]}"; do
    echo "Processing prefix: $PREFIX"

    # Define tags for this prefix
    if [ -z "$PREFIX" ]; then
        # No prefix case
        TIMESTAMP_TAG="$TIMESTAMP"
        STABLE_TAG="latest"
    else
        # With prefix
        TIMESTAMP_TAG="$PREFIX-$TIMESTAMP"
        STABLE_TAG="$PREFIX"
    fi

    # Tag images for this prefix
    echo "Tagging x86 image for $PREFIX..."
    docker tag "$BASE_X86_TAG" "$IMAGE_NAME:$TIMESTAMP_TAG-x86"
    docker tag "$BASE_X86_TAG" "$IMAGE_NAME:$STABLE_TAG-x86"
    check_status "Failed to tag x86 image for $PREFIX"

    echo "Tagging ARM image for $PREFIX..."
    docker tag "$BASE_ARM_TAG" "$IMAGE_NAME:$TIMESTAMP_TAG-arm"
    docker tag "$BASE_ARM_TAG" "$IMAGE_NAME:$STABLE_TAG-arm"
    check_status "Failed to tag ARM image for $PREFIX"

    # Push tagged images
    echo "Pushing $PREFIX-tagged images..."
    docker push "$IMAGE_NAME:$TIMESTAMP_TAG-x86"
    docker push "$IMAGE_NAME:$TIMESTAMP_TAG-arm"
    docker push "$IMAGE_NAME:$STABLE_TAG-x86"
    docker push "$IMAGE_NAME:$STABLE_TAG-arm"
    check_status "Failed to push $PREFIX-tagged images"

    # Create multi-architecture manifests
    echo "Creating multi-architecture manifest for timestamp tag: $TIMESTAMP_TAG"
    docker manifest create "$IMAGE_NAME:$TIMESTAMP_TAG" \
        "$IMAGE_NAME:$TIMESTAMP_TAG-x86" \
        "$IMAGE_NAME:$TIMESTAMP_TAG-arm"
    check_status "Failed to create timestamp manifest for $PREFIX"

    docker manifest push "$IMAGE_NAME:$TIMESTAMP_TAG"
    check_status "Failed to push timestamp manifest for $PREFIX"

    echo "Creating multi-architecture manifest for stable tag: $STABLE_TAG"
    docker manifest create "$IMAGE_NAME:$STABLE_TAG" \
        "$IMAGE_NAME:$STABLE_TAG-x86" \
        "$IMAGE_NAME:$STABLE_TAG-arm"
    check_status "Failed to create stable manifest for $PREFIX"

    docker manifest push "$IMAGE_NAME:$STABLE_TAG"
    check_status "Failed to push stable manifest for $PREFIX"
done

# Step 3: Handle the latest tag if requested (only if we have prefixes)
if [ "$USE_LATEST" = true ] && [ ${#PREFIXES[@]} -eq 0 -o "${PREFIXES[0]}" != "" ]; then
    echo "Processing 'latest' tag..."

    # Tag base images with latest
    echo "Tagging images with latest..."
    docker tag "$BASE_X86_TAG" "$IMAGE_NAME:latest-x86"
    docker tag "$BASE_ARM_TAG" "$IMAGE_NAME:latest-arm"
    check_status "Failed to tag images with latest"

    # Push latest-tagged images
    echo "Pushing latest-tagged images..."
    docker push "$IMAGE_NAME:latest-x86"
    docker push "$IMAGE_NAME:latest-arm"
    check_status "Failed to push latest-tagged images"

    # Create multi-architecture manifest for latest tag
    echo "Creating multi-architecture manifest for latest tag"
    docker manifest create "$IMAGE_NAME:latest" \
        "$IMAGE_NAME:latest-x86" \
        "$IMAGE_NAME:latest-arm"
    check_status "Failed to create latest manifest"

    docker manifest push "$IMAGE_NAME:latest"
    check_status "Failed to push latest manifest"
fi

# Clean up temporary build tags
echo "Cleaning up temporary build images..."
docker rmi "$BASE_X86_TAG" "$BASE_ARM_TAG"
check_status "Failed to clean up temporary build images"

echo "Docker images built, tagged, and pushed successfully!"
echo "Summary of tags created:"

# Print summary of created tags
for PREFIX in "${PREFIXES[@]}"; do
    if [ -z "$PREFIX" ]; then
        echo "- $IMAGE_NAME:$TIMESTAMP (multi-arch manifest)"
        echo "  - $IMAGE_NAME:$TIMESTAMP-x86"
        echo "  - $IMAGE_NAME:$TIMESTAMP-arm"
        echo "- $IMAGE_NAME:latest (multi-arch manifest)"
        echo "  - $IMAGE_NAME:latest-x86"
        echo "  - $IMAGE_NAME:latest-arm"
    else
        echo "- $IMAGE_NAME:$PREFIX-$TIMESTAMP (multi-arch manifest)"
        echo "  - $IMAGE_NAME:$PREFIX-$TIMESTAMP-x86"
        echo "  - $IMAGE_NAME:$PREFIX-$TIMESTAMP-arm"
        echo "- $IMAGE_NAME:$PREFIX (multi-arch manifest)"
        echo "  - $IMAGE_NAME:$PREFIX-x86"
        echo "  - $IMAGE_NAME:$PREFIX-arm"
    fi
done

if [ "$USE_LATEST" = true ] && [ ${#PREFIXES[@]} -eq 0 -o "${PREFIXES[0]}" != "" ]; then
    echo "- $IMAGE_NAME:latest (multi-arch manifest)"
    echo "  - $IMAGE_NAME:latest-x86"
    echo "  - $IMAGE_NAME:latest-arm"
fi
