/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface AuthKeyItemSchema {
  /** The use case of the auth key */
  case: AuthKeyItemSchemaCaseEnum;
  /** The description of the auth key usage */
  description: string;
  /**
   * The backdrop of the media the auth key was used for
   * @format uri
   */
  backdrop: string | null;
  /**
   * The auth key in question
   * @minLength 24
   * @maxLength 24
   * @example "aXCv-3dFg-4HjK-5LmN-6PqR"
   */
  key: string;
  /** The name of the auth key */
  name: string;
  /** Whether the auth key has been revoked */
  revoked: boolean;
  /**
   * The date the auth key was last updated
   * @format date-time
   */
  date: string;
}

export interface PageResponseAuthKeySchema {
  /** The current page of the results */
  page: number;
  /** The total number of pages of results */
  totalPages: number;
  /** The total number of results */
  totalResults: number;
  /** The items to paginate */
  results: AuthKeyItemSchema[];
}

export interface HttpExceptionSchema {
  /**
   * HTTP status code
   * @example 404
   */
  statusCode: number;
  /**
   * HTTP status message
   * @example "Not Found"
   */
  message: string;
  /**
   * HTTP status error
   * @example "The requested resource was not found"
   */
  error: string;
}

export interface AuthKeyEntitySchema {
  /** The id of the auth key */
  id: string;
  /**
   * The auth key in question
   * @minLength 24
   * @maxLength 24
   * @example "aXCv-3dFg-4HjK-5LmN-6PqR"
   */
  authKey: string;
  /** Whether the auth key has been revoked */
  revoked: boolean;
  /**
   * The date the auth key was created
   * @format date-time
   */
  created: string;
  /** The use case of the auth key */
  useCase: AuthKeyEntitySchemaUseCaseEnum;
  /**
   * The date the auth key was last updated
   * @format date-time
   */
  updated: string;
  /** The id of the user who created the auth key */
  userId: string;
  /** The id of the view associated with the auth key */
  viewId: string | null;
}

export interface LoginParams {
  /**
   * The email address
   * @format email
   */
  email: string;
  /**
   * Password must contain at least 8 characters, one uppercase, one lowercase and one number
   * @format password
   * @minLength 8
   * @maxLength 100
   */
  password: string;
}

export interface RegisterParams {
  /**
   * The email address
   * @format email
   */
  email: string;
  /**
   * Password must contain at least 8 characters, one uppercase, one lowercase and one number
   * @format password
   * @minLength 8
   * @maxLength 100
   */
  password: string;
  /**
   * The username
   * @minLength 3
   * @maxLength 20
   */
  username: string;
  /**
   * The auth key
   * @minLength 24
   * @maxLength 24
   * @example "aXCv-3dFg-4HjK-5LmN-6PqR"
   */
  authKey: string;
}

export interface EmailResponseSchema {
  /** The email header */
  header: string;
  /** The email message */
  text: string;
}

export interface FramesGenericResponseSchema {
  /** The message indicating the success or failure of the request */
  message: string;
}

export interface ResetPasswordByEmailParams {
  /**
   * The email address
   * @format email
   */
  email: string;
}

export interface ResetPasswordParams {
  /** The password reset token */
  token: string;
  /**
   * Password must contain at least 8 characters, one uppercase, one lowercase and one number
   * @format password
   * @minLength 8
   * @maxLength 100
   */
  password: string;
}

/** The role of the user */
export enum Role {
  USER = "USER",
  ADMIN = "ADMIN",
  GUEST = "GUEST",
  OAUTH = "OAUTH",
  SYSTEM = "SYSTEM",
}

export interface ClientUserSchema {
  /** The role of the user */
  role: Role;
  /**
   * The email of the user
   * @format email
   */
  email: string;
  /** The channel of the user */
  channel: string;
  /** The browser id of the current session */
  browserId: string;
  /** The username of the user */
  username: string;
  /** Whether the user is visible to others */
  incognito: boolean;
}

export interface SessionSchema {
  /** The session token */
  token: string;
  /** The user of the session */
  user: ClientUserSchema;
}

export interface ActivateWebAuthnParams {
  /** The activation status */
  activated: boolean;
}

export interface PublicKeyCredentialRpEntitySchema {
  /** The name of the relying party */
  id: string;
  /** The name of the relying party */
  name: string;
}

export interface PublicKeyCredentialUserEntityJSONSchema {
  /** The name of the user */
  id: string;
  /** The name of the user */
  name: string;
  /** The name of the user */
  displayName: string;
}

export interface PublicKeyCredentialParametersSchema {
  /** The type of the public key */
  type: string;
  /** The algorithm of the public key */
  alg: number;
}

/** The transports of the public key */
export enum Transport {
  Ble = "ble",
  Cable = "cable",
  Hybrid = "hybrid",
  Internal = "internal",
  Nfc = "nfc",
  SmartCard = "smart-card",
  Usb = "usb",
}

export interface PublicKeyCredentialDescriptorJSONSchema {
  /** The id of the public key */
  id: string;
  /** The type of the public key */
  type: PublicKeyCredentialDescriptorJsonSchemaTypeEnum;
  /** The transports of the public key */
  transports: Transport[];
}

export interface AuthenticatorSelectionCriteriaSchema {
  /** The authenticator attachment */
  authenticatorAttachment: string;
  /** The resident key */
  requireResidentKey: boolean;
  /** The user verification */
  userVerification: string;
  /** The resident key */
  residentKey: string;
}

export interface AuthenticationExtensionsClientInputsSchema {
  /** The appid */
  appid: string;
  /** The credential properties */
  credProps: boolean;
  /** The hmac create secret */
  hmacCreateSecret: boolean;
  /** The large blob */
  minPinLength: boolean;
}

export interface PublicKeyCredentialCreationOptionsJSONSchema {
  /** The relying party */
  rp: PublicKeyCredentialRpEntitySchema;
  /** The user */
  user: PublicKeyCredentialUserEntityJSONSchema;
  /** The challenge */
  challenge: string;
  /** The public key parameters */
  pubKeyCredParams: PublicKeyCredentialParametersSchema[];
  /** The timeout */
  timeout: number;
  /** The excluded credentials */
  excludeCredentials: PublicKeyCredentialDescriptorJSONSchema[];
  /** The authenticator selection */
  authenticatorSelection: AuthenticatorSelectionCriteriaSchema;
  /** The attestation */
  attestation: string;
  /** The extensions */
  extensions: AuthenticationExtensionsClientInputsSchema;
}

