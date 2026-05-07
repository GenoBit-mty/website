/* eslint-disable */
/**
 * Generated `ComponentApi` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type { FunctionReference } from "convex/server";

/**
 * A utility for referencing a Convex component's exposed API.
 *
 * Useful when expecting a parameter like `components.myComponent`.
 * Usage:
 * ```ts
 * async function myFunction(ctx: QueryCtx, component: ComponentApi) {
 *   return ctx.runQuery(component.someFile.someQuery, { ...args });
 * }
 * ```
 */
export type ComponentApi<Name extends string | undefined = string | undefined> =
  {
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
        string,
        Name
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
        }>,
        Name
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
        string,
        Name
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
        }>,
        Name
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
        }>,
        Name
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
        string,
        Name
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
        }>,
        Name
      >;
    };
    media: {
      generateUploadUrl: FunctionReference<
        "mutation",
        "internal",
        {},
        string,
        Name
      >;
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
        }>,
        Name
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
        { assetId: string; url: string },
        Name
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
        string,
        Name
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
        }>,
        Name
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
        },
        Name
      >;
    };
    seedGenobit: {
      seedGenobitTeam: FunctionReference<
        "mutation",
        "internal",
        {},
        { deleted: number; inserted: number },
        Name
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
        string,
        Name
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
        }>,
        Name
      >;
    };
  };
