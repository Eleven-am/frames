![Typescript](https://img.shields.io/badge/built%20with-Typescript-informational)
![GitHub](https://img.shields.io/github/license/eleven-am/frames)
![GitHub Repo stars](https://img.shields.io/github/stars/eleven-am/frames?style=social)
![Twitter Follow](https://img.shields.io/twitter/follow/maixperiyon?style=social)

![Logo](https://frameshomebase.maix.ovh/favicons/android-chrome-192x192.png)

# Frames

Frames is a VOD streaming service built with react and NextJs around the Google Drive API.

### What is frames and how does it work ?
Frames is a web application that allows you to store, organise, download and stream media contents available on your Google Drive.
The application enables you share this library without compromising the integrity of the original files.
It organises the Movies and TV shows on your drive account, providing you with their trailer, HD images and other info

## Installation
The process to installing frames is straight forward to begin, visit https://frameshomebase.maix.ovh and follow the setup process.
A 'frames.env' file would be downloaded once the setup process is complete.
    
## Run Locally

Clone the project

```bash
  git clone https://github.com/Eleven-am/frames.git
```

Go to the project directory

```bash
  cd frames
```

Place frames.env in the directory then rename it to .env

```bash
  mv frames.env frames/.env
```

Install dependencies and set up database

```bash
  npm install && npx prisma db push
```

Build the server

```bash
  npm run build
```

Start the server

```bash
  npm run start
```

#### How to arrange the files
* For movies, it is imperative that only the movie file itself is placed directly in the movie folder like so ![](art/22.png)
* For TV shows every Show should be placed in its folder like so ![](art/24.png)
* When arranging the episodes you have two options
    * Place each episode in its corresponding Season folder, like so (Recommended) ![](art/25.png) ![](art/26.png)
    * Alternatively you can place them directly in the Show folder but only if they can pass this s|SXX .. eE|XX naming scheme, for example;
        * S01 - E01
        * S01 randomText E01
        * s01e01 | S01E01
          like so ![](art/23.png)