export type RegistrationResponseValidator = object;

/** The user verification */
export enum UserVerification {
  Required = "required",
  Preferred = "preferred",
  Discouraged = "discouraged",
}

export interface PublicKeyCredentialRequestOptionsJSONSchema {
  /** The challenge */
  challenge: string;
  /** The timeout */
  timeout: number;
  /** The rp id */
  rpId: string;
  /** The allow credentials */
  allowCredentials: PublicKeyCredentialDescriptorJSONSchema[];
  /** The user verification */
  userVerification: UserVerification;
  /** The extensions */
  extensions: AuthenticationExtensionsClientInputsSchema;
}

export type AuthenticationResponseValidator = object;

export interface OauthAuthKeyBody {
  /** The auth key */
  authKey: string;
  /** The activation token */
  token: string;
}

export interface CreateOauthClientArgs {
  /** The name of the oauth client */
  name: string;
  /** The client id */
  clientId: string;
  /** The client secret */
  clientSecret: string;
  /** The text to display on the button */
  buttonLabel: string;
  /** The color of the button */
  color: string;
  /** The token host */
  tokenHost: string;
  /** The authorize host */
  authorizeHost: string;
  /** The token path */
  tokenPath: string;
  /** The authorize path */
  authorizePath: string;
  /** The url to get user data */
  userDataUrl: string;
  /** The logo url of the oauth client */
  logo: string;
  /** The scopes of the oauth client */
  scopes: string[];
}

export interface OauthClientSchema {
  /** The name of the oauth client */
  name: string;
  /** The client id */
  clientId: string;
  /** The client secret */
  clientSecret: string;
  /** The text to display on the button */
  buttonLabel: string;
  /** The color of the button */
  color: string;
  /** The token host */
  tokenHost: string;
  /** The authorize host */
  authorizeHost: string;
  /** The token path */
  tokenPath: string;
  /** The authorize path */
  authorizePath: string;
  /** The url to get user data */
  userDataUrl: string;
  /** The logo url of the oauth client */
  logo: string;
  /** The scopes of the oauth client */
  scopes: string[];
  /** The id of the oauth client */
  id: string;
  /**
   * The created date
   * @format date-time
   */
  created: string;
  /**
   * The updated date
   * @format date-time
   */
  updated: string;
}

export interface OauthSlimClientSchema {
  /** The id of the oauth client */
  id: string;
  /** The text to display on the button */
  buttonLabel: string;
  /** The logo url of the oauth client */
  logo: string;
  /** The color of the button */
  color: string;
  /** The name of the oauth client */
  name: string;
}

export interface PageResponseOauthClientSchema {
  /** The current page of the results */
  page: number;
  /** The total number of pages of results */
  totalPages: number;
  /** The total number of results */
  totalResults: number;
  /** The items to paginate */
  results: OauthSlimClientSchema[];
}

export interface UpdateOauthClientArgs {
  /** The name of the oauth client */
  name: string;
  /** The client id */
  clientId: string;
  /** The client secret */
  clientSecret: string;
  /** The text to display on the button */
  buttonLabel: string;
  /** The color of the button */
  color: string;
  /** The token host */
  tokenHost: string;
  /** The authorize host */
  authorizeHost: string;
  /** The token path */
  tokenPath: string;
  /** The authorize path */
  authorizePath: string;
  /** The url to get user data */
  userDataUrl: string;
  /** The logo url of the oauth client */
  logo: string;
  /** The scopes of the oauth client */
  scopes: string[];
  /** The oauth client id */
  id: string;
}

/** The type of media item */
export enum MediaType {
  MOVIE = "MOVIE",
  SHOW = "SHOW",
}

export interface DownloadItemSchema {
  /** The id of the media item */
  id: string;
  /** The name of the media item */
  name: string;
  /** The download URL */
  location: string;
  /** The episode name */
  episodeName: string | null;
  /** The episode number */
  backdrop: string;
  /** The blurred backdrop of the media item */
  backdropBlur: string;
  /** The backdrop image */
  createdAt: string;
  /** The type of media item */
  type: MediaType;
  /** If the download can still be accessed */
  isAccessible: boolean;
}

export interface DownloadsSchema {
  /** The download URL */
  location: string;
}

export interface CreateFrameArgs {
  /**
   * The percentage of the video that has been watched
   * @format number
   */
  percentage: number;
  /**
   * The cypher of the video
   * @minLength 13
   * @example "ExampleCypher123"
   */
  cypher: string;
}

export interface FrameCreateSchema {
  /** The cypher of the created frame */
  cypher: string;
  /**
   * The created date of the frame
   * @format date-time
   */
  created: string;
  /**
   * The percentage of the video the frame was created at
   * @min 0
   * @max 100
   */
  percentage: number;
}

export interface FramesItemSchema {
  /** The id of the media item */
  id: string;
  /** The name of the media item */
  name: string;
  /** The tmdb id of the media item */
  tmdbId: number;
  /**
   * The poster of the media item
   * @format uri
   */
  poster: string;
  /** The blurred poster of the media item */
  posterBlur: string;
  /**
   * The backdrop of the media item
   * @format uri
   */
  backdrop: string;
  /** The blurred backdrop of the media item */
  backdropBlur: string;
  /**
   * The portrait of the media item
   * @format uri
   */
  portrait: string;
  /** The blurred portrait of the media item */
  portraitBlur: string;
  /**
   * The logo of the media item
   * @format uri
   */
  logo: string | null;
  /** The blurred logo of the media item */
  logoBlur: string | null;
  /** The type of media item */
  type: MediaType;
  /**
   * The percentage of the video the frame was created at
   * @min 0
   * @max 100
   */
  percentage: number;
}

export interface PageResponseFrameSchema {
  /** The current page of the results */
  page: number;
  /** The total number of pages of results */
  totalPages: number;
  /** The total number of results */
  totalResults: number;
  /** The items to paginate */
  results: FramesItemSchema[];
}

export interface SubtitleSchema {
  /** The language of the subtitle */
  language: string;
  /** The id of the subtitle */
  subtitleId: string;
}

