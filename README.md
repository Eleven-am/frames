<p align="center">
  <img src="art/frames.png" alt="Frames Logo" width="128" height="128"/>
</p>

<h1 align="center">Frames: Your Modern Streaming Platform</h1>

<p align="center">
  <img src="https://img.shields.io/badge/built%20with-Typescript-informational" alt="Typescript"/>
  <img src="https://img.shields.io/github/license/eleven-am/frames" alt="GitHub"/>
  <img src="https://img.shields.io/docker/pulls/elevenam/frames" alt="Docker Pulls"/>
  <img src="https://img.shields.io/github/stars/eleven-am/frames?style=social" alt="GitHub Repo stars"/>
</p>

**Tired of the limitations and costs of proprietary streaming platforms?** Frames offers a modern, feature-rich solution to organize and stream your personal media collection from virtually anywhere. Built with the latest web technologies, Frames provides a stunning user experience and unparalleled flexibility.

## What is Frames?

Frames is a modern SVOD (Subscription Video on Demand) streaming service built with React and NestJS, evolved from its original version that was built around the Google Drive API. This new version allows you to stream MP4 files from virtually any provider including local storage, S3, Dropbox, Google Drive, and more.

The application enables you to share your media library without compromising the integrity of the original files. It organizes Movies and TV shows, providing you with trailers, HD images, and comprehensive information about your media. This new version includes significant improvements over the original, including expanded subtitle support for all languages and enhanced playlist functionality.

## Why Choose Frames?

* **Truly Universal Media Support:** Stream your MP4 files from **any** cloud storage, including local drives, Amazon S3, Dropbox, Google Drive, and more.
* **Free Forever, Unlike Plex:** Frames offers all features, including remote play and group watch, **without requiring any premium subscription**.
* **Stunning and Intuitive Interface:** Experience your media through our modern, dark-themed UI designed for both aesthetics and functionality.
* **Rich Media Information:** Automatically fetches detailed information about your media using TMDB, Fanart, and Apple's artwork collection.
* **Smart Recommendations:** Using OpenAI embeddings, Frames provides intelligent content suggestions based on similarities.
* **Watch Together with GroupWatch:** Host virtual movie nights with friends with synchronized viewing.
* **Comprehensive Media Organization:** Sophisticated organization of your Movies and TV Shows with extensive metadata.
* **Create and Share Playlists:** Curate and share your favorite content with other users.

## Key Features at a Glance

* ✨ **Stunning UI:** Modern, intuitive, and visually appealing interface
* ☁️ **Universal Media Support:** Stream from any cloud provider
* 💰 **No Paywalls:** All features free to use, unlike Plex
* ℹ️ **Rich Media Information:** Auto-fetched from TMDB, Fanart, and Apple
* 🧠 **Smart Recommendations:** AI-powered with OpenAI embeddings
* 🤝 **GroupWatch:** Synchronized viewing with friends
* 📂 **Media Organization:** Automatic organization with metadata
* ▶️ **Advanced Player:** Feature-rich with support for all subtitle languages
* 📝 **Playlist Creation and Sharing:** Create and share with other users

## Installation

Choose the installation method that best suits your needs:

### Docker (Recommended)

The easiest way to get started with Frames is using Docker. You'll need to mount a directory for your media files and provide the necessary environment variables:

```bash
docker pull elevenam/frames:latest
docker run -p 3000:3000 \
  -v /path/to/your/media:/media \
  -e DATABASE_URL="postgres://username:password@host:5432/frames" \
  -e DIRECT_DATABASE_URL="postgres://username:password@host:5432/frames" \
  -e REDIS_HOST="redis-host" \
  -e REDIS_PORT="6379" \
  -e REDIS_TTL="86400" \
  -e REDIS_DB="0" \
  -e JWT_SECRET="your-secure-jwt-secret" \
  elevenam/frames:latest
```

Replace the values with your actual configuration:
- `/path/to/your/media`: The local path where your media files are stored
- Database credentials: Your PostgreSQL connection details
- Redis configuration: Your Redis server details
- JWT secret: A secure random string for authentication

