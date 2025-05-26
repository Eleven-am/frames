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

import { HttpClient, RequestParams } from "./http-client";

export class PlPlaylistId<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags Render
   * @name RenderControllerGetPlaylistById
   * @request GET:/pl={playlistId}
   */
  renderControllerGetPlaylistById = (
    playlistId: string,
    params: RequestParams = {},
  ) =>
    this.request<void, any>({
      path: `/pl=${playlistId}`,
      method: "GET",
      ...params,
    });
}