export interface PlaybackSessionSchema {
  /** The name of the video */
  name: string;
  /** The name of the episode */
  episodeName: string | null;
  /** The overview of the video */
  overview: string;
  /** The overview of the episode */
  episodeOverview: string | null;
  /** The backdrop of the episode */
  episodeBackdrop: string | null;
  /**
   * The poster of the media
   * @format uri
   */
  poster: string;
  /**
   * The backdrop of the media
   * @format uri
   */
  backdrop: string;
  /** The blurred backdrop of the media */
  backdropBlur: string;
  /**
   * The logo of the media
   * @format uri
   */
  logo: string | null;
  /** The blurred logo of the media */
  logoBlur: string | null;
  /** The available subtitles for the media */
  availableSubtitles: SubtitleSchema[];
  /** The active subtitle for the media */
  activeSubtitle: string;
  /** The active subtitle url for the media */
  activeSubtitleUrl: string;
  /** The type of the media */
  mediaType: MediaType;
  /** The id of the media */
  mediaId: string;
  /**
   * The source of the media
   * @format uri
   */
  source: string;
  /** The id of the episode */
  episodeId: string;
  /** The id of the video */
  videoId: string;
  /** The id of the playback */
  playbackId: string;
  /** Inform the user about the playback */
  inform: boolean;
  /** Auto play the next video */
  autoPlay: boolean;
  /** The percentage of the playback */
  percentage: number;
  /** Whether the user is allowed to access the underlying stream */
  canAccessStream: boolean;
}

export interface CreateGroupArgs {
  /** The name of the group */
  name: string;
}

export interface VersionInfoSchema {
  /** Current version of the Docker image */
  currentVersion: string;
  /** Latest version of the Docker image */
  latestVersion: string;
  /**
   * Date the latest version was created
   * @format date-time
   */
  latestCreated: string;
  /** Whether the current version is the latest */
  isLatest: boolean;
  /**
   * Date the version check was performed
   * @format date-time
   */
  checkedAt: string;
}

/** The type of response, used for display */
export enum HomeResponseTypes {
  BASIC = "BASIC",
  EDITOR = "EDITOR",
  CLASSIC = "CLASSIC",
  CONTINUE_WATCHING = "CONTINUE_WATCHING",
}

export interface SlimMediaSchema {
  /** The id of the media item */
  id: string;
  /** The name of the media item */
  name: string;
  /** The tmdb id of the media item */
  tmdbId: number;
  /**
   * The poster of the media item
   * @format uri
   */
  poster: string;
  /** The blurred poster of the media item */
  posterBlur: string;
  /**
   * The backdrop of the media item
   * @format uri
   */
  backdrop: string;
  /** The blurred backdrop of the media item */
  backdropBlur: string;
  /**
   * The portrait of the media item
   * @format uri
   */
  portrait: string;
  /** The blurred portrait of the media item */
  portraitBlur: string;
  /**
   * The logo of the media item
   * @format uri
   */
  logo: string | null;
  /** The blurred logo of the media item */
  logoBlur: string | null;
  /** The type of media item */
  type: MediaType;
}

export interface HomeResponseSlimMediaSchema {
  /** The type of response, used for display */
  type: HomeResponseTypes;
  /** The label to display for the response */
  label: string;
  /** The identifier to use for the response, used for deduplication */
  identifier: string;
  /** The items to display */
  results: SlimMediaSchema[];
}

export interface DetailedMediaSchema {
  /** The id of the media item */
  id: string;
  /** The name of the media item */
  name: string;
  /** The tmdb id of the media item */
  tmdbId: number;
  /**
   * The poster of the media item
   * @format uri
   */
  poster: string;
  /** The blurred poster of the media item */
  posterBlur: string;
  /**
   * The backdrop of the media item
   * @format uri
   */
  backdrop: string;
  /** The blurred backdrop of the media item */
  backdropBlur: string;
  /**
   * The portrait of the media item
   * @format uri
   */
  portrait: string;
  /** The blurred portrait of the media item */
  portraitBlur: string;
  /**
   * The logo of the media item
   * @format uri
   */
  logo: string | null;
  /** The blurred logo of the media item */
  logoBlur: string | null;
  /** The type of media item */
  type: MediaType;
  /** The popularity of the media item */
  popularity: number;
  /** The genre of the media item */
  genre: string;
  /** The trailer for the media item */
  trailer: string | null;
  /** The overview of the media item */
  overview: string | null;
  /**
   * The release date of the media item
   * @format date-time
   */
  releaseDate: string | null;
  /** The rating of the media item */
  rating: string;
}

export interface IsInListResponseSchema {
  /** Whether the media item is in the list */
  isInList: boolean;
}

export interface SingleVideo {
  /** The id of the video */
  videoId: string;
  /** The index of the video in the playlist */
  index: number;
}

export interface CreatePlaylistArgs {
  /** The name of the playlist */
  name: string;
  /** The overview of the playlist */
  overview: string;
  /** Whether the playlist is public */
  isPublic: boolean;
  /** The videos in the playlist */
  videos: SingleVideo[];
}

export interface PlaylistVideoResponseSchema {
  /** The id of the playlist video */
  id: string;
  /** The id of the playlist */
  playlistId: string;
  /** The id of the video */
  videoId: string;
  /**
   * The backdrop of the playlist video
   * @format uri
   */
  backdrop: string;
  /** The index of the video in the playlist */
  index: number;
  /** The backdrop blur of the playlist video */
  backdropBlur: string;
  /**
   * The last updated date of the playlist video
   * @format date-time
   */
  updatedAt: string;
  /** The name of the video */
  name: string;
}

export interface PlaylistDetailsSchema {
  /** The id of the playlist */
  id: string;
  /** The name of the playlist */
  name: string;
  /** The overview of the playlist */
  overview: string;
  /** The policy of the user for the playlist */
  accessPolicy: PlaylistDetailsSchemaAccessPolicyEnum;
  /** The author of the playlist */
  author: string;
  /** Whether the playlist is public */
  isPublic: boolean;
  /** The videos in the playlist */
  videos: PlaylistVideoResponseSchema[];
  /**
   * The last updated date of the playlist
   * @format date-time
   */
  updatedAt: string;
}

export interface PlaylistItemSchema {
  /** The id of the playlist */
  id: string;
  /** The name of the playlist */
  name: string;
  /** The overview of the playlist */
  overview: string;
  /** Whether the playlist is public */
  isPublic: boolean;
  /**
   * The backdrop of the playlist
   * @format uri
   */
  backdrop: string;
  /** The backdrop blur of the playlist */
  backdropBlur: string;
  /** The number of videos in the playlist */
  videoCount: number;
  /**
   * The last updated date of the playlist
   * @format date-time
   */
  updatedAt: string;
}

export interface PageResponsePlaylistSchema {
  /** The current page of the results */
  page: number;
  /** The total number of pages of results */
  totalPages: number;
  /** The total number of results */
  totalResults: number;
  /** The items to paginate */
  results: PlaylistItemSchema[];
}

