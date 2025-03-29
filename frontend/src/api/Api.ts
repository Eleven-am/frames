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

import {
  ActivateWebAuthnParams,
  AdminAccountParams,
  ArtworkSchema,
  AuthenticationResponseValidator,
  AuthKeyEntitySchema,
  BulkItemsArgs,
  BulkUsersArgs,
  CollectionPageResponseSchema,
  CreateFrameArgs,
  CreateFromTmdbIdArgs,
  CreateGroupArgs,
  CreateMediaArgs,
  CreateOauthClientArgs,
  CreatePicksArgs,
  CreatePlaylistArgs,
  CreateStorageArgs,
  DeleteFileArgs,
  DeletePicksArgs,
  DetailedMediaSchema,
  DownloadItemSchema,
  DownloadsSchema,
  EditMediaSchema,
  EmailResponseSchema,
  EpisodeFileSchema,
  FanArtTvApiKeyParams,
  FilterGenreArgs,
  FilterMediaArgs,
  FrameCreateSchema,
  FramesGenericResponseSchema,
  FrontImagesSchema,
  GetActivityArgs,
  GetMediaSchema,
  GetPaginatedPicksArgs,
  HomeResponseContinueWatchingSchema,
  HomeResponseSlimMediaSchema,
  HttpExceptionSchema,
  IdFromQuerySchema,
  IsInListResponseSchema,
  LevenshteinMatchSchema,
  LoginParams,
  MailServerParams,
  MediaControllerGetIdFromQueryParamsTypeEnum,
  MediaResponseSchema,
  MediaType,
  MetadataSchema,
  NetworkResponseSchema,
  OauthAuthKeyBody,
  OauthClientParams,
  OauthClientSchema,
  OpenAiApiKeyParams,
  OpenSubtitlesParams,
  PageResponseAuthKeySchema,
  PageResponseFrameSchema,
  PageResponseHistorySchema,
  PageResponseOauthClientSchema,
  PageResponsePickSchema,
  PageResponsePlaylistSchema,
  PageResponseSearchedMediaSchema,
  PageResponseSlimFrontUserSchema,
  PageResponseSlimMediaSchema,
  PageResponseStorageSchema,
  PageResponseUnScannedItemSchema,
  PersonResponseSchema,
  PickCountSchema,
  PickResponseSchema,
  PickType,
  PlaybackSessionSchema,
  PlaylistDetailsSchema,
  PlaylistForMediaContextSchema,
  ProfileDetailsSchema,
  ProgressPlaybackParams,
  PromoteUsersArgs,
  PublicKeyCredentialCreationOptionsJSONSchema,
  PublicKeyCredentialRequestOptionsJSONSchema,
  Quality,
  RatingResponseSchema,
  ReadFolderSchema,
  RegisterParams,
  RegistrationResponseValidator,
  ResetPasswordByEmailParams,
  ResetPasswordParams,
  RoomResponseSchema,
  S3Params,
  SafeStorageSchema,
  SeenResponseSchema,
  SessionSchema,
  SetupConfigurationSchema,
  SharePlaylistArgs,
  SlimMediaSchema,
  SlimStorageSchema,
  StorageDetailSchema,
  SubtitleInfoSchema,
  TmdbApiKeyParams,
  TmdbMediaSchema,
  UpdateOauthClientArgs,
  UpdateOffsetSchema,
  UpdatePicksArgs,
  UpdatePlaybackInformSchema,
  UpdatePlaylistArgs,
  UpdateSetupStorageArgs,
  UpdateStorageArgs,
  UpdateUserArgs,
  UpNextDetailsSchema,
  UserMediaDetailsResponseSchema,
  UsernameParams,
} from "./data-contracts";
import { ContentType, HttpClient, RequestParams } from "./http-client";

