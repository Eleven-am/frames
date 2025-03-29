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

export class CName<SecurityDataType = unknown> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags Render
   * @name RenderControllerGetCompanyByName
   * @request GET:/c={name}
   */
  renderControllerGetCompanyByName = (name: string, params: RequestParams = {}) =>
    this.request<void, any>({
      path: `/c=${name}`,
      method: "GET",
      ...params,
    });
}