export interface SingleVideoWithId {
  /** The id of the video */
  videoId: string;
  /** The index of the video in the playlist */
  index: number;
  /** The id of the playlist video */
  id: string;
}

export interface UpdatePlaylistArgs {
  /** The name of the playlist */
  name: string;
  /** The overview of the playlist */
  overview: string;
  /** Whether the playlist is public */
  isPublic: boolean;
  /** The videos in the playlist */
  videos: SingleVideoWithId[];
  /** The id of the playlist video */
  id: string;
}

export interface PlaylistForMediaContextSchema {
  /** The id of the playlist */
  playlistId: string;
  /** The name of the playlist */
  playlistName: string;
  /** Whether the playlist is public */
  isPublic: boolean;
  /** Whether the media is in the playlist */
  mediaInPlaylist: boolean;
}

export interface SharedUser {
  /**
   * The email of the user
   * @format email
   */
  email: string;
  /** The access policy assigned to the user for the playlist */
  policy: SharedUserPolicyEnum;
}

export interface SharePlaylistArgs {
  /** The id of the playlist to share */
  playlistId: string;
  /** The users to share the playlist with */
  users: SharedUser[];
}

export interface PageResponseSlimMediaSchema {
  /** The current page of the results */
  page: number;
  /** The total number of pages of results */
  totalPages: number;
  /** The total number of results */
  totalResults: number;
  /** The items to paginate */
  results: SlimMediaSchema[];
}

export interface LevenshteinMatchSchema {
  /** The id of the media item */
  id: string;
  /** The name of the media item */
  name: string;
  /** The type of media item */
  type: MediaType;
}

export interface IdFromQuerySchema {
  /** The id of the media item */
  id: string;
  /** The name of the media item */
  name: string;
}

export interface FilterGenreArgs {
  /** The type of media to filter */
  type: MediaType;
  /** The genres to filter */
  genres: string[];
  /** The decade to filter */
  decade: number;
}

export interface FilterMediaArgs {
  /** The page number */
  page: number;
  /** The number of items per page */
  pageSize: number;
  /** The type of media to filter */
  type: MediaType;
  /** The genres to filter */
  genres: string[];
  /** The decade to filter */
  decade: number;
}

/** The type of company */
export enum CompanyType {
  PRODUCTION = "PRODUCTION",
  DISTRIBUTION = "DISTRIBUTION",
}

export interface NetworkResponseSchema {
  /** The id of the company */
  id: string;
  /** The name of the company */
  name: string;
  /** The logo of the company */
  logo: string | null;
  /** The type of company */
  type: CompanyType;
  /** The movies the network has produced */
  movies: SlimMediaSchema[];
  /** The shows the network has produced */
  shows: SlimMediaSchema[];
}

export interface PersonResponseSchema {
  /** The id of the person */
  id: number;
  /**
   * The birthday of the person
   * @format date-time
   */
  birthday: string;
  /** The Gender of the user according to TmDB */
  gender: number;
  /** The name of the person */
  name: string;
  /** The biography of the person */
  biography: string;
  /** The profile of the person */
  profile: string;
  /** The media items the person has stared in */
  staredIn: SlimMediaSchema[];
  /** The media items the person has wrote for */
  wroteFor: SlimMediaSchema[];
  /** The media items the person has directed */
  directed: SlimMediaSchema[];
  /** The media items the person has produced */
  produced: SlimMediaSchema[];
}

export interface CollectionPageResponseSchema {
  /** The name of the collection */
  name: string;
  /** The description of the collection */
  description: string;
  /** The backdrop of the collection */
  backdrop: string | null;
  /** The poster of the collection */
  poster: string | null;
  /** The media items in the collection */
  media: DetailedMediaSchema[];
}

export interface SearchedVideoSchema {
  /** The name of the video */
  name: string;
  /** The id of the video */
  videoId: string;
  /** The backdrop of the video */
  backdrop: string;
  /** The blurred backdrop of the video */
  backdropBlur: string;
  /** The episode of the video */
  episode: number | null;
  /** The season of the video */
  season: number | null;
}

export interface SearchedMediaSchema {
  /** The id of the media item */
  id: string;
  /** The name of the media item */
  name: string;
  /** The tmdb id of the media item */
  tmdbId: number;
  /**
   * The poster of the media item
   * @format uri
   */
  poster: string;
  /** The blurred poster of the media item */
  posterBlur: string;
  /**
   * The backdrop of the media item
   * @format uri
   */
  backdrop: string;
  /** The blurred backdrop of the media item */
  backdropBlur: string;
  /**
   * The portrait of the media item
   * @format uri
   */
  portrait: string;
  /** The blurred portrait of the media item */
  portraitBlur: string;
  /**
   * The logo of the media item
   * @format uri
   */
  logo: string | null;
  /** The blurred logo of the media item */
  logoBlur: string | null;
  /** The type of media item */
  type: MediaType;
  /** The videos for the media item */
  videos: SearchedVideoSchema[];
}

export interface PageResponseSearchedMediaSchema {
  /** The current page of the results */
  page: number;
  /** The total number of pages of results */
  totalPages: number;
  /** The total number of results */
  totalResults: number;
  /** The items to paginate */
  results: SearchedMediaSchema[];
}

export interface CastResponseSchema {
  /** The name of the person */
  name: string;
  /** The character the person plays */
  character: string;
  /** The profile path of the person */
  profilePath: string;
  /** The tmdb id of the person */
  tmdbId: number;
}

export interface CrewResponseSchema {
  /** The name of the person */
  name: string;
  /** The job the person does */
  job: string;
  /** The profile path of the person */
  profilePath: string;
  /** The tmdb id of the person */
  tmdbId: number;
  /** The department the person works in */
  department: string;
}

export interface MediaExtrasSchema {
  /** The thumbnail of the extra */
  thumbnail: string;
  /** The youtube id of the extra */
  youtubeId: string;
  /** The name of the extra */
  name: string;
  /**
   * The published date of the extra
   * @format date-time
   */
  publishedAt: string;
  /** The type of extra */
  type: MediaExtrasSchemaTypeEnum;
}

export interface CollectionResponseSchema {
  /** The tmdb id of the collection */
  tmdbId: number;
  /** The name of the collection */
  name: string;
}

export interface CompanyResponseSchema {
  /** The id of the company */
  id: string;
  /** The name of the company */
  name: string;
  /** The logo of the company */
  logo: string | null;
  /** The type of company */
  type: CompanyType;
}

