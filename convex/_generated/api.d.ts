/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as content from "../content.js";
import type * as events from "../events.js";
import type * as labs from "../labs.js";
import type * as pastAdmin from "../pastAdmin.js";
import type * as research from "../research.js";
import type * as team from "../team.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  content: typeof content;
  events: typeof events;
  labs: typeof labs;
  pastAdmin: typeof pastAdmin;
  research: typeof research;
  team: typeof team;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  content: {
    administrations: {
      create: FunctionReference<
        "mutation",
        "internal",
        {
          description?: string;
          galleryImageUrls?: Array<string>;
          imageUrl?: string;
          members: Array<{ imageUrl?: string; name: string; role: string }>;
          period: string;
          presidentName: string;
        },
        string
      >;
      list: FunctionReference<
        "query",
        "internal",
        {},
        Array<{
          _creationTime: number;
          _id: string;
          description?: string;
          galleryImageUrls?: Array<string>;
          imageUrl?: string;
          members: Array<{ imageUrl?: string; name: string; role: string }>;
          period: string;
          presidentName: string;
        }>
      >;
    };
    events: {
      create: FunctionReference<
        "mutation",
        "internal",
        {
          category?: string;
          date: string;
          description: string;
          galleryImageUrls?: Array<string>;
          imageUrl?: string;
          isUpcoming?: boolean;
          location: string;
          registrationUrl?: string;
          title: string;
        },
        string
      >;
      list: FunctionReference<
        "query",
        "internal",
        {},
        Array<{
          _creationTime: number;
          _id: string;
          category?: string;
          date: string;
          description: string;
          galleryImageUrls?: Array<string>;
          imageUrl?: string;
          isUpcoming?: boolean;
          location: string;
          registrationUrl?: string;
          title: string;
        }>
      >;
      listUpcoming: FunctionReference<
        "query",
        "internal",
        {},
        Array<{
          _creationTime: number;
          _id: string;
          category?: string;
          date: string;
          description: string;
          galleryImageUrls?: Array<string>;
          imageUrl?: string;
          isUpcoming?: boolean;
          location: string;
          registrationUrl?: string;
          title: string;
        }>
      >;
    };
    labs: {
      create: FunctionReference<
        "mutation",
        "internal",
        {
          description?: string;
          focusAreas?: Array<string>;
          galleryImageUrls?: Array<string>;
          imageUrl?: string;
          lead?: string;
          location?: string;
          summary: string;
          title: string;
        },
        string
      >;
      list: FunctionReference<
        "query",
        "internal",
        {},
        Array<{
          _creationTime: number;
          _id: string;
          description?: string;
          focusAreas?: Array<string>;
          galleryImageUrls?: Array<string>;
          imageUrl?: string;
          lead?: string;
          location?: string;
          summary: string;
          title: string;
        }>
      >;
    };
    media: {
      generateUploadUrl: FunctionReference<"mutation", "internal", {}, string>;
      listAssets: FunctionReference<
        "query",
        "internal",
        { entityId?: string; entityType?: string },
        Array<{
          _creationTime: number;
          _id: string;
          altText?: string;
          createdAt: number;
          entityId?: string;
          entityType: string;
          storageId: string;
          url: string;
        }>
      >;
      saveAsset: FunctionReference<
        "mutation",
        "internal",
        {
          altText?: string;
          entityId?: string;
          entityType: string;
          storageId: string;
        },
        { assetId: string; url: string }
      >;
    };
    research: {
      create: FunctionReference<
        "mutation",
        "internal",
        {
          authors: Array<string>;
          description: string;
          galleryImageUrls?: Array<string>;
          imageUrl?: string;
          publicationDate?: string;
          tags?: Array<string>;
          title: string;
          url?: string;
        },
        string
      >;
      list: FunctionReference<
        "query",
        "internal",
        {},
        Array<{
          _creationTime: number;
          _id: string;
          authors: Array<string>;
          description: string;
          galleryImageUrls?: Array<string>;
          imageUrl?: string;
          publicationDate?: string;
          tags?: Array<string>;
          title: string;
          url?: string;
        }>
      >;
    };
    seed: {
      seedDemoData: FunctionReference<
        "mutation",
        "internal",
        {},
        {
          events: number;
          labs: number;
          pastAdministrations: number;
          research: number;
          teamMembers: number;
        }
      >;
    };
    seedGenobit: {
      seedGenobitTeam: FunctionReference<
        "mutation",
        "internal",
        {},
        { deleted: number; inserted: number }
      >;
    };
    team: {
      create: FunctionReference<
        "mutation",
        "internal",
        {
          bio?: string;
          career?: string;
          email?: string;
          galleryImageUrls?: Array<string>;
          githubUrl?: string;
          group?: string;
          imageUrl?: string;
          isFirstBoard?: boolean;
          linkedinUrl?: string;
          name: string;
          order?: number;
          role: string;
          tenure?: string;
        },
        string
      >;
      list: FunctionReference<
        "query",
        "internal",
        {},
        Array<{
          _creationTime: number;
          _id: string;
          bio?: string;
          career?: string;
          email?: string;
          galleryImageUrls?: Array<string>;
          githubUrl?: string;
          group?: string;
          imageUrl?: string;
          isFirstBoard?: boolean;
          linkedinUrl?: string;
          name: string;
          order?: number;
          role: string;
          tenure?: string;
        }>
      >;
    };
  };
};
