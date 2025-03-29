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

export class WPlaybackId<SecurityDataType = unknown> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags Render
   * @name RenderControllerGetPlaybackById
   * @request GET:/w={playbackId}
   */
  renderControllerGetPlaybackById = (playbackId: string, params: RequestParams = {}) =>
    this.request<void, any>({
      path: `/w=${playbackId}`,
      method: "GET",
      ...params,
    });
}