/** The sections of the media item */
export enum MediaSection {
  MoreLikeThis = "More Like This",
  Extras = "Extras",
  Details = "Details",
  MostRelevant = "Most Relevant",
  Episodes = "Episodes",
  Seasons = "Seasons",
}

export interface EpisodeResponseSchema {
  /** The id of the episode */
  id: string;
  /** The name of the episode */
  name: string;
  /** The overview of the episode */
  overview: string | null;
  /** The season of the episode */
  season: number;
  /** The episode number */
  episode: number;
  /** The photo of the episode */
  photo: string;
  /** The id of the show */
  showId: string;
  /** The id of the video */
  videoId: string;
}

export interface SeasonResponseSchema {
  /** The season number */
  season: number;
  /** The episodes of the season */
  episodes: EpisodeResponseSchema[];
}

export interface MediaResponseSchema {
  /** The id of the media item */
  id: string;
  /** The name of the media item */
  name: string;
  /** The tmdb id of the media item */
  tmdbId: number;
  /**
   * The poster of the media item
   * @format uri
   */
  poster: string;
  /** The blurred poster of the media item */
  posterBlur: string;
  /**
   * The backdrop of the media item
   * @format uri
   */
  backdrop: string;
  /** The blurred backdrop of the media item */
  backdropBlur: string;
  /**
   * The portrait of the media item
   * @format uri
   */
  portrait: string;
  /** The blurred portrait of the media item */
  portraitBlur: string;
  /**
   * The logo of the media item
   * @format uri
   */
  logo: string | null;
  /** The blurred logo of the media item */
  logoBlur: string | null;
  /** The type of media item */
  type: MediaType;
  /** The popularity of the media item */
  popularity: number;
  /** The genre of the media item */
  genre: string;
  /** The genres of the media item */
  genres: string[];
  /** The trailer for the media item */
  trailer: string | null;
  /** The overview of the media item */
  overview: string | null;
  /**
   * The release date of the media item
   * @format date-time
   */
  releaseDate: string | null;
  /** The rating of the media item */
  rating: string;
  /** The actors of the media item */
  actors: CastResponseSchema[];
  /** The writers of the media item */
  writers: CrewResponseSchema[];
  /** The directors of the media item */
  directors: CrewResponseSchema[];
  /** The producers of the media item */
  producers: CrewResponseSchema[];
  /** The extras of the media item */
  extras: MediaExtrasSchema[];
  /** The collection the media item belongs to */
  collection: CollectionResponseSchema | null;
  /** The recommended media items */
  recommendations: SlimMediaSchema[];
  /** The companies of the media item */
  companies: CompanyResponseSchema[];
  /** The vote average of the media item */
  voteAverage: number;
  /** The runtime of the media item */
  runtime: string;
  /** The sections of the media item */
  sections: MediaSection[];
  /** The seasons of the show */
  seasons: SeasonResponseSchema[];
  /** The status of the media item */
  mediaStatus: string | null;
}

/** The type of pick, changes the way it is displayed */
export enum PickType {
  EDITOR = "EDITOR",
  BASIC = "BASIC",
}

export interface PickMediaArgs {
  /** The id of the media */
  id: string;
  /** The index of the media */
  index: number;
}

export interface CreatePicksArgs {
  /** The title of the pick */
  name: string;
  /** The index of the pick */
  index: number;
  /** The type of pick, changes the way it is displayed */
  type: PickType;
  /** The media for the pick */
  media: PickMediaArgs[];
}

export interface PickMediaSchema {
  /** A single media item for a pick */
  media: SlimMediaSchema;
  /** The index of the media item */
  index: number;
}

export interface PickResponseSchema {
  /** The category of the pick */
  id: string;
  /** The title of the pick */
  name: string;
  /** The media for the pick */
  media: PickMediaSchema[];
  /** The type of pick, changes the way it is displayed */
  type: PickType;
  /** The index of the pick */
  index: number;
  /** If the pick is active */
  isActive: boolean;
}

export interface GetPaginatedPicksArgs {
  /** The page number */
  page: number;
  /** The number of items per page */
  pageSize: number;
  /** The type of pick, changes the way it is displayed */
  type: PickType;
}

export interface PageResponsePickSchema {
  /** The current page of the results */
  page: number;
  /** The total number of pages of results */
  totalPages: number;
  /** The total number of results */
  totalResults: number;
  /** The items to paginate */
  results: PickResponseSchema[];
}

export interface PickCountSchema {
  /** The number of basic picks */
  basic: number;
  /** The number of editor picks */
  editor: number;
}

export interface UpdatePicksArgs {
  /** The title of the pick */
  name: string;
  /** The index of the pick */
  index: number;
  /** The type of pick, changes the way it is displayed */
  type: PickType;
  /** The media for the pick */
  media: PickMediaArgs[];
}

export interface DeletePicksArgs {
  /** The ids of the picks to delete */
  ids: string[];
}

export interface UpNextDetailsSchema {
  /** The blurred backdrop of the media */
  backdropBlur: string;
  /**
   * The backdrop of the media
   * @format uri
   */
  backdrop: string;
  /**
   * The logo of the media
   * @format uri
   */
  logo: string | null;
  /** The blurred logo of the media */
  logoBlur: string | null;
  /** The name of the media */
  name: string;
  /** The overview of the media */
  overview: string;
  /** The type of the media */
  type: MediaType;
  /** The name of the episode */
  episodeName: string | null;
  /** The backdrop of the episode */
  episodeBackdrop: string | null;
  /** The overview of the episode */
  episodeOverview: string | null;
  /** The id of the playlist video */
  playlistVideoId: string | null;
  /** The id of the video */
  videoId: string;
  /** The id of the media */
  mediaId: string;
}

export interface ProgressPlaybackParams {
  /** The percentage of the video that has been watched */
  percentage: number;
}

export interface UpdatePlaybackInformSchema {
  /** Whether to save the playback information */
  inform: boolean;
}

export interface ArtworkSchema {
  /** The base64 encoded image data */
  url: string;
  /** The id of the video the artwork is for */
  videoId: string;
  /** The percentage of the video the artwork is for */
  percentage: number;
}

export enum Quality {
  Value1080P = "1080p",
  Value720P = "720p",
  Value480P = "480p",
}

/** The id of the media */
export enum RatedStatus {
  POSITIVE = "POSITIVE",
  NEGATIVE = "NEGATIVE",
  NONE = "NONE",
}

