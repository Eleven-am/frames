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

export class SName<SecurityDataType = unknown> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags Render
   * @name RenderControllerGetShowByName
   * @request GET:/s={name}
   */
  renderControllerGetShowByName = (name: string, params: RequestParams = {}) =>
    this.request<void, any>({
      path: `/s=${name}`,
      method: "GET",
      ...params,
    });
}
