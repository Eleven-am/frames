import Navbar from "../client/next/components/navbar/navbar";
import {Header} from "../client/next/components/navbar/navigation";
import {useNavBar} from "../client/utils/customHooks";
import {ErrorPage} from "../client/next/components/production/person";

const metaTags = {
  overview: 'Frames is a streaming service that offers a wide variety of TV shows, movies, anime, documentaries, and more on thousands straight to your browser',
  name: 'Offline',
  link: 'frames.io',
  poster: '/meta.png'
}

export default function Offline() {
  useNavBar('auth', 1);
  return (
        <>
          <Navbar/>
          <Header meta={metaTags}/>
          <ErrorPage error={{name: 'Frames is offline', message: "You currently don't have access to the internet. Please check your internet connection"}}/>
        </>
    );
}