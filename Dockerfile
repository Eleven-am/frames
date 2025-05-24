FROM mwader/static-ffmpeg:7.1 AS ffmpeg

FROM node:22.16-alpine AS finstall

# Install only necessary build dependencies
RUN apk add --no-cache make gcc g++ python3

# Avoid "gyp ERR! stack Error: certificate has expired"
ENV NODE_TLS_REJECT_UNAUTHORIZED=0

WORKDIR /usr/src/app

COPY frontend/package*.json ./

# Use npm ci for faster, reproducible installs
RUN npm ci

FROM finstall AS fbuild

COPY frontend .
RUN npm run build

FROM node:22.16-alpine AS binstall

WORKDIR /usr/src/app

COPY backend/package*.json ./
COPY backend/prisma ./prisma/

RUN npm ci --omit=dev && \
    npx prisma generate && \
    npm prune --production

FROM binstall AS bbuild

COPY backend .
RUN npm run build

FROM node:22.16-alpine AS final

# Pass the arguments through to the image as environment variables
ARG IMAGE_NAME
ARG IMAGE_TIMESTAMP
ARG IMAGE_PREFIXES
ARG IMAGE_ARCH

ENV DOCKER_IMAGE_NAME=$IMAGE_NAME
ENV DOCKER_IMAGE_TIMESTAMP=$IMAGE_TIMESTAMP
ENV DOCKER_IMAGE_PREFIXES=$IMAGE_PREFIXES
ENV DOCKER_IMAGE_ARCH=$IMAGE_ARCH

# Set the environment variable for production
ENV NODE_ENV=production

# Copy FFmpeg 7.1 binaries from static build
COPY --from=ffmpeg /ffmpeg /usr/local/bin/ffmpeg
COPY --from=ffmpeg /ffprobe /usr/local/bin/ffprobe

# Install only bash (FFmpeg now copied from above)
RUN apk add --no-cache bash

RUN addgroup --system --gid 1001 nestgroup && \
    adduser --system --uid 1001 nestuser --ingroup nestgroup

WORKDIR /usr/src/app

# Copy only necessary files from previous stages
COPY --from=bbuild /usr/src/app/dist ./dist
COPY --from=bbuild /usr/src/app/views ./views
COPY --from=binstall /usr/src/app/node_modules ./node_modules
COPY --from=fbuild /usr/src/app/dist/assets ./public/assets
COPY --from=fbuild /usr/src/app/dist/favicons ./public/favicons

COPY backend/prisma ./prisma
COPY backend/start.sh backend/wait-for-it.sh ./
RUN chmod +x start.sh wait-for-it.sh

# Combine RUN commands to reduce layers
RUN cd public && \
    REACT_MAIN_JS=$(ls assets/*.js | head -n 1) && \
    echo "REACT_MAIN_JS=/$REACT_MAIN_JS" >> ../.env && \
    REACT_MAIN_CSS=$(ls assets/*.css | head -n 1) && \
    echo "REACT_MAIN_CSS=/$REACT_MAIN_CSS" >> ../.env && \
    chown -R nestuser:nestgroup /usr/src/app

USER nestuser
EXPOSE 3000

CMD ["./start.sh"]