export interface RatingResponseSchema {
  /** The id of the rating */
  id: string;
  /** The id of the media */
  status: RatedStatus;
}

export interface RoomResponseSchema {
  /** The poster image URL */
  poster: string;
  /** The backdrop image URL */
  backdrop: string;
  /** The blurred backdrop image URL */
  backdropBlur: string;
  /** The logo image URL */
  logo: string | null;
  /** The blurred logo image URL */
  logoBlur: string | null;
  /** The type of media */
  mediaType: MediaType;
  /** The media name */
  mediaName: string;
  /** The media ID */
  mediaId: string;
  /** The episode ID */
  episodeId: string | null;
  /** The episode name */
  episodeName: string | null;
  /** The video ID */
  videoId: string;
  /** The room ID */
  roomId: string;
  /** Whether the user is the room leader */
  isLeader: boolean;
  /** The playback ID */
  playbackId: string;
}

/** The type of storage */
export enum CloudDrive {
  GDRIVE = "GDRIVE",
  DROPBOX = "DROPBOX",
  S3 = "S3",
  LOCAL = "LOCAL",
}

export interface StorageDetailSchema {
  /** The name of the storage */
  name: string;
  /** The owner of the storage */
  owner: string;
  /** The storage ID of the storage */
  storageId: string;
  /** The type of storage */
  storageType: CloudDrive;
  /** The number of movies in the storage */
  movies: number;
  /** The number of shows in the storage */
  shows: number;
  /** The number of un scanned movies in the storage */
  unScannedMovies: number;
  /** The number of un scanned shows in the storage */
  unScannedShows: number;
  /** If the storage has movie locations */
  hasMovieLocations: boolean;
  /** If the storage has show locations */
  hasShowLocations: boolean;
}

export interface UnScannedItemSchema {
  /** The name of the media */
  name: string;
  /** The tmdb ID of the media */
  tmdbId: number;
  /** The year the media was released */
  year: number;
  /** The poster of the media */
  poster: string | null;
  /** The filename of the media */
  filename: string;
  /** The filepath of the media */
  filepath: string;
  /** The blurred poster of the media */
  posterBlur: string | null;
  /** The name of the storage the item is in */
  storageName: string;
  /** The storage ID of the storage the item is in */
  storageId: string;
  /** The username of the owner of the storage */
  owner: string;
  /** The type of media */
  type: MediaType;
}

export interface PageResponseUnScannedItemSchema {
  /** The current page of the results */
  page: number;
  /** The total number of pages of results */
  totalPages: number;
  /** The total number of results */
  totalResults: number;
  /** The items to paginate */
  results: UnScannedItemSchema[];
}

export interface GetMediaSchema {
  /** The ID of the media on TMDB */
  tmdbId: number;
  /** The type of media */
  type: MediaType;
  /** The poster URL to use for the media */
  poster: string;
  /** The backdrop URL to use for the media */
  backdrop: string;
  /** The portrait URL to use for the media */
  portrait: string;
  /** The logo URL to use for the media */
  logo: string | null;
  /** The ID of the media to edit */
  id: string;
  /** The name of the media */
  name: string;
  /** The name of the file or folder the media is stored in */
  fileName: string;
}

export interface EpisodeFileSchema {
  /** The path to the episode file */
  fileName: string;
  /** The episode id for the episode in the database */
  episodeId: string;
  /** The season number of the episode */
  season: number;
  /** The episode number of the episode */
  episode: number;
}

export interface FrontImageSchema {
  /** The language of the image */
  language: string | null;
  /** The source of the image */
  source: string;
  /** The year of the image */
  year: number;
  /** The drift of the image */
  drift: number;
  /** The likes of the image */
  likes: number;
  /** The URL of the image */
  url: string;
  /** The name of the media the image is for */
  name: string;
}

export interface FrontImagesSchema {
  /** The backdrops of the media */
  backdrops: FrontImageSchema[];
  /** The posters of the media */
  posters: FrontImageSchema[];
  /** The logos of the media */
  logos: FrontImageSchema[];
  /** The portraits of the media */
  portraits: FrontImageSchema[];
}

export interface TmdbMediaSchema {
  /** The tmdbId of the media */
  tmdbId: number;
  /** The name of the media */
  name: string;
  /** The year of the media */
  year: number;
}

export interface CreateFromTmdbIdArgs {
  /** The tmdbId of the media to get images for */
  tmdbId: number;
  /** The type of media */
  type: MediaType;
  /** The filepath of the media */
  filepath: string;
  /** The storage ID of the media */
  storageId: string;
}

export interface EditMediaSchema {
  /** The ID of the media on TMDB */
  tmdbId: number;
  /** The type of media */
  type: MediaType;
  /** The poster URL to use for the media */
  poster: string;
  /** The backdrop URL to use for the media */
  backdrop: string;
  /** The portrait URL to use for the media */
  portrait: string;
  /** The logo URL to use for the media */
  logo: string | null;
  /** The ID of the media to edit */
  id: string;
  /** The name of the media */
  name: string;
}

export interface CreateMediaArgs {
  /** The ID of the media on TMDB */
  tmdbId: number;
  /** The type of media */
  type: MediaType;
  /** The poster URL to use for the media */
  poster: string;
  /** The backdrop URL to use for the media */
  backdrop: string;
  /** The portrait URL to use for the media */
  portrait: string;
  /** The logo URL to use for the media */
  logo: string | null;
  /** The file path of the media */
  filepath: string;
  /** The storage ID of the media */
  storageId: string;
}

export interface VideoSeen {
  /** The id of the video */
  videoId: string;
  /** The percentage of the video that has been watched */
  percentage: number;
}

export interface SeenResponseSchema {
  /** Whether the media item is marked as seen */
  hasSeen: boolean;
  /** The videos that have been seen */
  videosSeen: VideoSeen[];
}

export interface TmdbApiKeyParams {
  /** The API key for The Movie Database */
  tmdbApiKey: string;
}

export interface FanArtTvApiKeyParams {
  /** The API key for FanArtTv */
  fanArtTvApiKey: string;
}

export interface OpenAiApiKeyParams {
  /** The API key for OpenAi */
  openAiApiKey: string;
}

export interface OpenSubtitlesParams {
  /** The user agent for OpenSubtitles */
  userAgent: string;
  /** The username for OpenSubtitles */
  username: string;
  /** The password for OpenSubtitles */
  password: string;
}

