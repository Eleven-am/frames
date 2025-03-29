FROM node:lts-alpine as install

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json and prisma folder
COPY package*.json ./
COPY prisma ./prisma/

# Install app dependencies
RUN npm install

# Generate prisma client
RUN prisma generate

FROM install as build

# Copy the rest of the app
COPY . .

# Build the app
RUN npm run build

FROM node:lts-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy the build files
COPY --from=build /usr/src/app/dist ./dist
COPY --from=install /usr/src/app/node_modules ./node_modules

# Create a new user to run the app
RUN addgroup --system --gid 1001 nestgroup
RUN adduser --system --uid 1001 nestuser --ingroup nestgroup

# Grant permissions to the nestuser to access the files
RUN chown -R nestuser:nestgroup /usr/src/app

USER nestuser
EXPOSE 3000

ENV NODE_ENV=production

CMD ["dist/main.js"]


