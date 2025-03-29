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

export class RRoomId<SecurityDataType = unknown> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags Render
   * @name RenderControllerGetRoomById
   * @request GET:/r={roomId}
   */
  renderControllerGetRoomById = (roomId: string, params: RequestParams = {}) =>
    this.request<void, any>({
      path: `/r=${roomId}`,
      method: "GET",
      ...params,
    });
}