export interface MailServerParams {
  /** The host of the mail server */
  host: string;
  /** The port of the mail server */
  port: number;
  /** The user of the mail server */
  user: string;
  /** The password to the mail server */
  pass: string;
  /** The domain of the mail server */
  domain: string;
}

export interface AdminAccountParams {
  /**
   * The email address
   * @format email
   */
  email: string;
  /**
   * Password must contain at least 8 characters, one uppercase, one lowercase and one number
   * @format password
   * @minLength 8
   * @maxLength 100
   */
  password: string;
  /**
   * The username
   * @minLength 3
   * @maxLength 20
   */
  username: string;
}

/** The provider of the oauth client */
export enum OauthProvider {
  DROPBOX = "DROPBOX",
  DRIVE = "DRIVE",
}

export interface OauthClientParams {
  /** The name of the Cloud service */
  name: string;
  /** The client id of the oauth client */
  clientId: string;
  /** The client secret of the oauth client */
  clientSecret: string;
  /** The provider of the oauth client */
  provider: OauthProvider;
}

export interface FramesFileSchema {
  /** The name of the file */
  name: string;
  /** The path of the file */
  path: string;
  /** The size of the file */
  size: number;
  /** The mime type of the file */
  mimeType: string | null;
  /** If the file is a folder */
  isFolder: boolean;
  /** The last time the file was modified */
  modifiedAt: string;
  /** The id of the storage */
  cloudStorageId: string;
}

export interface ReadFolderSchema {
  /** The name of the file */
  name: string;
  /** The path of the file */
  path: string;
  /** The size of the file */
  size: number;
  /** The mime type of the file */
  mimeType: string | null;
  /** If the file is a folder */
  isFolder: boolean;
  /** The last time the file was modified */
  modifiedAt: string;
  /** The id of the storage */
  cloudStorageId: string;
  /** The list of files in the folder */
  items: FramesFileSchema[];
}

export interface SlimStorageSchema {
  /** The id of the storage */
  id: string;
  /** The name of the storage */
  name: string;
  /** The storage driver of the storage */
  drive: CloudDrive;
}

export interface SetupConfigurationSchema {
  /** Whether the TMDB API Key has been configured */
  tmdbConfigured: boolean;
  /** Whether the FanArt API Key has been configured */
  fanArtConfigured: boolean;
  /** Whether the OpenAI API Key has been configured */
  openaiConfigured: boolean;
  /** Whether the OpenSubtitles configuration has been configured */
  openSubtitlesConfigured: boolean;
  /** Whether the Mail configuration has been configured */
  mailServerConfigured: boolean;
  /** The number of storages that have been configured */
  storagesConfigured: number;
  /** Whether the admin account has been configured */
  adminConfigured: boolean;
}

export interface S3Params {
  /** The access key for the S3 bucket */
  accessKeyId: string;
  /** The secret key for the S3 bucket */
  secretAccessKey: string;
  /** The region for the S3 bucket */
  region: string;
  /** The bucket name for the S3 bucket */
  bucket: string;
  /** The endpoint for the S3 bucket */
  endpoint: string;
  /** The folder for the S3 bucket */
  name: string;
}

export interface UpdateSetupStorageArgs {
  /** The id of the storage */
  cloudStorageId: string;
  /** The list of locations to scan for movies */
  movieLocations: string[];
  /** The list of locations to scan for shows */
  showLocations: string[];
}

export interface CreateStorageArgs {
  /** The provider to use for the storage */
  drive: CreateStorageArgsDriveEnum;
  /** The name of the storage */
  name: string;
  /** The locations where movies are stored */
  movieLocations: string[];
  /** The locations where shows are stored */
  showLocations: string[];
  /** The credentials to use for the storage */
  credentials: string;
}

export interface SafeStorageSchema {
  /** The id of the storage */
  id: string;
  /** The name of the storage */
  name: string;
  /** The storage driver of the storage */
  drive: CloudDrive;
  /** The location where movies are stored in the storage */
  movieLocations: string[];
  /** The location where tv shows are stored in the storage */
  showLocations: string[];
  /** The last time the storage was created */
  created: string;
  /** The last time the storage was updated */
  updated: string;
}

export interface PageResponseStorageSchema {
  /** The current page of the results */
  page: number;
  /** The total number of pages of results */
  totalPages: number;
  /** The total number of results */
  totalResults: number;
  /** The items to paginate */
  results: SafeStorageSchema[];
}

export interface UpdateStorageArgs {
  /** The storage id */
  id: string;
  /** The name of the storage */
  name: string;
  /** The locations where movies are stored */
  movieLocations: string[];
  /** The locations where shows are stored */
  showLocations: string[];
}

export interface DeleteFileArgs {
  /** The file path of the media */
  filepath: string;
  /** The storage ID of the media */
  storageId: string;
}

export interface NodeCueSchema {
  /** The start of the cue */
  start: number;
  /** The end of the cue */
  end: number;
  /** The text of the cue */
  text: string;
}

export interface SubtitleInfoSchema {
  /** The id of the subtitle */
  id: string;
  /** The offset of the subtitle */
  offset: number;
  /** The cues of the subtitle */
  nodes: NodeCueSchema[];
  /** The URL of the subtitle */
  subtitleUrl: string;
  /** The label of the subtitle */
  label: string;
  /** The source language of the subtitle */
  srcLang: string;
}

export interface UpdateOffsetSchema {
  /** The new offset to set for the subtitle */
  offset: number;
}

export interface UserMediaDetailsResponseSchema {
  /** Whether the media is in the user's list */
  isInList: boolean;
  /** The user's rating of the media */
  rating: RatedStatus;
  /** The user's seen status of the media */
  seen: SeenResponseSchema;
  /** Whether the user can modify the media */
  canModify: boolean;
}

export interface UpdateUserArgs {
  /** Whether the user is incognito */
  incognito?: boolean;
  /** Whether the user wants to inform the server of their progress */
  inform?: boolean;
  /** Whether the user wants to auto play videos */
  autoplay?: boolean;
}

export interface UsernameParams {
  /**
   * The username
   * @minLength 3
   * @maxLength 20
   */
  username: string;
}