export class Api<SecurityDataType = unknown> extends HttpClient<SecurityDataType> {
  /**
   * @description Get all auth keys for the current user
   *
   * @tags AuthKeys
   * @name AuthKeyControllerGetAuthKeys
   * @summary Get all auth keys
   * @request GET:/api/authKeys
   * @secure
   */
  authKeyControllerGetAuthKeys = (
    query: {
      /** The page number */
      page: number;
      /** The number of items per page */
      pageSize: number;
    },
    params: RequestParams = {},
  ) =>
    this.request<PageResponseAuthKeySchema, HttpExceptionSchema>({
      path: `/api/authKeys`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Create an auth key for the current user
   *
   * @tags AuthKeys
   * @name AuthKeyControllerCreateAuthKey
   * @summary Create an auth key
   * @request POST:/api/authKeys
   * @secure
   */
  authKeyControllerCreateAuthKey = (params: RequestParams = {}) =>
    this.request<AuthKeyEntitySchema, HttpExceptionSchema>({
      path: `/api/authKeys`,
      method: "POST",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Get an auth key by key, returns an authKey only if it is not revoked
   *
   * @tags AuthKeys
   * @name AuthKeyControllerFindByAuthKey
   * @summary Get an auth key by key
   * @request GET:/api/authKeys/{authKey}
   */
  authKeyControllerFindByAuthKey = (authKey: string, params: RequestParams = {}) =>
    this.request<AuthKeyEntitySchema, any>({
      path: `/api/authKeys/${authKey}`,
      method: "GET",
      format: "json",
      ...params,
    });
  /**
   * @description Logs in a user with the given credentials
   *
   * @tags Authentication
   * @name AuthControllerLogin
   * @summary Logs in a user
   * @request POST:/api/auth/login
   */
  authControllerLogin = (data: LoginParams, params: RequestParams = {}) =>
    this.request<SessionSchema | EmailResponseSchema, HttpExceptionSchema>({
      path: `/api/auth/login`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Registers a user with the given credentials
   *
   * @tags Authentication
   * @name AuthControllerRegister
   * @summary Registers a user
   * @request POST:/api/auth/register
   */
  authControllerRegister = (data: RegisterParams, params: RequestParams = {}) =>
    this.request<EmailResponseSchema, HttpExceptionSchema>({
      path: `/api/auth/register`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Verifies an email with the given token
   *
   * @tags Authentication
   * @name AuthControllerVerifyEmail
   * @summary Verifies an email
   * @request GET:/api/auth/verify-email/{token}
   */
  authControllerVerifyEmail = (token: string, params: RequestParams = {}) =>
    this.request<FramesGenericResponseSchema, HttpExceptionSchema>({
      path: `/api/auth/verify-email/${token}`,
      method: "GET",
      format: "json",
      ...params,
    });
  /**
   * @description Checks if a username is available
   *
   * @tags Authentication
   * @name AuthControllerIsUsernameAvailable
   * @summary Checks if a username is available
   * @request GET:/api/auth/is-username-available/{username}
   */
  authControllerIsUsernameAvailable = (username: string, params: RequestParams = {}) =>
    this.request<boolean, any>({
      path: `/api/auth/is-username-available/${username}`,
      method: "GET",
      format: "json",
      ...params,
    });
  /**
   * @description Checks if an email is available
   *
   * @tags Authentication
   * @name AuthControllerIsEmailAvailable
   * @summary Checks if an email is available
   * @request GET:/api/auth/is-email-available/{email}
   */
  authControllerIsEmailAvailable = (email: string, params: RequestParams = {}) =>
    this.request<boolean, HttpExceptionSchema>({
      path: `/api/auth/is-email-available/${email}`,
      method: "GET",
      format: "json",
      ...params,
    });
  /**
   * @description Checks if an email has a passkey configured
   *
   * @tags Authentication
   * @name AuthControllerIsPasskeyConfigured
   * @summary Checks if an email has a passkey configured
   * @request GET:/api/auth/is-passkey-configured/{email}
   */
  authControllerIsPasskeyConfigured = (email: string, params: RequestParams = {}) =>
    this.request<boolean, HttpExceptionSchema>({
      path: `/api/auth/is-passkey-configured/${email}`,
      method: "GET",
      format: "json",
      ...params,
    });
  /**
   * @description Sends a password reset email
   *
   * @tags Authentication
   * @name AuthControllerResetPassword
   * @summary Sends a password reset email
   * @request PATCH:/api/auth/reset-password
   */
  authControllerResetPassword = (data: ResetPasswordByEmailParams, params: RequestParams = {}) =>
    this.request<EmailResponseSchema, HttpExceptionSchema>({
      path: `/api/auth/reset-password`,
      method: "PATCH",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Resends a verification email
   *
   * @tags Authentication
   * @name AuthControllerResendVerificationEmail
   * @summary Resends a verification email
   * @request PATCH:/api/auth/resend-verification-email
   */
  authControllerResendVerificationEmail = (data: ResetPasswordByEmailParams, params: RequestParams = {}) =>
    this.request<EmailResponseSchema, HttpExceptionSchema>({
      path: `/api/auth/resend-verification-email`,
      method: "PATCH",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Confirms a password reset with the given token
   *
   * @tags Authentication
   * @name AuthControllerResetPasswordConfirm
   * @summary Confirms a password reset
   * @request POST:/api/auth/reset-password-confirm
   */
  authControllerResetPasswordConfirm = (data: ResetPasswordParams, params: RequestParams = {}) =>
    this.request<SessionSchema, HttpExceptionSchema>({
      path: `/api/auth/reset-password-confirm`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Creates a guest session
   *
   * @tags Authentication
   * @name AuthControllerCreateGuestSession
   * @summary Creates a guest session
   * @request GET:/api/auth/create-guest-session
   */
  authControllerCreateGuestSession = (params: RequestParams = {}) =>
    this.request<SessionSchema, any>({
      path: `/api/auth/create-guest-session`,
      method: "GET",
      format: "json",
      ...params,
    });
  /**
   * @description Checks if webauthn is enabled
   *
   * @tags Authentication
   * @name AuthControllerIsWebAuthnEnabled
   * @summary Checks if webauthn is enabled
   * @request GET:/api/auth/webauthn/enabled
   */
  authControllerIsWebAuthnEnabled = (params: RequestParams = {}) =>
    this.request<boolean, HttpExceptionSchema>({
      path: `/api/auth/webauthn/enabled`,
      method: "GET",
      format: "json",
      ...params,
    });
  /**
   * @description Enables webauthn
   *
   * @tags Authentication
   * @name AuthControllerEnableWebAuthn
   * @summary Enables webauthn
   * @request PATCH:/api/auth/webauthn/enabled
   */
  authControllerEnableWebAuthn = (data: ActivateWebAuthnParams, params: RequestParams = {}) =>
    this.request<boolean, HttpExceptionSchema>({
      path: `/api/auth/webauthn/enabled`,
      method: "PATCH",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Initiate a webauthn registration
   *
   * @tags Authentication
   * @name AuthControllerRegisterWebAuthn
   * @summary Initiate a webauthn registration
   * @request GET:/api/auth/webauthn/register
   */
  authControllerRegisterWebAuthn = (
    query: {
      /**
       * The email address
       * @format email
       */
      email: string;
    },
    params: RequestParams = {},
  ) =>
    this.request<PublicKeyCredentialCreationOptionsJSONSchema, HttpExceptionSchema>({
      path: `/api/auth/webauthn/register`,
      method: "GET",
      query: query,
      format: "json",
      ...params,
    });
  /**
   * @description Registers a user with the given credentials
   *
   * @tags Authentication
   * @name AuthControllerRegisterWebAuthnConfirm
   * @summary Registers a user
   * @request POST:/api/auth/webauthn/register
   */
  authControllerRegisterWebAuthnConfirm = (
    query: {
      /**
       * The email address
       * @format email
       */
      email: string;
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
    },
    data: RegistrationResponseValidator,
    params: RequestParams = {},
  ) =>
    this.request<EmailResponseSchema, HttpExceptionSchema>({
      path: `/api/auth/webauthn/register`,
      method: "POST",
      query: query,
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Registers a user with the given credentials
   *
   * @tags Authentication
   * @name AuthControllerCreateFirstPassKey
   * @summary Registers a user
   * @request POST:/api/auth/webauthn/create-first-passkey
   */
  authControllerCreateFirstPassKey = (data: RegistrationResponseValidator, params: RequestParams = {}) =>
    this.request<SessionSchema | EmailResponseSchema, HttpExceptionSchema>({
      path: `/api/auth/webauthn/create-first-passkey`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Initiate a webauthn login process
   *
   * @tags Authentication
   * @name AuthControllerLoginWebAuthn
   * @summary Initiate a webauthn login process
   * @request GET:/api/auth/webauthn/login
   */
  authControllerLoginWebAuthn = (
    query: {
      /**
       * The email address
       * @format email
       */
      email: string;
    },
    params: RequestParams = {},
  ) =>
    this.request<PublicKeyCredentialRequestOptionsJSONSchema, HttpExceptionSchema>({
      path: `/api/auth/webauthn/login`,
      method: "GET",
      query: query,
      format: "json",
      ...params,
    });
  /**
   * @description Logs in a user with the given credentials
   *
   * @tags Authentication
   * @name AuthControllerLoginWebAuthnConfirm
   * @summary Logs in a user
   * @request POST:/api/auth/webauthn/login
   */
  authControllerLoginWebAuthnConfirm = (data: AuthenticationResponseValidator, params: RequestParams = {}) =>
    this.request<SessionSchema | EmailResponseSchema, HttpExceptionSchema>({
      path: `/api/auth/webauthn/login`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Logs out a user
   *
   * @tags Authentication
   * @name AuthControllerLogout
   * @summary Logs out a user
   * @request POST:/api/auth/logout
   * @secure
   */
  authControllerLogout = (params: RequestParams = {}) =>
    this.request<FramesGenericResponseSchema, HttpExceptionSchema>({
      path: `/api/auth/logout`,
      method: "POST",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Get the current user
   *
   * @tags Authentication
   * @name AuthControllerGetCurrentUser
   * @summary Get the current user
   * @request GET:/api/auth/me
   * @secure
   */
  authControllerGetCurrentUser = (params: RequestParams = {}) =>
    this.request<SessionSchema, HttpExceptionSchema>({
      path: `/api/auth/me`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Get and redirect to the oauth url
   *
   * @tags Authentication
   * @name AuthControllerGetOauthUrl
   * @summary Get and redirect to the oauth url
   * @request GET:/api/auth/{provider}/authenticate
   */
  authControllerGetOauthUrl = (provider: string, params: RequestParams = {}) =>
    this.request<void, any>({
      path: `/api/auth/${provider}/authenticate`,
      method: "GET",
      ...params,
    });
  /**
   * @description Authenticate the user with the oauth provider
   *
   * @tags Authentication
   * @name AuthControllerGetOauthUrlCallback
   * @summary Authenticate with oauth
   * @request GET:/api/auth/{provider}/callback
   */
  authControllerGetOauthUrlCallback = (
    provider: string,
    query: {
      /** The OAuth code */
      code: string;
      /** The OAuth state */
      state: string;
    },
    params: RequestParams = {},
  ) =>
    this.request<string, HttpExceptionSchema>({
      path: `/api/auth/${provider}/callback`,
      method: "GET",
      query: query,
      format: "json",
      ...params,
    });
  /**
   * @description Validate an oauth account by providing the auth key and activation token
   *
   * @tags Authentication
   * @name AuthControllerValidateOauthAccount
   * @summary Validate an oauth account
   * @request POST:/api/auth/validate-oauth-account
   */
  authControllerValidateOauthAccount = (data: OauthAuthKeyBody, params: RequestParams = {}) =>
    this.request<SessionSchema, HttpExceptionSchema>({
      path: `/api/auth/validate-oauth-account`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Create an oauth client
   *
   * @tags Oauth
   * @name OauthControllerCreateOauth
   * @summary Create an oauth client
   * @request POST:/api/oauth
   * @secure
   */
  oauthControllerCreateOauth = (data: CreateOauthClientArgs, params: RequestParams = {}) =>
    this.request<OauthClientSchema, HttpExceptionSchema>({
      path: `/api/oauth`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Get all OAUTH clients the current user has access to
   *
   * @tags Oauth
   * @name OauthControllerFindAll
   * @summary Get all OAUTH clients
   * @request GET:/api/oauth
   */
  oauthControllerFindAll = (
    query: {
      /** The page number */
      page: number;
      /** The number of items per page */
      pageSize: number;
    },
    params: RequestParams = {},
  ) =>
    this.request<PageResponseOauthClientSchema, HttpExceptionSchema>({
      path: `/api/oauth`,
      method: "GET",
      query: query,
      format: "json",
      ...params,
    });
  /**
   * @description Get an OAUTH client by ID
   *
   * @tags Oauth
   * @name OauthControllerFindOne
   * @summary Get an OAUTH client by ID
   * @request GET:/api/oauth/{oauthId}
   * @secure
   */
  oauthControllerFindOne = (oauthId: string, params: RequestParams = {}) =>
    this.request<OauthClientSchema, HttpExceptionSchema>({
      path: `/api/oauth/${oauthId}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Update an oauth client
   *
   * @tags Oauth
   * @name OauthControllerUpdateOauth
   * @summary Update an oauth client
   * @request PATCH:/api/oauth/{oauthId}
   * @secure
   */
  oauthControllerUpdateOauth = (oauthId: string, data: UpdateOauthClientArgs, params: RequestParams = {}) =>
    this.request<OauthClientSchema, HttpExceptionSchema>({
      path: `/api/oauth/${oauthId}`,
      method: "PATCH",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Delete an oauth client
   *
   * @tags Oauth
   * @name OauthControllerDeleteOauth
   * @summary Delete an oauth client
   * @request DELETE:/api/oauth/{oauthId}
   * @secure
   */
  oauthControllerDeleteOauth = (oauthId: string, params: RequestParams = {}) =>
    this.request<FramesGenericResponseSchema, HttpExceptionSchema>({
      path: `/api/oauth/${oauthId}`,
      method: "DELETE",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Get all downloads
   *
   * @tags Downloads
   * @name DownloadsControllerGetAll
   * @summary Get all downloads
   * @request GET:/api/downloads
   * @secure
   */
  downloadsControllerGetAll = (params: RequestParams = {}) =>
    this.request<DownloadItemSchema[], HttpExceptionSchema>({
      path: `/api/downloads`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Downloads a file using the download id, valid for 2 hours
   *
   * @tags Downloads
   * @name DownloadsControllerDownload
   * @summary Downloads a file
   * @request GET:/api/downloads/{downloadId}
   * @secure
   */
  downloadsControllerDownload = (downloadId: string, params: RequestParams = {}) =>
    this.request<File, HttpExceptionSchema>({
      path: `/api/downloads/${downloadId}`,
      method: "GET",
      secure: true,
      ...params,
    });
  /**
   * @description Create download for a playback session using an auth key
   *
   * @tags Downloads
   * @name DownloadsControllerCreate
   * @summary Create a download url
   * @request POST:/api/downloads/{playbackId}/{authKey}
   * @secure
   */
  downloadsControllerCreate = (authKey: string, playbackId: string, params: RequestParams = {}) =>
    this.request<DownloadsSchema, HttpExceptionSchema>({
      path: `/api/downloads/${playbackId}/${authKey}`,
      method: "POST",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Create a frame with the percentage of the current video
   *
   * @tags Frames
   * @name FramesControllerCreateFrame
   * @summary Create a frame
   * @request POST:/api/frames/{playbackId}
   * @secure
   */
  framesControllerCreateFrame = (playbackId: string, data: CreateFrameArgs, params: RequestParams = {}) =>
    this.request<FrameCreateSchema, HttpExceptionSchema>({
      path: `/api/frames/${playbackId}`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Get a list of frames a user has created
   *
   * @tags Frames
   * @name FramesControllerGetFrames
   * @summary Get frames
   * @request GET:/api/frames
   * @secure
   */
  framesControllerGetFrames = (
    query: {
      /** The page number */
      page: number;
      /** The number of items per page */
      pageSize: number;
    },
    params: RequestParams = {},
  ) =>
    this.request<PageResponseFrameSchema, HttpExceptionSchema>({
      path: `/api/frames`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Delete a frame the current user has created
   *
   * @tags Frames
   * @name FramesControllerDeleteFrame
   * @summary Delete a frame
   * @request DELETE:/api/frames/{cypher}
   * @secure
   */
  framesControllerDeleteFrame = (cypher: string, params: RequestParams = {}) =>
    this.request<FramesGenericResponseSchema, HttpExceptionSchema>({
      path: `/api/frames/${cypher}`,
      method: "DELETE",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Get a frame by its cypher
   *
   * @tags Frames
   * @name FramesControllerGetFrame
   * @summary Get a frame
   * @request GET:/api/frames/{cypher}
   * @secure
   */
  framesControllerGetFrame = (cypher: string, params: RequestParams = {}) =>
    this.request<PlaybackSessionSchema, HttpExceptionSchema>({
      path: `/api/frames/${cypher}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Groups
   * @name GroupsControllerCreate
   * @request POST:/api/groups
   */
  groupsControllerCreate = (data: CreateGroupArgs, params: RequestParams = {}) =>
    this.request<void, any>({
      path: `/api/groups`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });
  /**
   * No description
   *
   * @tags Groups
   * @name GroupsControllerFindAll
   * @request GET:/api/groups
   */
  groupsControllerFindAll = (params: RequestParams = {}) =>
    this.request<void, any>({
      path: `/api/groups`,
      method: "GET",
      ...params,
    });
  /**
   * No description
   *
   * @tags Groups
   * @name GroupsControllerRemove
   * @request DELETE:/api/groups/{id}
   */
  groupsControllerRemove = (id: string, params: RequestParams = {}) =>
    this.request<void, any>({
      path: `/api/groups/${id}`,
      method: "DELETE",
      ...params,
    });
  /**
   * @description Get a list of media items the current user has added to their list
   *
   * @tags Lists
   * @name ListsControllerGetLists
   * @summary Get the lists for the current user
   * @request GET:/api/lists
   * @secure
   */
  listsControllerGetLists = (params: RequestParams = {}) =>
    this.request<HomeResponseSlimMediaSchema, HttpExceptionSchema>({
      path: `/api/lists`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Get a list of media items the current user has added to their list. This includes additional information they view on the list page
   *
   * @tags Lists
   * @name ListsControllerGetListsPage
   * @summary Get the lists for the current user with additional information
   * @request GET:/api/lists/page
   * @secure
   */
  listsControllerGetListsPage = (params: RequestParams = {}) =>
    this.request<DetailedMediaSchema[], HttpExceptionSchema>({
      path: `/api/lists/page`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Plays all the media items in the current user list
   *
   * @tags Lists
   * @name ListsControllerPlayMyList
   * @summary Plays all the media items in the list
   * @request GET:/api/lists/play
   * @secure
   */
  listsControllerPlayMyList = (
    query?: {
      /** Whether to play the list in shuffle mode */
      shuffle?: boolean;
    },
    params: RequestParams = {},
  ) =>
    this.request<PlaybackSessionSchema, HttpExceptionSchema>({
      path: `/api/lists/play`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Add a media item to the current user list
   *
   * @tags Lists
   * @name ListsControllerAddToList
   * @summary Add a media item to the list
   * @request PUT:/api/lists/add/{mediaId}
   * @secure
   */
  listsControllerAddToList = (mediaId: string, params: RequestParams = {}) =>
    this.request<IsInListResponseSchema, HttpExceptionSchema>({
      path: `/api/lists/add/${mediaId}`,
      method: "PUT",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Remove a media item from the current user list
   *
   * @tags Lists
   * @name ListsControllerRemoveFromList
   * @summary Remove a media item from the list
   * @request DELETE:/api/lists/remove/{mediaId}
   * @secure
   */
  listsControllerRemoveFromList = (mediaId: string, params: RequestParams = {}) =>
    this.request<IsInListResponseSchema, HttpExceptionSchema>({
      path: `/api/lists/remove/${mediaId}`,
      method: "DELETE",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Check if a media item is in the current user list
   *
   * @tags Lists
   * @name ListsControllerCheckList
   * @summary Check if a media item is in the list
   * @request GET:/api/lists/{mediaId}
   * @secure
   */
  listsControllerCheckList = (mediaId: string, params: RequestParams = {}) =>
    this.request<IsInListResponseSchema, HttpExceptionSchema>({
      path: `/api/lists/${mediaId}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Create a new playlist with the given details and return the new playlist object
   *
   * @tags Playlists
   * @name PlaylistsControllerCreatePlaylist
   * @summary Create a new playlist
   * @request POST:/api/playlists
   * @secure
   */
  playlistsControllerCreatePlaylist = (data: CreatePlaylistArgs, params: RequestParams = {}) =>
    this.request<PlaylistDetailsSchema, HttpExceptionSchema>({
      path: `/api/playlists`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Get all playlists the current user has access to
   *
   * @tags Playlists
   * @name PlaylistsControllerGetPlaylists
   * @summary Get all playlists
   * @request GET:/api/playlists
   * @secure
   */
  playlistsControllerGetPlaylists = (
    query: {
      /** The page number */
      page: number;
      /** The number of items per page */
      pageSize: number;
    },
    params: RequestParams = {},
  ) =>
    this.request<PageResponsePlaylistSchema, HttpExceptionSchema>({
      path: `/api/playlists`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Get the count of all playlists the current user has created
   *
   * @tags Playlists
   * @name PlaylistsControllerGetPlaylistsCount
   * @summary Get all playlists count
   * @request GET:/api/playlists/count
   * @secure
   */
  playlistsControllerGetPlaylistsCount = (params: RequestParams = {}) =>
    this.request<
      {
        count: number;
      },
      HttpExceptionSchema
    >({
      path: `/api/playlists/count`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Get all public playlists
   *
   * @tags Playlists
   * @name PlaylistsControllerGetPublicPlaylists
   * @summary Get public playlists
   * @request GET:/api/playlists/public
   * @secure
   */
  playlistsControllerGetPublicPlaylists = (
    query: {
      /** The page number */
      page: number;
      /** The number of items per page */
      pageSize: number;
    },
    params: RequestParams = {},
  ) =>
    this.request<PageResponsePlaylistSchema, HttpExceptionSchema>({
      path: `/api/playlists/public`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Update details of a playlist with the given Id
   *
   * @tags Playlists
   * @name PlaylistsControllerUpdatePlaylist
   * @summary Update a playlist
   * @request PATCH:/api/playlists/{playlistId}
   * @secure
   */
  playlistsControllerUpdatePlaylist = (playlistId: string, data: UpdatePlaylistArgs, params: RequestParams = {}) =>
    this.request<PlaylistDetailsSchema, HttpExceptionSchema>({
      path: `/api/playlists/${playlistId}`,
      method: "PATCH",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Get details of a playlist with the given Id
   *
   * @tags Playlists
   * @name PlaylistsControllerGetPlaylist
   * @summary Get a playlist
   * @request GET:/api/playlists/{playlistId}
   * @secure
   */
  playlistsControllerGetPlaylist = (playlistId: string, params: RequestParams = {}) =>
    this.request<PlaylistDetailsSchema, HttpExceptionSchema>({
      path: `/api/playlists/${playlistId}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Delete a playlist with the given Id
   *
   * @tags Playlists
   * @name PlaylistsControllerDeletePlaylist
   * @summary Delete a playlist
   * @request DELETE:/api/playlists/{playlistId}
   * @secure
   */
  playlistsControllerDeletePlaylist = (playlistId: string, params: RequestParams = {}) =>
    this.request<FramesGenericResponseSchema, HttpExceptionSchema>({
      path: `/api/playlists/${playlistId}`,
      method: "DELETE",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Get all playlists that contain the given media
   *
   * @tags Playlists
   * @name PlaylistsControllerGetPlaylistsForMedia
   * @summary Get playlists for media
   * @request GET:/api/playlists/media/{mediaId}
   * @secure
   */
  playlistsControllerGetPlaylistsForMedia = (
    mediaId: string,
    query?: {
      /** Check the playlists for the given videoId */
      videoId?: string;
    },
    params: RequestParams = {},
  ) =>
    this.request<PlaylistForMediaContextSchema[], HttpExceptionSchema>({
      path: `/api/playlists/media/${mediaId}`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Add the given media to the given playlist
   *
   * @tags Playlists
   * @name PlaylistsControllerAddMediaToPlaylist
   * @summary Add media to playlist
   * @request PATCH:/api/playlists/media/{playlistId}/{mediaId}
   * @secure
   */
  playlistsControllerAddMediaToPlaylist = (playlistId: string, mediaId: string, params: RequestParams = {}) =>
    this.request<PlaylistDetailsSchema, HttpExceptionSchema>({
      path: `/api/playlists/media/${playlistId}/${mediaId}`,
      method: "PATCH",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Remove the given media from the given playlist
   *
   * @tags Playlists
   * @name PlaylistsControllerRemoveMediaFromPlaylist
   * @summary Remove media from playlist
   * @request DELETE:/api/playlists/media/{playlistId}/{mediaId}
   * @secure
   */
  playlistsControllerRemoveMediaFromPlaylist = (playlistId: string, mediaId: string, params: RequestParams = {}) =>
    this.request<PlaylistDetailsSchema, HttpExceptionSchema>({
      path: `/api/playlists/media/${playlistId}/${mediaId}`,
      method: "DELETE",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Share a playlist with the given email addresses
   *
   * @tags Playlists
   * @name PlaylistsControllerSharePlaylist
   * @summary Share a playlist
   * @request PATCH:/api/playlists/share/{playlistId}
   * @secure
   */
  playlistsControllerSharePlaylist = (playlistId: string, data: SharePlaylistArgs, params: RequestParams = {}) =>
    this.request<FramesGenericResponseSchema, HttpExceptionSchema>({
      path: `/api/playlists/share/${playlistId}`,
      method: "PATCH",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description UnShare a playlist with the given email addresses
   *
   * @tags Playlists
   * @name PlaylistsControllerUnSharePlaylist
   * @summary UnShare a playlist
   * @request DELETE:/api/playlists/share/{playlistId}
   * @secure
   */
  playlistsControllerUnSharePlaylist = (playlistId: string, data: SharePlaylistArgs, params: RequestParams = {}) =>
    this.request<FramesGenericResponseSchema, HttpExceptionSchema>({
      path: `/api/playlists/share/${playlistId}`,
      method: "DELETE",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Play the given playlist and return a playback session
   *
   * @tags Playlists
   * @name PlaylistsControllerPlayPlaylist
   * @summary Play playlist
   * @request GET:/api/playlists/play/{playlistId}
   * @secure
   */
  playlistsControllerPlayPlaylist = (playlistId: string, params: RequestParams = {}) =>
    this.request<PlaybackSessionSchema, HttpExceptionSchema>({
      path: `/api/playlists/play/${playlistId}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Play the given playlist video and return a playback session
   *
   * @tags Playlists
   * @name PlaylistsControllerPlayPlaylistVideo
   * @summary Play playlist video
   * @request GET:/api/playlists/play-video/{playlistVideoId}
   * @secure
   */
  playlistsControllerPlayPlaylistVideo = (playlistVideoId: string, params: RequestParams = {}) =>
    this.request<PlaybackSessionSchema, HttpExceptionSchema>({
      path: `/api/playlists/play-video/${playlistVideoId}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Shuffle the given media and return a new playback session of the first video in the playlist
   *
   * @tags Playlists
   * @name PlaylistsControllerShuffleMedia
   * @summary Shuffle media
   * @request GET:/api/playlists/shuffle/media/{mediaId}
   * @secure
   */
  playlistsControllerShuffleMedia = (mediaId: string, params: RequestParams = {}) =>
    this.request<PlaybackSessionSchema, HttpExceptionSchema>({
      path: `/api/playlists/shuffle/media/${mediaId}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Shuffle the given playlist and return a playback session of the first video in the playlist
   *
   * @tags Playlists
   * @name PlaylistsControllerShufflePlaylist
   * @summary Shuffle playlist
   * @request GET:/api/playlists/shuffle/playlist/{playlistId}
   * @secure
   */
  playlistsControllerShufflePlaylist = (playlistId: string, params: RequestParams = {}) =>
    this.request<PlaybackSessionSchema, HttpExceptionSchema>({
      path: `/api/playlists/shuffle/playlist/${playlistId}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Shuffle the given company and return a playback session of the first video in the playlist
   *
   * @tags Playlists
   * @name PlaylistsControllerShuffleCompany
   * @summary Shuffle company
   * @request GET:/api/playlists/shuffle/company/{companyId}
   * @secure
   */
  playlistsControllerShuffleCompany = (companyId: string, params: RequestParams = {}) =>
    this.request<PlaybackSessionSchema, HttpExceptionSchema>({
      path: `/api/playlists/shuffle/company/${companyId}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Shuffle the given person and return a playback session of the first video in the playlist
   *
   * @tags Playlists
   * @name PlaylistsControllerShufflePerson
   * @summary Shuffle person
   * @request GET:/api/playlists/shuffle/person/{personId}
   * @secure
   */
  playlistsControllerShufflePerson = (personId: string, params: RequestParams = {}) =>
    this.request<PlaybackSessionSchema, HttpExceptionSchema>({
      path: `/api/playlists/shuffle/person/${personId}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Get the trending media for the home screen
   *
   * @tags Media
   * @name MediaControllerGetTrendingHomeScreen
   * @summary Get trending media
   * @request GET:/api/media/trending
   * @secure
   */
  mediaControllerGetTrendingHomeScreen = (params: RequestParams = {}) =>
    this.request<HomeResponseSlimMediaSchema, HttpExceptionSchema>({
      path: `/api/media/trending`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Get the popular media for the home screen
   *
   * @tags Media
   * @name MediaControllerGetPopularHomeScreen
   * @summary Get popular media
   * @request GET:/api/media/popular
   * @secure
   */
  mediaControllerGetPopularHomeScreen = (params: RequestParams = {}) =>
    this.request<HomeResponseSlimMediaSchema, HttpExceptionSchema>({
      path: `/api/media/popular`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Get the top rated media for the home screen
   *
   * @tags Media
   * @name MediaControllerGetTopRatedHomeScreen
   * @summary Get top rated media
   * @request GET:/api/media/top-rated
   * @secure
   */
  mediaControllerGetTopRatedHomeScreen = (params: RequestParams = {}) =>
    this.request<HomeResponseSlimMediaSchema, HttpExceptionSchema>({
      path: `/api/media/top-rated`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Get the media airing today for the home screen
   *
   * @tags Media
   * @name MediaControllerGetAiringTodayHomeScreen
   * @summary Get media airing today
   * @request GET:/api/media/airing-today
   * @secure
   */
  mediaControllerGetAiringTodayHomeScreen = (params: RequestParams = {}) =>
    this.request<HomeResponseSlimMediaSchema, HttpExceptionSchema>({
      path: `/api/media/airing-today`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Get the media now playing for the home screen
   *
   * @tags Media
   * @name MediaControllerGetNowPlayingHomeScreen
   * @summary Get media now playing
   * @request GET:/api/media/now-playing
   * @secure
   */
  mediaControllerGetNowPlayingHomeScreen = (params: RequestParams = {}) =>
    this.request<HomeResponseSlimMediaSchema, HttpExceptionSchema>({
      path: `/api/media/now-playing`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Search for media by title, cast or crew members or even vectors
   *
   * @tags Media
   * @name MediaControllerSearchMedia
   * @summary Search media
   * @request GET:/api/media/search
   * @secure
   */
  mediaControllerSearchMedia = (
    query: {
      /** The page number */
      page: number;
      /** The number of items per page */
      pageSize: number;
      /** The search query */
      query: string;
    },
    params: RequestParams = {},
  ) =>
    this.request<PageResponseSlimMediaSchema, HttpExceptionSchema>({
      path: `/api/media/search`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Fuzzy search for media by title
   *
   * @tags Media
   * @name MediaControllerFuzzySearch
   * @summary Fuzzy search media
   * @request GET:/api/media/fuzzy-search
   * @secure
   */
  mediaControllerFuzzySearch = (
    query: {
      query: string;
    },
    params: RequestParams = {},
  ) =>
    this.request<LevenshteinMatchSchema[], HttpExceptionSchema>({
      path: `/api/media/fuzzy-search`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Return the id of the media item that matches the query
   *
   * @tags Media
   * @name MediaControllerGetIdFromQuery
   * @summary Get id from query
   * @request GET:/api/media/idFromQuery
   * @secure
   */
  mediaControllerGetIdFromQuery = (
    query: {
      /** The search query */
      query: string;
      /** The type of media to filter */
      type: MediaControllerGetIdFromQueryParamsTypeEnum;
    },
    params: RequestParams = {},
  ) =>
    this.request<IdFromQuerySchema, HttpExceptionSchema>({
      path: `/api/media/idFromQuery`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Get the genres of media items
   *
   * @tags Media
   * @name MediaControllerFilterGenres
   * @summary Get media genres
   * @request POST:/api/media/genres
   * @secure
   */
  mediaControllerFilterGenres = (data: FilterGenreArgs, params: RequestParams = {}) =>
    this.request<string[], HttpExceptionSchema>({
      path: `/api/media/genres`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Filter media by type, genre and decade
   *
   * @tags Media
   * @name MediaControllerFilterMedia
   * @summary Filter media
   * @request POST:/api/media/filter
   * @secure
   */
  mediaControllerFilterMedia = (data: FilterMediaArgs, params: RequestParams = {}) =>
    this.request<PageResponseSlimMediaSchema, HttpExceptionSchema>({
      path: `/api/media/filter`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Get the recommended media for the home screen
   *
   * @tags Media
   * @name MediaControllerGetRecommendedHomeScreen
   * @summary Get recommended media
   * @request GET:/api/media/recommended
   * @secure
   */
  mediaControllerGetRecommendedHomeScreen = (params: RequestParams = {}) =>
    this.request<HomeResponseSlimMediaSchema, HttpExceptionSchema>({
      path: `/api/media/recommended`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Get the company by id
   *
   * @tags Media
   * @name MediaControllerGetCompanyById
   * @summary Get company
   * @request GET:/api/media/company/{companyId}
   * @secure
   */
  mediaControllerGetCompanyById = (companyId: string, params: RequestParams = {}) =>
    this.request<NetworkResponseSchema, HttpExceptionSchema>({
      path: `/api/media/company/${companyId}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Get the person by id
   *
   * @tags Media
   * @name MediaControllerGetPersonById
   * @summary Get person
   * @request GET:/api/media/person/{personId}
   * @secure
   */
  mediaControllerGetPersonById = (personId: string, params: RequestParams = {}) =>
    this.request<PersonResponseSchema, HttpExceptionSchema>({
      path: `/api/media/person/${personId}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Get the collection by id
   *
   * @tags Media
   * @name MediaControllerGetCollectionById
   * @summary Get collection
   * @request GET:/api/media/collection/{collectionId}
   * @secure
   */
  mediaControllerGetCollectionById = (collectionId: string, params: RequestParams = {}) =>
    this.request<CollectionPageResponseSchema, HttpExceptionSchema>({
      path: `/api/media/collection/${collectionId}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Get the trending banner for the home screen
   *
   * @tags Media
   * @name MediaControllerGetTrendingBanner
   * @summary Get trending banner
   * @request GET:/api/media/trending-banner
   * @secure
   */
  mediaControllerGetTrendingBanner = (params: RequestParams = {}) =>
    this.request<DetailedMediaSchema[], HttpExceptionSchema>({
      path: `/api/media/trending-banner`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Get the videos of media items
   *
   * @tags Media
   * @name MediaControllerSearchMediaWithVideos
   * @summary Get media videos
   * @request GET:/api/media/videos
   * @secure
   */
  mediaControllerSearchMediaWithVideos = (
    query: {
      /** The page number */
      page: number;
      /** The number of items per page */
      pageSize: number;
      /** The search query */
      query: string;
    },
    params: RequestParams = {},
  ) =>
    this.request<PageResponseSearchedMediaSchema, HttpExceptionSchema>({
      path: `/api/media/videos`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Get the decades of media items
   *
   * @tags Media
   * @name MediaControllerGetDecades
   * @summary Get media decades
   * @request GET:/api/media/decades
   * @secure
   */
  mediaControllerGetDecades = (
    query: {
      /** The type of media to filter */
      type: MediaType;
    },
    params: RequestParams = {},
  ) =>
    this.request<number[], HttpExceptionSchema>({
      path: `/api/media/decades`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Get the recently added media for the home screen
   *
   * @tags Media
   * @name MediaControllerGetRecentlyAddedHomeScreen
   * @summary Get recently added media
   * @request GET:/api/media/recently-added
   * @secure
   */
  mediaControllerGetRecentlyAddedHomeScreen = (params: RequestParams = {}) =>
    this.request<HomeResponseSlimMediaSchema, HttpExceptionSchema>({
      path: `/api/media/recently-added`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Get the trending media for the app by type
   *
   * @tags Media
   * @name MediaControllerGetTrendingMediaByType
   * @summary Get trending media by type
   * @request GET:/api/media/trending/{type}
   * @secure
   */
  mediaControllerGetTrendingMediaByType = (type: MediaType, params: RequestParams = {}) =>
    this.request<SlimMediaSchema[], HttpExceptionSchema>({
      path: `/api/media/trending/${type}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Get the trending media for display within the app, requires no authentication
   *
   * @tags Media
   * @name MediaControllerGetTrending
   * @summary Get trending media
   * @request GET:/api/media/trending-open
   */
  mediaControllerGetTrending = (params: RequestParams = {}) =>
    this.request<SlimMediaSchema[], any>({
      path: `/api/media/trending-open`,
      method: "GET",
      format: "json",
      ...params,
    });
  /**
   * @description Get a detailed media object by id in the chosen language of the user
   *
   * @tags Media
   * @name MediaControllerGetMediaById
   * @summary Get a detailed media object by id
   * @request GET:/api/media/{mediaId}
   * @secure
   */
  mediaControllerGetMediaById = (mediaId: string, params: RequestParams = {}) =>
    this.request<MediaResponseSchema, HttpExceptionSchema>({
      path: `/api/media/${mediaId}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Play a media item by id
   *
   * @tags Media
   * @name MediaControllerPlayMediaById
   * @summary Play a media item
   * @request GET:/api/media/play/{mediaId}
   * @secure
   */
  mediaControllerPlayMediaById = (mediaId: string, params: RequestParams = {}) =>
    this.request<PlaybackSessionSchema, HttpExceptionSchema>({
      path: `/api/media/play/${mediaId}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Play a media item episode by id
   *
   * @tags Media
   * @name MediaControllerPlayMediaEpisodeById
   * @summary Play a media item episode
   * @request GET:/api/media/play-episode/{episodeId}
   * @secure
   */
  mediaControllerPlayMediaEpisodeById = (
    episodeId: string,
    query: {
      /** Whether to reset the episode's progress */
      reset: boolean;
    },
    params: RequestParams = {},
  ) =>
    this.request<PlaybackSessionSchema, HttpExceptionSchema>({
      path: `/api/media/play-episode/${episodeId}`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Create a new pick category
   *
   * @tags Picks
   * @name PicksControllerCreatePickCategory
   * @summary Create a new pick category
   * @request POST:/api/picks
   * @secure
   */
  picksControllerCreatePickCategory = (data: CreatePicksArgs, params: RequestParams = {}) =>
    this.request<PickResponseSchema, HttpExceptionSchema>({
      path: `/api/picks`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Get all picks
   *
   * @tags Picks
   * @name PicksControllerGetPicks
   * @summary Get all picks
   * @request PATCH:/api/picks
   */
  picksControllerGetPicks = (data: GetPaginatedPicksArgs, params: RequestParams = {}) =>
    this.request<PageResponsePickSchema, any>({
      path: `/api/picks`,
      method: "PATCH",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Delete the picks for a given list of categories
   *
   * @tags Picks
   * @name PicksControllerDeletePicks
   * @summary Delete the picks for a list of categories
   * @request DELETE:/api/picks
   * @secure
   */
  picksControllerDeletePicks = (data: DeletePicksArgs, params: RequestParams = {}) =>
    this.request<FramesGenericResponseSchema, HttpExceptionSchema>({
      path: `/api/picks`,
      method: "DELETE",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Get a list of picks for a given index and type
   *
   * @tags Picks
   * @name PicksControllerGetPicksByIndex
   * @summary Get the picks for a given index and type
   * @request GET:/api/picks/index
   * @secure
   */
  picksControllerGetPicksByIndex = (
    query: {
      /** The index of the pick */
      index: number;
      /** The type of pick, changes the way it is displayed */
      type: PickType;
    },
    params: RequestParams = {},
  ) =>
    this.request<HomeResponseSlimMediaSchema, HttpExceptionSchema>({
      path: `/api/picks/index`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Get the count of picks for the editor and basic picks
   *
   * @tags Picks
   * @name PicksControllerGetPicksCount
   * @summary Get the count of picks
   * @request GET:/api/picks/count
   * @secure
   */
  picksControllerGetPicksCount = (params: RequestParams = {}) =>
    this.request<PickCountSchema, HttpExceptionSchema>({
      path: `/api/picks/count`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Get the trending picks
   *
   * @tags Picks
   * @name PicksControllerGetSelectedTrending
   * @summary Get the trending picks
   * @request GET:/api/picks/trending
   * @secure
   */
  picksControllerGetSelectedTrending = (params: RequestParams = {}) =>
    this.request<SlimMediaSchema, HttpExceptionSchema>({
      path: `/api/picks/trending`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Update the details for a given pick category
   *
   * @tags Picks
   * @name PicksControllerUpdatePickCategory
   * @summary Update the picks for a category
   * @request PATCH:/api/picks/{categoryId}
   * @secure
   */
  picksControllerUpdatePickCategory = (categoryId: string, data: UpdatePicksArgs, params: RequestParams = {}) =>
    this.request<PickResponseSchema, HttpExceptionSchema>({
      path: `/api/picks/${categoryId}`,
      method: "PATCH",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Get a pick category by id
   *
   * @tags Picks
   * @name PicksControllerGetPickCategory
   * @summary Get a pick category
   * @request GET:/api/picks/{categoryId}
   * @secure
   */
  picksControllerGetPickCategory = (categoryId: string, params: RequestParams = {}) =>
    this.request<PickResponseSchema, HttpExceptionSchema>({
      path: `/api/picks/${categoryId}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Add a media item to trending picks
   *
   * @tags Picks
   * @name PicksControllerAddMediaToTrendingPicks
   * @summary Add a media item to trending picks
   * @request PATCH:/api/picks/trending/{mediaId}
   * @secure
   */
  picksControllerAddMediaToTrendingPicks = (mediaId: string, params: RequestParams = {}) =>
    this.request<PickResponseSchema, HttpExceptionSchema>({
      path: `/api/picks/trending/${mediaId}`,
      method: "PATCH",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Get the next video to play based on the current playback session
   *
   * @tags Playback
   * @name PlaybackControllerGetUpNext
   * @summary Get the next video to play
   * @request GET:/api/playback/{playbackId}
   * @secure
   */
  playbackControllerGetUpNext = (playbackId: string, params: RequestParams = {}) =>
    this.request<UpNextDetailsSchema, HttpExceptionSchema>({
      path: `/api/playback/${playbackId}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Update the playback progress for the current session
   *
   * @tags Playback
   * @name PlaybackControllerSaveInformation
   * @summary Update the playback progress
   * @request PATCH:/api/playback/{playbackId}
   * @secure
   */
  playbackControllerSaveInformation = (playbackId: string, data: ProgressPlaybackParams, params: RequestParams = {}) =>
    this.request<FramesGenericResponseSchema, HttpExceptionSchema>({
      path: `/api/playback/${playbackId}`,
      method: "PATCH",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Create a new session from a playback
   *
   * @tags Playback
   * @name PlaybackControllerCreateNewSession
   * @summary Create a new session from a playback
   * @request POST:/api/playback/{playbackId}
   * @secure
   */
  playbackControllerCreateNewSession = (playbackId: string, params: RequestParams = {}) =>
    this.request<PlaybackSessionSchema, HttpExceptionSchema>({
      path: `/api/playback/${playbackId}`,
      method: "POST",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Update the inform status for the current session
   *
   * @tags Playback
   * @name PlaybackControllerUpdateInform
   * @summary Update the inform status
   * @request PATCH:/api/playback/inform/{playbackId}
   * @secure
   */
  playbackControllerUpdateInform = (playbackId: string, data: UpdatePlaybackInformSchema, params: RequestParams = {}) =>
    this.request<FramesGenericResponseSchema, HttpExceptionSchema>({
      path: `/api/playback/inform/${playbackId}`,
      method: "PATCH",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Remove a video from the watch history of the current user
   *
   * @tags Playback
   * @name PlaybackControllerDeleteVideo
   * @summary Remove a video from the watch history
   * @request DELETE:/api/playback/{videoId}
   * @secure
   */
  playbackControllerDeleteVideo = (videoId: string, params: RequestParams = {}) =>
    this.request<FramesGenericResponseSchema, HttpExceptionSchema>({
      path: `/api/playback/${videoId}`,
      method: "DELETE",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Add a video from the watch history of the current user
   *
   * @tags Playback
   * @name PlaybackControllerAddVideo
   * @summary Add a video from the watch history
   * @request POST:/api/playback/{videoId}
   * @secure
   */
  playbackControllerAddVideo = (videoId: string, params: RequestParams = {}) =>
    this.request<FramesGenericResponseSchema, HttpExceptionSchema>({
      path: `/api/playback/${videoId}`,
      method: "POST",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Start a video playback for the current user
   *
   * @tags Playback
   * @name PlaybackControllerStartPlayback
   * @summary Start a video playback
   * @request POST:/api/playback/play-video/{videoId}
   * @secure
   */
  playbackControllerStartPlayback = (videoId: string, params: RequestParams = {}) =>
    this.request<PlaybackSessionSchema, HttpExceptionSchema>({
      path: `/api/playback/play-video/${videoId}`,
      method: "POST",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Get a list of thumbnails for the requested stream
   *
   * @tags Stream
   * @name StreamControllerGetThumbnails
   * @summary Get a list of thumbnails
   * @request GET:/api/stream/thumbnail/{playbackId}
   * @secure
   */
  streamControllerGetThumbnails = (playbackId: string, params: RequestParams = {}) =>
    this.request<ArtworkSchema[], HttpExceptionSchema>({
      path: `/api/stream/thumbnail/${playbackId}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Creates the multi variant playlist for the video
   *
   * @tags Stream
   * @name StreamControllerGetMultiVariantPlaylist
   * @summary Creates the multi variant playlist
   * @request GET:/api/stream/{playbackId}/playlist.m3u8
   * @secure
   */
  streamControllerGetMultiVariantPlaylist = (playbackId: string, params: RequestParams = {}) =>
    this.request<File, HttpExceptionSchema>({
      path: `/api/stream/${playbackId}/playlist.m3u8`,
      method: "GET",
      secure: true,
      ...params,
    });
  /**
   * @description Creates the single quality playlist for the video
   *
   * @tags Stream
   * @name StreamControllerGetSingleVariantPlaylist
   * @summary Creates the single quality playlist
   * @request GET:/api/stream/{streamId}/{quality}/playlist.m3u8
   * @secure
   */
  streamControllerGetSingleVariantPlaylist = (streamId: string, quality: Quality, params: RequestParams = {}) =>
    this.request<File, HttpExceptionSchema>({
      path: `/api/stream/${streamId}/${quality}/playlist.m3u8`,
      method: "GET",
      secure: true,
      ...params,
    });
  /**
   * @description Stream a single segment of the video
   *
   * @tags Stream
   * @name StreamControllerGetSegment
   * @summary Stream a single segment
   * @request GET:/api/stream/{streamId}/{quality}/{segment}
   * @secure
   */
  streamControllerGetSegment = (segment: string, streamId: string, quality: Quality, params: RequestParams = {}) =>
    this.request<File, HttpExceptionSchema>({
      path: `/api/stream/${streamId}/${quality}/${segment}`,
      method: "GET",
      secure: true,
      ...params,
    });
  /**
   * @description Stream a video using the playback id
   *
   * @tags Stream
   * @name StreamControllerStreamVideo
   * @summary Stream a video
   * @request GET:/api/stream/{playbackId}
   * @secure
   */
  streamControllerStreamVideo = (playbackId: string, params: RequestParams = {}) =>
    this.request<File, HttpExceptionSchema>({
      path: `/api/stream/${playbackId}`,
      method: "GET",
      secure: true,
      ...params,
    });
  /**
   * @description Get a list of media items the current user has rated positively
   *
   * @tags Rating
   * @name RatingControllerFindAll
   * @summary Get the ratings for the current user
   * @request GET:/api/rating
   * @secure
   */
  ratingControllerFindAll = (params: RequestParams = {}) =>
    this.request<HomeResponseSlimMediaSchema, HttpExceptionSchema>({
      path: `/api/rating`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Get the rating for a media item
   *
   * @tags Rating
   * @name RatingControllerFindOne
   * @summary Get the rating for a media item
   * @request GET:/api/rating/{mediaId}
   * @secure
   */
  ratingControllerFindOne = (mediaId: string, params: RequestParams = {}) =>
    this.request<RatingResponseSchema, HttpExceptionSchema>({
      path: `/api/rating/${mediaId}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Remove a rating for a media item
   *
   * @tags Rating
   * @name RatingControllerRemove
   * @summary Remove a rating
   * @request DELETE:/api/rating/{mediaId}
   * @secure
   */
  ratingControllerRemove = (mediaId: string, params: RequestParams = {}) =>
    this.request<RatingResponseSchema, HttpExceptionSchema>({
      path: `/api/rating/${mediaId}`,
      method: "DELETE",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Rate a media item positively
   *
   * @tags Rating
   * @name RatingControllerRatePositive
   * @summary Rate a media item positively
   * @request PUT:/api/rating/positive/{mediaId}
   * @secure
   */
  ratingControllerRatePositive = (mediaId: string, params: RequestParams = {}) =>
    this.request<RatingResponseSchema, HttpExceptionSchema>({
      path: `/api/rating/positive/${mediaId}`,
      method: "PUT",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Rate a media item negatively
   *
   * @tags Rating
   * @name RatingControllerRateNegative
   * @summary Rate a media item negatively
   * @request PUT:/api/rating/negative/{mediaId}
   * @secure
   */
  ratingControllerRateNegative = (mediaId: string, params: RequestParams = {}) =>
    this.request<RatingResponseSchema, HttpExceptionSchema>({
      path: `/api/rating/negative/${mediaId}`,
      method: "PUT",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Create a room for the given media
   *
   * @tags Rooms
   * @name RoomsControllerCreateRoomForMedia
   * @summary Create a room for media
   * @request POST:/api/rooms/media/{mediaId}
   * @secure
   */
  roomsControllerCreateRoomForMedia = (mediaId: string, params: RequestParams = {}) =>
    this.request<RoomResponseSchema, HttpExceptionSchema>({
      path: `/api/rooms/media/${mediaId}`,
      method: "POST",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Create a room for the given playback
   *
   * @tags Rooms
   * @name RoomsControllerCreateRoomForPlayback
   * @summary Create a room for playback
   * @request POST:/api/rooms/playback/{playbackId}
   * @secure
   */
  roomsControllerCreateRoomForPlayback = (playbackId: string, params: RequestParams = {}) =>
    this.request<RoomResponseSchema, HttpExceptionSchema>({
      path: `/api/rooms/playback/${playbackId}`,
      method: "POST",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Updates a room session with the given playback
   *
   * @tags Rooms
   * @name RoomsControllerUpdateRoom
   * @summary Updates a room session
   * @request PATCH:/api/rooms/{roomId}/{playbackId}
   * @secure
   */
  roomsControllerUpdateRoom = (roomId: string, playbackId: string, params: RequestParams = {}) =>
    this.request<FramesGenericResponseSchema, HttpExceptionSchema>({
      path: `/api/rooms/${roomId}/${playbackId}`,
      method: "PATCH",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Joins a room session and creates a playback session
   *
   * @tags Rooms
   * @name RoomsControllerJoinRoom
   * @summary Join a room session
   * @request GET:/api/rooms/{roomId}
   * @secure
   */
  roomsControllerJoinRoom = (roomId: string, params: RequestParams = {}) =>
    this.request<PlaybackSessionSchema, HttpExceptionSchema>({
      path: `/api/rooms/${roomId}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Scan all the server storages for new shows and movies
   *
   * @tags Scan
   * @name ScannerControllerScanServer
   * @summary Scan all server storages
   * @request GET:/api/scan
   * @secure
   */
  scannerControllerScanServer = (params: RequestParams = {}) =>
    this.request<FramesGenericResponseSchema, HttpExceptionSchema>({
      path: `/api/scan`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Retrieve all the server storages for viewing
   *
   * @tags Scan
   * @name ScannerControllerGetStorages
   * @summary Retrieve all server storages
   * @request GET:/api/scan/storages
   * @secure
   */
  scannerControllerGetStorages = (params: RequestParams = {}) =>
    this.request<StorageDetailSchema[], HttpExceptionSchema>({
      path: `/api/scan/storages`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Retrieve all the un-scanned media from all the server storages
   *
   * @tags Scan
   * @name ScannerControllerGetUnScannedItems
   * @summary Retrieve the un-scanned media
   * @request GET:/api/scan/un-scanned
   * @secure
   */
  scannerControllerGetUnScannedItems = (
    query: {
      /** The page number */
      page: number;
      /** The number of items per page */
      pageSize: number;
      /** The query to search for */
      search: string;
    },
    params: RequestParams = {},
  ) =>
    this.request<PageResponseUnScannedItemSchema, HttpExceptionSchema>({
      path: `/api/scan/un-scanned`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Scan the given storage for new shows and movies
   *
   * @tags Scan
   * @name ScannerControllerScanStorage
   * @summary Scan media on a storage
   * @request GET:/api/scan/storage/{storageId}
   * @secure
   */
  scannerControllerScanStorage = (storageId: string, params: RequestParams = {}) =>
    this.request<FramesGenericResponseSchema, HttpExceptionSchema>({
      path: `/api/scan/storage/${storageId}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Scan the given storage for new shows
   *
   * @tags Scan
   * @name ScannerControllerScanShows
   * @summary Scan shows on a storage
   * @request GET:/api/scan/shows/{storageId}
   * @secure
   */
  scannerControllerScanShows = (storageId: string, params: RequestParams = {}) =>
    this.request<FramesGenericResponseSchema, HttpExceptionSchema>({
      path: `/api/scan/shows/${storageId}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Scan the given storage for new movies
   *
   * @tags Scan
   * @name ScannerControllerScanMovies
   * @summary Scan movies on a storage
   * @request GET:/api/scan/movies/{storageId}
   * @secure
   */
  scannerControllerScanMovies = (storageId: string, params: RequestParams = {}) =>
    this.request<FramesGenericResponseSchema, HttpExceptionSchema>({
      path: `/api/scan/movies/${storageId}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Scan the given show for new episodes
   *
   * @tags Scan
   * @name ScannerControllerScanEpisodesInShow
   * @summary Scan show for new episodes
   * @request GET:/api/scan/show/{mediaId}
   * @secure
   */
  scannerControllerScanEpisodesInShow = (mediaId: string, params: RequestParams = {}) =>
    this.request<FramesGenericResponseSchema, HttpExceptionSchema>({
      path: `/api/scan/show/${mediaId}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Retrieve the information for the given media to be used for editing the media
   *
   * @tags Scan
   * @name ScannerControllerGetMediaForEdit
   * @summary Retrieve media information
   * @request GET:/api/scan/media/{mediaId}
   * @secure
   */
  scannerControllerGetMediaForEdit = (mediaId: string, params: RequestParams = {}) =>
    this.request<GetMediaSchema, HttpExceptionSchema>({
      path: `/api/scan/media/${mediaId}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Updates the information for the given media to be used for editing the media
   *
   * @tags Scan
   * @name ScannerControllerUpdateMedia
   * @summary Updates media information
   * @request PATCH:/api/scan/media/{mediaId}
   * @secure
   */
  scannerControllerUpdateMedia = (mediaId: string, data: EditMediaSchema, params: RequestParams = {}) =>
    this.request<GetMediaSchema, HttpExceptionSchema>({
      path: `/api/scan/media/${mediaId}`,
      method: "PATCH",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Delete the given media. NOTE THIS WILL DELETE THE UNDERLYING FILES
   *
   * @tags Scan
   * @name ScannerControllerDeleteMedia
   * @summary Delete media
   * @request DELETE:/api/scan/media/{mediaId}
   * @secure
   */
  scannerControllerDeleteMedia = (mediaId: string, params: RequestParams = {}) =>
    this.request<FramesGenericResponseSchema, HttpExceptionSchema>({
      path: `/api/scan/media/${mediaId}`,
      method: "DELETE",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Retrieve the episodes for the given media
   *
   * @tags Scan
   * @name ScannerControllerGetMediaEpisodes
   * @summary Retrieve episodes for media
   * @request GET:/api/scan/episodes/{mediaId}
   * @secure
   */
  scannerControllerGetMediaEpisodes = (mediaId: string, params: RequestParams = {}) =>
    this.request<EpisodeFileSchema[], HttpExceptionSchema>({
      path: `/api/scan/episodes/${mediaId}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Retrieve the images for the given media using the tmdbId
   *
   * @tags Scan
   * @name ScannerControllerGetMediaImages
   * @summary Retrieve images using the tmdbId
   * @request GET:/api/scan/images
   * @secure
   */
  scannerControllerGetMediaImages = (
    query: {
      /** The tmdbId of the media to get images for */
      tmdbId: number;
      /** The type of media */
      type: MediaType;
    },
    params: RequestParams = {},
  ) =>
    this.request<FrontImagesSchema, HttpExceptionSchema>({
      path: `/api/scan/images`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Retrieve the information for the given media using the tmdbId
   *
   * @tags Scan
   * @name ScannerControllerGetMediaFromTmdbId
   * @summary Retrieve media information using the tmdbId
   * @request GET:/api/scan/tmdbId
   * @secure
   */
  scannerControllerGetMediaFromTmdbId = (
    query: {
      /** The tmdbId of the media to get images for */
      tmdbId: number;
      /** The type of media */
      type: MediaType;
    },
    params: RequestParams = {},
  ) =>
    this.request<TmdbMediaSchema, HttpExceptionSchema>({
      path: `/api/scan/tmdbId`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Create a new media with the given information using the tmdbId
   *
   * @tags Scan
   * @name ScannerControllerCreateFromTmdbId
   * @summary Create a new media using the tmdbId
   * @request POST:/api/scan/tmdbId/{storageId}
   * @secure
   */
  scannerControllerCreateFromTmdbId = (storageId: string, data: CreateFromTmdbIdArgs, params: RequestParams = {}) =>
    this.request<FramesGenericResponseSchema, HttpExceptionSchema>({
      path: `/api/scan/tmdbId/${storageId}`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Create a new media with the given information
   *
   * @tags Scan
   * @name ScannerControllerCreateMedia
   * @summary Create a new media
   * @request POST:/api/scan/media/{storageId}
   * @secure
   */
  scannerControllerCreateMedia = (storageId: string, data: CreateMediaArgs, params: RequestParams = {}) =>
    this.request<FramesGenericResponseSchema, HttpExceptionSchema>({
      path: `/api/scan/media/${storageId}`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Mark a media item as seen
   *
   * @tags Seen
   * @name SeenControllerCreate
   * @summary Mark a media item as seen
   * @request POST:/api/seen/{mediaId}
   * @secure
   */
  seenControllerCreate = (mediaId: string, params: RequestParams = {}) =>
    this.request<SeenResponseSchema, HttpExceptionSchema>({
      path: `/api/seen/${mediaId}`,
      method: "POST",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Check if a media item has been marked as seen
   *
   * @tags Seen
   * @name SeenControllerFindOne
   * @summary Check if a media item has been marked as seen
   * @request GET:/api/seen/{mediaId}
   * @secure
   */
  seenControllerFindOne = (mediaId: string, params: RequestParams = {}) =>
    this.request<SeenResponseSchema, HttpExceptionSchema>({
      path: `/api/seen/${mediaId}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Remove a media item from the seen list
   *
   * @tags Seen
   * @name SeenControllerRemove
   * @summary Remove a media item from the seen list
   * @request DELETE:/api/seen/{mediaId}
   * @secure
   */
  seenControllerRemove = (mediaId: string, params: RequestParams = {}) =>
    this.request<SeenResponseSchema, HttpExceptionSchema>({
      path: `/api/seen/${mediaId}`,
      method: "DELETE",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Get a list of media items the current user has marked as seen
   *
   * @tags Seen
   * @name SeenControllerFindAll
   * @summary Get all the media the current user has marked as seen
   * @request GET:/api/seen
   * @secure
   */
  seenControllerFindAll = (
    query: {
      /** The page number */
      page: number;
      /** The number of items per page */
      pageSize: number;
    },
    params: RequestParams = {},
  ) =>
    this.request<PageResponseSlimMediaSchema, HttpExceptionSchema>({
      path: `/api/seen`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Creates a new TMDB configuration with the given details
   *
   * @tags Setup
   * @name SetupControllerCreateTmdbConfig
   * @summary Creates a new TMDB configuration
   * @request POST:/api/setup/tmdb
   */
  setupControllerCreateTmdbConfig = (data: TmdbApiKeyParams, params: RequestParams = {}) =>
    this.request<FramesGenericResponseSchema, any>({
      path: `/api/setup/tmdb`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Creates a new FanArtTv configuration with the given details
   *
   * @tags Setup
   * @name SetupControllerCreateFanArtTvConfig
   * @summary Creates a new FanArtTv configuration
   * @request POST:/api/setup/fanart
   */
  setupControllerCreateFanArtTvConfig = (data: FanArtTvApiKeyParams, params: RequestParams = {}) =>
    this.request<FramesGenericResponseSchema, any>({
      path: `/api/setup/fanart`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Creates a new OpenAI configuration with the given details
   *
   * @tags Setup
   * @name SetupControllerCreateOpenAiConfig
   * @summary Creates a new OpenAI configuration
   * @request POST:/api/setup/openAI
   */
  setupControllerCreateOpenAiConfig = (data: OpenAiApiKeyParams, params: RequestParams = {}) =>
    this.request<FramesGenericResponseSchema, any>({
      path: `/api/setup/openAI`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Creates a new OpenSubtitles configuration with the given details
   *
   * @tags Setup
   * @name SetupControllerCreateOpenSubtitlesConfig
   * @summary Creates a new OpenSubtitles configuration
   * @request POST:/api/setup/subtitles
   */
  setupControllerCreateOpenSubtitlesConfig = (data: OpenSubtitlesParams, params: RequestParams = {}) =>
    this.request<FramesGenericResponseSchema, any>({
      path: `/api/setup/subtitles`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Creates a new Mail configuration with the given details
   *
   * @tags Setup
   * @name SetupControllerCreateMailConfig
   * @summary Creates a new Mail configuration
   * @request POST:/api/setup/mail
   */
  setupControllerCreateMailConfig = (data: MailServerParams, params: RequestParams = {}) =>
    this.request<FramesGenericResponseSchema, any>({
      path: `/api/setup/mail`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Creates a new Admin configuration with the given details
   *
   * @tags Setup
   * @name SetupControllerCreateAdminConfig
   * @summary Creates a new Admin configuration
   * @request POST:/api/setup/admin
   */
  setupControllerCreateAdminConfig = (data: AdminAccountParams, params: RequestParams = {}) =>
    this.request<FramesGenericResponseSchema, any>({
      path: `/api/setup/admin`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Get trending backdrops from the TMDB API
   *
   * @tags Setup
   * @name SetupControllerGetTrendingBackdrops
   * @summary Get trending backdrops
   * @request GET:/api/setup/trending
   */
  setupControllerGetTrendingBackdrops = (params: RequestParams = {}) =>
    this.request<string[], any>({
      path: `/api/setup/trending`,
      method: "GET",
      format: "json",
      ...params,
    });
  /**
   * @description Creates a new Oauth configuration and returns the URL to authenticate
   *
   * @tags Setup
   * @name SetupControllerCreateOauthConfig
   * @summary Creates a new Oauth configuration
   * @request POST:/api/setup/oauth
   */
  setupControllerCreateOauthConfig = (data: OauthClientParams, params: RequestParams = {}) =>
    this.request<FramesGenericResponseSchema, any>({
      path: `/api/setup/oauth`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Authenticate the user with the oauth provider
   *
   * @tags Setup
   * @name SetupControllerGetOauthUrlCallback
   * @summary Authenticate with oauth
   * @request GET:/api/setup/oauth/callback
   */
  setupControllerGetOauthUrlCallback = (
    query: {
      /** The OAuth code */
      code: string;
      /** The OAuth state */
      state: string;
    },
    params: RequestParams = {},
  ) =>
    this.request<string, any>({
      path: `/api/setup/oauth/callback`,
      method: "GET",
      query: query,
      format: "json",
      ...params,
    });
  /**
   * @description Get the details of contents in a folder and of the folder itself
   *
   * @tags Setup
   * @name SetupControllerExploreFolder
   * @summary Explorer a folder
   * @request GET:/api/setup/explorer
   */
  setupControllerExploreFolder = (
    query: {
      /** The path to the folder */
      path?: string;
      /** The id of the storage */
      cloudStorageId: string;
    },
    params: RequestParams = {},
  ) =>
    this.request<ReadFolderSchema, any>({
      path: `/api/setup/explorer`,
      method: "GET",
      query: query,
      format: "json",
      ...params,
    });
  /**
   * @description Get the details of the local storage
   *
   * @tags Setup
   * @name SetupControllerGetLocalStorage
   * @summary Get the local storage
   * @request GET:/api/setup/local
   */
  setupControllerGetLocalStorage = (
    query: {
      /** The name of the storage to create if it does not exist */
      name: string;
    },
    params: RequestParams = {},
  ) =>
    this.request<SlimStorageSchema, any>({
      path: `/api/setup/local`,
      method: "GET",
      query: query,
      format: "json",
      ...params,
    });
  /**
   * @description Get the configuration details
   *
   * @tags Setup
   * @name SetupControllerGetConfiguration
   * @summary Get the configuration
   * @request GET:/api/setup/configuration
   */
  setupControllerGetConfiguration = (params: RequestParams = {}) =>
    this.request<SetupConfigurationSchema, any>({
      path: `/api/setup/configuration`,
      method: "GET",
      format: "json",
      ...params,
    });
  /**
   * @description Creates a new S3 configuration with the given details
   *
   * @tags Setup
   * @name SetupControllerCreateS3Storage
   * @summary Creates a new S3 configuration
   * @request POST:/api/setup/s3
   */
  setupControllerCreateS3Storage = (data: S3Params, params: RequestParams = {}) =>
    this.request<SlimStorageSchema, any>({
      path: `/api/setup/s3`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Update the storage with the given details
   *
   * @tags Setup
   * @name SetupControllerUpdateStorage
   * @summary Update the storage
   * @request PATCH:/api/setup/storage
   */
  setupControllerUpdateStorage = (data: UpdateSetupStorageArgs, params: RequestParams = {}) =>
    this.request<FramesGenericResponseSchema, any>({
      path: `/api/setup/storage`,
      method: "PATCH",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Create a new storage with the given details and return the new storage object
   *
   * @tags Storage
   * @name StorageControllerCreate
   * @summary Create a new storage
   * @request POST:/api/storage
   * @secure
   */
  storageControllerCreate = (data: CreateStorageArgs, params: RequestParams = {}) =>
    this.request<SafeStorageSchema, HttpExceptionSchema>({
      path: `/api/storage`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Get all storages the current user has access to
   *
   * @tags Storage
   * @name StorageControllerFindAll
   * @summary Get all storages
   * @request GET:/api/storage
   * @secure
   */
  storageControllerFindAll = (
    query: {
      /** The page number */
      page: number;
      /** The number of items per page */
      pageSize: number;
    },
    params: RequestParams = {},
  ) =>
    this.request<PageResponseStorageSchema, HttpExceptionSchema>({
      path: `/api/storage`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Update details of a storage with the given Id
   *
   * @tags Storage
   * @name StorageControllerUpdate
   * @summary Update a storage
   * @request PATCH:/api/storage/{storageId}
   * @secure
   */
  storageControllerUpdate = (storageId: string, data: UpdateStorageArgs, params: RequestParams = {}) =>
    this.request<SafeStorageSchema, HttpExceptionSchema>({
      path: `/api/storage/${storageId}`,
      method: "PATCH",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Delete a storage with the given Id
   *
   * @tags Storage
   * @name StorageControllerRemove
   * @summary Delete a storage
   * @request DELETE:/api/storage/{storageId}
   * @secure
   */
  storageControllerRemove = (storageId: string, params: RequestParams = {}) =>
    this.request<FramesGenericResponseSchema, HttpExceptionSchema>({
      path: `/api/storage/${storageId}`,
      method: "DELETE",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Delete a storage with the given Id
   *
   * @tags Storage
   * @name StorageControllerRemoveFile
   * @summary Delete a storage
   * @request DELETE:/api/storage/file/{storageId}
   * @secure
   */
  storageControllerRemoveFile = (storageId: string, data: DeleteFileArgs, params: RequestParams = {}) =>
    this.request<boolean, HttpExceptionSchema>({
      path: `/api/storage/file/${storageId}`,
      method: "DELETE",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Get the requested subtitle based on the subtitle ID
   *
   * @tags Subtitles
   * @name SubtitlesControllerGetSubtitles
   * @summary Get a subtitle
   * @request GET:/api/subtitle/{subtitleId}
   * @secure
   */
  subtitlesControllerGetSubtitles = (subtitleId: string, params: RequestParams = {}) =>
    this.request<SubtitleInfoSchema, HttpExceptionSchema>({
      path: `/api/subtitle/${subtitleId}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Update the subtitle offset for the requested subtitle
   *
   * @tags Subtitles
   * @name SubtitlesControllerUpdateOffset
   * @summary Update the subtitle offset
   * @request PATCH:/api/subtitle/{subtitleId}
   * @secure
   */
  subtitlesControllerUpdateOffset = (subtitleId: string, data: UpdateOffsetSchema, params: RequestParams = {}) =>
    this.request<SubtitleInfoSchema, HttpExceptionSchema>({
      path: `/api/subtitle/${subtitleId}`,
      method: "PATCH",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Get the user's details for a media, including whether the media is in the user's list, the user's rating of the media, the user's seen status of the media, and whether the user can modify the media
   *
   * @tags Users
   * @name UsersControllerGetMediaDetails
   * @summary Get the user's details for a media
   * @request GET:/api/users/media/{mediaId}
   * @secure
   */
  usersControllerGetMediaDetails = (mediaId: string, params: RequestParams = {}) =>
    this.request<UserMediaDetailsResponseSchema, HttpExceptionSchema>({
      path: `/api/users/media/${mediaId}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Update the user's language
   *
   * @tags Users
   * @name UsersControllerUpdateLanguage
   * @summary Update the user's language
   * @request PATCH:/api/users/language/{language}
   * @secure
   */
  usersControllerUpdateLanguage = (language: string, params: RequestParams = {}) =>
    this.request<SessionSchema, HttpExceptionSchema>({
      path: `/api/users/language/${language}`,
      method: "PATCH",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Update the user's settings
   *
   * @tags Users
   * @name UsersControllerUpdateUserData
   * @summary Update the user's settings
   * @request PATCH:/api/users/data
   * @secure
   */
  usersControllerUpdateUserData = (data: UpdateUserArgs, params: RequestParams = {}) =>
    this.request<SessionSchema, HttpExceptionSchema>({
      path: `/api/users/data`,
      method: "PATCH",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Update the user's settings
   *
   * @tags Users
   * @name UsersControllerUpdateUsername
   * @summary Update the user's settings
   * @request PATCH:/api/users/username
   * @secure
   */
  usersControllerUpdateUsername = (data: UsernameParams, params: RequestParams = {}) =>
    this.request<SessionSchema, HttpExceptionSchema>({
      path: `/api/users/username`,
      method: "PATCH",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Get the user's continue watching list
   *
   * @tags Users
   * @name UsersControllerGetContinueWatching
   * @summary Get the user's continue watching list
   * @request GET:/api/users/continue-watching
   * @secure
   */
  usersControllerGetContinueWatching = (params: RequestParams = {}) =>
    this.request<HomeResponseContinueWatchingSchema, HttpExceptionSchema>({
      path: `/api/users/continue-watching`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Get the user's recommendations based on their activity
   *
   * @tags Users
   * @name UsersControllerGetRecommendations
   * @summary Get the user's recommendations
   * @request GET:/api/users/recommendations
   * @secure
   */
  usersControllerGetRecommendations = (params: RequestParams = {}) =>
    this.request<HomeResponseSlimMediaSchema, HttpExceptionSchema>({
      path: `/api/users/recommendations`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Get the user's streaming session if the user is currently streaming on another device
   *
   * @tags Users
   * @name UsersControllerGetStreamingSession
   * @summary Get the user's streaming session
   * @request GET:/api/users/streaming-session
   * @secure
   */
  usersControllerGetStreamingSession = (params: RequestParams = {}) =>
    this.request<MetadataSchema, HttpExceptionSchema>({
      path: `/api/users/streaming-session`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Get the list of all users with their details
   *
   * @tags Users
   * @name UsersControllerGetUsers
   * @summary Get all users
   * @request GET:/api/users/users
   * @secure
   */
  usersControllerGetUsers = (
    query: {
      /** The page number */
      page: number;
      /** The number of items per page */
      pageSize: number;
    },
    params: RequestParams = {},
  ) =>
    this.request<PageResponseSlimFrontUserSchema, HttpExceptionSchema>({
      path: `/api/users/users`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Delete users from the platform
   *
   * @tags Users
   * @name UsersControllerDeleteUsers
   * @summary Delete users
   * @request DELETE:/api/users/users
   * @secure
   */
  usersControllerDeleteUsers = (data: BulkUsersArgs, params: RequestParams = {}) =>
    this.request<FramesGenericResponseSchema, HttpExceptionSchema>({
      path: `/api/users/users`,
      method: "DELETE",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Get all the user's activity, searchable and paginated
   *
   * @tags Users
   * @name UsersControllerGetActivity
   * @summary Get the user's activity
   * @request PATCH:/api/users/activity
   * @secure
   */
  usersControllerGetActivity = (data: GetActivityArgs, params: RequestParams = {}) =>
    this.request<PageResponseHistorySchema, HttpExceptionSchema>({
      path: `/api/users/activity`,
      method: "PATCH",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Promote users to a specific role
   *
   * @tags Users
   * @name UsersControllerPromoteUsers
   * @summary Promote users
   * @request PATCH:/api/users/promote
   * @secure
   */
  usersControllerPromoteUsers = (data: PromoteUsersArgs, params: RequestParams = {}) =>
    this.request<FramesGenericResponseSchema, HttpExceptionSchema>({
      path: `/api/users/promote`,
      method: "PATCH",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Revoke access to the platform for users
   *
   * @tags Users
   * @name UsersControllerRevokeUsersAccess
   * @summary Revoke users
   * @request PATCH:/api/users/revoke
   * @secure
   */
  usersControllerRevokeUsersAccess = (data: BulkUsersArgs, params: RequestParams = {}) =>
    this.request<FramesGenericResponseSchema, HttpExceptionSchema>({
      path: `/api/users/revoke`,
      method: "PATCH",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Confirm users manually. Useful frames has not been configured with an SMTP server
   *
   * @tags Users
   * @name UsersControllerConfirmUsers
   * @summary Confirm users
   * @request PATCH:/api/users/confirm
   * @secure
   */
  usersControllerConfirmUsers = (data: BulkUsersArgs, params: RequestParams = {}) =>
    this.request<FramesGenericResponseSchema, HttpExceptionSchema>({
      path: `/api/users/confirm`,
      method: "PATCH",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Grant revoked users access to the platform
   *
   * @tags Users
   * @name UsersControllerGrantUsersAccess
   * @summary Grant users access
   * @request PATCH:/api/users/grant-access
   * @secure
   */
  usersControllerGrantUsersAccess = (data: BulkUsersArgs, params: RequestParams = {}) =>
    this.request<FramesGenericResponseSchema, HttpExceptionSchema>({
      path: `/api/users/grant-access`,
      method: "PATCH",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Delete items from the platform for a specific user
   *
   * @tags Users
   * @name UsersControllerDeleteItems
   * @summary Delete users
   * @request DELETE:/api/users/items
   * @secure
   */
  usersControllerDeleteItems = (data: BulkItemsArgs, params: RequestParams = {}) =>
    this.request<FramesGenericResponseSchema, HttpExceptionSchema>({
      path: `/api/users/items`,
      method: "DELETE",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Get the user's details
   *
   * @tags Users
   * @name UsersControllerGetProfileDetails
   * @summary Get the user's details
   * @request GET:/api/users/details
   * @secure
   */
  usersControllerGetProfileDetails = (params: RequestParams = {}) =>
    this.request<ProfileDetailsSchema, HttpExceptionSchema>({
      path: `/api/users/details`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
}
