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

export class FCypher<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags Render
   * @name RenderControllerGetFrameByCypher
   * @request GET:/f={cypher}
   */
  renderControllerGetFrameByCypher = (
    cypher: string,
    params: RequestParams = {},
  ) =>
    this.request<void, any>({
      path: `/f=${cypher}`,
      method: "GET",
      ...params,
    });
}