export interface ContinueWatchingItemSchema {
  /** The id of the media item */
  id: string;
  /** The name of the media item */
  name: string;
  /** The tmdb id of the media item */
  tmdbId: number;
  /**
   * The poster of the media item
   * @format uri
   */
  poster: string;
  /** The blurred poster of the media item */
  posterBlur: string;
  /**
   * The backdrop of the media item
   * @format uri
   */
  backdrop: string;
  /** The blurred backdrop of the media item */
  backdropBlur: string;
  /**
   * The portrait of the media item
   * @format uri
   */
  portrait: string;
  /** The blurred portrait of the media item */
  portraitBlur: string;
  /**
   * The logo of the media item
   * @format uri
   */
  logo: string | null;
  /** The blurred logo of the media item */
  logoBlur: string | null;
  /** The type of media item */
  type: MediaType;
  /** The video ID */
  videoId: string;
  /** The percentage watched */
  percentage: number;
}

export interface HomeResponseContinueWatchingSchema {
  /** The type of response, used for display */
  type: HomeResponseTypes;
  /** The label to display for the response */
  label: string;
  /** The identifier to use for the response, used for deduplication */
  identifier: string;
  /** The items to display */
  results: ContinueWatchingItemSchema[];
}

/** The action of the user */
export enum PresenceAction {
  BROWSING = "BROWSING",
  WATCHING = "WATCHING",
  AWAY = "AWAY",
}

export interface MetadataSchema {
  /** The name of the media */
  name: string;
  /**
   * The backdrop of the media
   * @format uri
   */
  backdrop: string;
  /**
   * The poster of the media
   * @format uri
   */
  poster: string;
  /** The overview of the media */
  overview: string | null;
  /**
   * The logo of the media
   * @format uri
   */
  logo: string | null;
  /** The backdrop blur of the media */
  backdropBlur: string;
  /** The action of the user */
  action: PresenceAction;
  /** The playback id the user is currently watching */
  playbackId: string | null;
  /** The media id of the media */
  mediaId: string;
}

export interface SlimFrontUserSchema {
  /** The user ID */
  userId: string;
  /** The username of the user */
  username: string;
  /** The number of media the user has watched */
  watched: number;
  /** The number of media the user has rated */
  rated: number;
  /** The number of lists the user has created */
  lists: number;
  /** The date the user was created */
  created: string;
  /** The email of the user */
  email: string;
  /** The role of the user */
  role: Role;
  /** The number of media the user has seen */
  seen: number;
  /** The number of user groups the user is in */
  userGroups: number;
  /** The number of playlists the user has created */
  playlists: number;
  /** Whether the user has been revoked */
  revoked: boolean;
  /** Whether the user has confirmed their email */
  confirmed: boolean;
}

export interface PageResponseSlimFrontUserSchema {
  /** The type of response, used for display */
  type: HomeResponseTypes;
  /** The label to display for the response */
  label: string;
  /** The identifier to use for the response, used for deduplication */
  identifier: string;
  /** The items to display */
  results: SlimFrontUserSchema[];
}

/** The type of history to search for */
export enum HistoryType {
  Watched = "Watched",
  AddedToWatchlist = "Added_to_watchlist",
  RatedPositive = "Rated_positive",
  RatedNegative = "Rated_negative",
}

export interface GetActivityArgs {
  /** The page number */
  page: number;
  /** The number of items per page */
  pageSize: number;
  /** The query to search for */
  query?: string;
  /**
   * The type of history to search for
   * @example ["Watched","Added_to_watchlist"]
   */
  type?: HistoryType[];
}

export interface HistoryMediaItemSchema {
  /** The id of the media */
  id: string;
  /** The name of the media */
  name: string;
  /** The poster of the media */
  poster: string;
  /** The blurred poster of the media */
  posterBlur: string;
  /** The episode of the media, if applicable */
  episode?: number;
  /** The season of the media, if applicable */
  season?: number;
  /** The video id of the media, if applicable */
  videoId?: string;
  /** The type of the media */
  type: MediaType;
}

export interface HistorySchema {
  /** The media in the history */
  media: HistoryMediaItemSchema;
  /** The type of history */
  type: HistoryType;
  /** The date of the history */
  date: string;
  /** The ID of the history */
  id: string;
}

export interface PageResponseHistorySchema {
  /** The current page of the results */
  page: number;
  /** The total number of pages of results */
  totalPages: number;
  /** The total number of results */
  totalResults: number;
  /** The items to paginate */
  results: HistorySchema[];
}

export interface PromoteUsersArgs {
  /** The user IDs to perform the bulk action on */
  userIds?: string[];
  /** The role to promote the users to */
  role?: Role;
}

export interface BulkUsersArgs {
  /** The user IDs to perform the bulk action on */
  userIds?: string[];
}

export interface BulkItemsArgs {
  /** The item IDs to perform the bulk action on */
  itemIds?: string[];
}

export interface ProfileDetailsSchema {
  /** The email of the user */
  email: string;
  /** The username of the user */
  username: string;
  /** Whether the user wants to autoplay videos */
  autoplay: boolean;
  /** Whether the user is incognito */
  incognito: boolean;
  /** Whether the user wants to inform the server of their progress */
  inform: boolean;
  /** The language of the user */
  language: string;
  /** The available languages for the user */
  availableLanguages: string[];
}

/** The use case of the auth key */
export enum AuthKeyItemSchemaCaseEnum {
  SIGNUP = "SIGNUP",
  DOWNLOAD = "DOWNLOAD",
}

/** The use case of the auth key */
export enum AuthKeyEntitySchemaUseCaseEnum {
  SIGNUP = "SIGNUP",
  DOWNLOAD = "DOWNLOAD",
}

/** The type of the public key */
export enum PublicKeyCredentialDescriptorJsonSchemaTypeEnum {
  PublicKey = "public-key",
}

/** The policy of the user for the playlist */
export enum PlaylistDetailsSchemaAccessPolicyEnum {
  DENY = "DENY",
  READ = "READ",
  WRITE = "WRITE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
}

/** The access policy assigned to the user for the playlist */
export enum SharedUserPolicyEnum {
  DENY = "DENY",
  READ = "READ",
  WRITE = "WRITE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
}

/** The type of extra */
export enum MediaExtrasSchemaTypeEnum {
  Bloopers = "Bloopers",
  Teaser = "Teaser",
  Clip = "Clip",
  Featurette = "Featurette",
  BehindTheScenes = "Behind the Scenes",
}

/** The provider to use for the storage */
export enum CreateStorageArgsDriveEnum {
  GDRIVE = "GDRIVE",
  DROPBOX = "DROPBOX",
  S3 = "S3",
  LOCAL = "LOCAL",
}

/** The type of media to filter */
export enum MediaControllerGetIdFromQueryParamsTypeEnum {
  Company = "company",
  Collection = "collection",
  Person = "person",
}