### Docker Compose (For Multi-Container Setup)

For a more complete setup including PostgreSQL and Redis, you can use Docker Compose:

```yaml
version: '3'

services:
  frames:
    image: elevenam/frames:latest
    ports:
      - "3000:3000"
    volumes:
      - /path/to/your/media:/media
    environment:
      - DATABASE_URL=postgres://frames:frames_password@postgres:5432/frames
      - DIRECT_DATABASE_URL=postgres://frames:frames_password@postgres:5432/frames
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - REDIS_TTL=86400
      - REDIS_DB=0
      - JWT_SECRET=your-secure-jwt-secret
    depends_on:
      - postgres
      - redis

  postgres:
    image: pgvector/pgvector:pg14
    environment:
      - POSTGRES_USER=frames
      - POSTGRES_PASSWORD=frames_password
      - POSTGRES_DB=frames
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data: {}
  redis_data: {}
```

Save this as `docker-compose.yml` and run:

```bash
docker-compose up -d
```

This will start Frames along with PostgreSQL and Redis containers, with data persistence through Docker volumes.

### Environment Variables

Frames requires the following primary environment variables:

- **Database Configuration**:
  - `DATABASE_URL`: PostgreSQL connection string (used for connection pooling)
  - `DIRECT_DATABASE_URL`: Direct PostgreSQL connection string (used for migrations)

- **Redis Configuration**:
  - `REDIS_HOST`: Redis host
  - `REDIS_PORT`: Redis port (default: 6379)
  - `REDIS_TTL`: Redis TTL in seconds (default: 86400)
  - `REDIS_DB`: Redis database number

- **Authentication**:
  - `JWT_SECRET`: Secret key for JWT token generation

- **Optional Environment Variables**:
  - `TMDB_API_KEY`: TMDB API key for fetching media information
  - `FAN_ART_API_KEY`: FanArt API key for fetching media artwork
  - `OPEN_AI_API_KEY`: OpenAI API key for generating embeddings

**Note**
If the optional environment variables are not set, the application will request them during the setup process.
Unfortunately these API Keys are REQUIRED for the application to work properly. If you do not have them, you can create a free account on their respective websites.

## User Interface

### Home Page and Media Discovery

The home page displays trending media with high-quality artwork, synopsis, and direct access to trailers. The clean, dark-themed interface provides an immersive viewing experience.

![Home Page with Featured Content](art/19.png)
![Selected trending Content](art/20.png)
![Suggested Content based on activity and OPENAI Embeddings](art/21.png)
![Gif showing Trailer Feature](art/1.gif)

### Detailed Media Pages

Each movie or TV show has a dedicated page with comprehensive information including:
- Synopsis and basic information (rating, genre, release year, duration)
- Cast and crew with profile images
- Production companies
- Episode listings for TV shows with thumbnails and descriptions
- Similar content recommendations

![Media Details Page](art/7.png)
![Media Details Showing Episodes](art/8.png)
![Media Details Showing Cast, Crew and Production Companies](art/9.png)
![Media Details Showing add Media to playlist dialog](art/31.png)

### Content Filtering and Organization

Browse all movies and TV shows in your library with easy filtering by genre (Action, Adventure, Animation, etc.), making content discovery simple and intuitive.

![Content Browser with Filters activated](art/11.png)
![Content Browser with Filters](art/22.png)

### Playlists

Create, manage, and share playlists with other users:
- Public and private playlist options
- Video count displayed for each playlist
- Playlist sharing with other users
- Shuffle and continuous playback

![Playlist Management](art/15.png)

## Media Organization

For optimal performance and organization:

* **Movies**: It's recommended to place movie files directly in their own folders e.g., `MovieName (2023)/movie.mp4`
* **TV Shows**: Each show should be placed in its own folder, with subfolders for each season:
* **TV Episodes**: You have two options:
  * Place each episode in its corresponding Season folder (Recommended)
  * Place them directly in the Show folder if they follow naming conventions like "S01E01" or "S01 - E01"

    * Example:
        ```
        Movies/
        ├── MovieName (2023)/
        │   └── movie.mp4
        └── MovieName (2022)/
            └── movie.mp4
        TV Shows/
        └── ShowName/
           ├── Season 1/
           │   ├── S01E01 - EpisodeName.mp4
           │   └── S01E02 - EpisodeName.mp4
           └─── Season 2/
               ├── S02E01 - EpisodeName.mp4
               └── S02E02 - EpisodeName.mp4
        ```

## Advanced Features

### Video Player

Frames features a sophisticated video player with:
- AirPlay support (Chromecast support coming soon)
- Playlist management
- Volume controls
- Download capability (for authorized users)
- Subtitle support for all languages (significantly expanded from the previous version)
- Picture-in-picture mode
- Fullscreen mode

![Video Player with Hidden controls](art/23.png)
![Video player with user hovering over progress showing seek thumbnail](art/1.png)
![Video player with left controls](art/2.png)
![Video player with right controls and Upnext hover](art/3.png)
![Video player with Settings open](art/4.png)
![Video player with download dialog open, requesting auth key for download](art/24.png)
![Video player with Share dialog open asking to share from current position or not](art/25.png)

### GroupWatch

This feature allows you to watch media with friends at the same time:
- Create a session and share a link
- No limit to the number of people who can join
- Send messages to other viewers
- Synchronized viewing experience across multiple videos

![GroupWatch Start Session page](art/13.png)
![Video player with GroupWatch chat showing](art/26.png)

### Admin Features

Admin accounts can:
- Modify media information
- Manage authentication keys
- Create personalized categories for the home page
- Control download permissions

![Personalised categories list page](art/28.png)
![Personalised categories edit page](art/29.png)
![Libraries page showcasing  local and drive libraries](art/30.png)
![Media Details Showing Edit dialog with General tab](art/32.png)
![Media Details Showing Edit dialog with Image tab](art/33.png)
![Media Details Showing Edit dialog with Permission tab](art/34.png)

## Transcoding (Alpha Feature)

**⚠️ Alpha Feature Notice:** Transcoding is currently in alpha development and only available for local media files. I'm actively working towards a stable release. This experimental feature automatically converts your media files to different formats and quality levels, optimizing playback across various devices and network conditions for improved streaming performance.

To enable transcoding, use the `transcode` Docker tag and provide the `HLS_CACHE_DIRECTORY` environment variable with a mounted volume for cache storage:

```bash
docker run -p 3000:3000 \
  -v /path/to/your/media:/media \
  -v /path/to/transcoding/cache:/transcoding \
  -e DATABASE_URL="postgres://username:password@host:5432/frames" \
  -e DIRECT_DATABASE_URL="postgres://username:password@host:5432/frames" \
  -e REDIS_HOST="redis-host" \
  -e REDIS_PORT="6379" \
  -e REDIS_TTL="86400" \
  -e REDIS_DB="0" \
  -e JWT_SECRET="your-secure-jwt-secret" \
  -e HLS_CACHE_DIRECTORY="/transcoding" \
  elevenam/frames:transcode
```

**Note:** GroupWatch across multiple servers does not currently work in the transcoding branch.

## Coming Soon

- **Chromecast Support**: Cast your media to Chromecast-enabled devices (currently being redeveloped)
- **Permissions System**: Granular access control to specify which users can access specific media

## For Developers

Frames provides an API for developers who want to extend functionality or integrate with other services:

- API documentation is available at the `/swagger` endpoint on your Frames server
- Contributions to the project are welcome!

### Contributing

We welcome contributions from the community! If you're interested in improving Frames, please:

1. Check out our issues page for current needs
2. Fork the repository
3. Create a feature branch
4. Submit a pull request

## Support

If you encounter any issues or have questions about Frames, please visit our GitHub repository.

---

Built with ❤️ using NestJS and React
