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
Clone the repository 

```bash
  git clone https://github.com/Eleven-am/frames.git
```
Install the dependencies

 ```bash
  npm install
 ```
Go to the project directory 

```bash
  cd frames
```

Open the framesConfig.ts file and configure the parameters
To do this you need to open the file in your favorite text editor,
have a Supabase project, a TMDB API key, FANART API key and a Google Drive API credentials and token.

 ```bash
  vim framesConfig.ts
 ```

Once you have configured the file, you can generate an environment file with the following command:

 ```bash
  npm run generate-env
 ```

Once you have done this, you can build the application with the following command:

```bash
  npm run setup
```

The application will be available on http://localhost:3000/

## How to arrange the files
* For movies, it is recommended that only the movie file itself is placed directly in the movie folder like so ![](art/22.png) but folders containing the movie file can be placed in the movie folder.
* For TV shows every Show should be placed in its folder like so ![](art/24.png)
* When arranging the episodes you have two options
    * Place each episode in its corresponding Season folder, like so (Recommended) ![](art/25.png) ![](art/26.png)
    * Alternatively you can place them directly in the Show folder but only if they can pass this s|SXX .. eE|XX naming scheme, for example;
        * S01 - E01
        * S01 randomText E01
        * s01e01 | S01E01
          like so ![](art/23.png)

## Images and Features
### Disclaimer: The Social OAUTH feature requires a connection to a Phoenix-Elixir server. I intend to make my private server available to the public in the future.
* The boarding page includes social authentication methods as well as email. Every user registered must be provided an auth key 
    ![](art/1.png)
    ![](art/2.png)
    ![](art/3.png)
    ![](art/4.png)

* The home page includes (ideally 7, may be less or 0) trending media that are available in your library. A synopsis of the media and trailer are also available directly from here
   ![](art/trailer.gif)
   ![](art/5.png)

#### The navigation bar
* All the movies and tv shows available in the library are show in descending order from most recent or trending to less recent. The media can be filtered by genre or decade. just by interacting with the page.
  ![](art/6.png)
  ![](art/7.png)

* Frames has the collection page that shows you default collection for media in your library
  ![](art/41.png)
  ![](art/42.png)

* Here's how a media's metadata is displayed on frames
  ![](art/12.png)
  ![](art/13.png)
  ![](art/10.png)
  ![](art/11.png)

* Media produced by a specific company can be seen by simply clicking on the company's name in the details pane
  ![](art/14.png)
    * Clicking on the company's logo begins playback of all the media produced by the company in the order they were made available by said company

* Media a specific actor or director took part in creating are easily viewable by clicking on their name
  ![](art/28.png)
    * Clicking on the person's name begins playback of all the media they have taken part in.

#### Frames(aka the video player)
* Frames supports only mp4 files. These files are streamed securely to the user and your Google credentials are never made available to the client.
  ![](art/player.gif)
  ![](art/48.png)
    * The left controls include, in that order, the AirPlay/Cast button (if available), the share button, the playlist button, the volume controls and download button
    * If logged in as a guest user, the download button and the Share button are not available
      ![](art/15.png)
      ![](art/18.png)
      ![](art/17.png)
  
    * The right side controls include the player settings button(in development), the groupwatch button, the picture in picture button, the subtitle button, the up next button and the fullscreen button
  ![](art/32.png)
      * Clicking on the up next button plays the next video as expected. 

    * Frames supports only three subtitle languages at this point (English, French, and German)      
      ![](art/33.png)

* GroupWatch: This feature allows you to watch a media with your friends at the same time.
  ![](art/46.png) 
  ### Disclaimer: The groupwatch feature requires a connection to a Phoenix-Elixir server. I intend to make my private server available to the public in the future.
    ###### How it works
    * To create a new session click on one of these buttons 
    ![](art/36.png)
        The join button in the video player
    ![](art/40.png)
        The join button in the info page
    * When a session is created a link is copied to your clipboard anyone with access to this link can join the session
    ![](art/37.png)
    * A session spans multiple videos. As long as all parties remain connected, the session allows you to actually binge-watch videos together.
    * There's no limit to the amount of people that can join a session
    ![](art/38.png)
    * Users in a session can send a ping to themselves with a maximum of 280 characters. Ping history isn't saved
    ![](art/39.png)

* Frames has AirPlay and Chromecast functionality built in
  ![](art/16.png)
  ![](art/19.png)
    * Obviously frames controls the remote player based on local interactions
    
#### Miscellaneous 
* By clicking on the edit button inside a media page you can modify the information of the media. The images, TMDB ID
  ![](art/20.png)
  ![](art/27.png)

* The up next UI when the present video is done playing
  ![](art/21.png)

* Frames allows any non-guest user download video files provided they are given a key from the admin(These links are only valid for 2 hours)
     ![](art/43.png)
     ![](art/44.png)

* You can add three personalised categories to the home page.
    * These categories include a list of previously chosen media and a name to display said media
      ![](art/30.png)
    * Two of these categories appear like this
      ![](art/34.png)
    * And the last one appears like this
      ![](art/35.png)
  
    * Adding these editor picks is as easy as visiting the settings page => Mange => manage picks.Here you can modify or create new editor picks to display on the homepage
      ![](art/31.png)
      ![](art/29.png)
  
    * You can also delete editor picks by clicking on the delete button
    * The home page has infinite scrolling, it will load more content as you scroll down based on the amount of content you have and the user's activity
    
* Admin accounts can create and manage auth keys. These keys are used to create new accounts or download videos
  ![](art/45.png)

## Upcoming features
* Creating and sharing your playlists with others

####* Creating a playlist is already supported by Frames but sharing your playlist is not
