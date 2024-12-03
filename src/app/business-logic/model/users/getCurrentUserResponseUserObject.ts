/**
 * users
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * OpenAPI spec version: 2.14
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 */

import { GetCurrentUserResponseUserObjectCompany } from '././getCurrentUserResponseUserObjectCompany';


/**
 * like user, but returns company object instead of ID
 */
export interface GetCurrentUserResponseUserObject {
    id?: string;
    name?: string;
    given_name?: string;
    family_name?: string;
    role?: string;
    avatar?: string;
    company?: GetCurrentUserResponseUserObjectCompany;
    email?: string;
    /**
     * User preferences
     */
    preferences?: any;
    created_in_version?: string;
}
