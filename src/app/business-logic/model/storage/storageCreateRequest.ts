/**
 * storage
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * OpenAPI spec version: 2.12
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 */

import { Credentials } from './credentials';


export interface StorageCreateRequest {
    /**
     * Storage name
     */
    name?: string;
    /**
     * Storage URI
     */
    uri: string;
    credentials?: Credentials;
    /**
     * Company under which to add this storage. Only valid for users with the root or   system role, otherwise the calling user's company will be used.
     */
    company?: string;
}
