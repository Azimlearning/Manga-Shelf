# MangaShelf Technical Research Report

**Author:** Manus AI
**Date:** March 22, 2026
**Project:** MangaShelf PWA (iOS Manga Reader)

## 1. Executive Summary

This report provides a comprehensive technical analysis to support the development of MangaShelf, a personal Progressive Web App (PWA) designed to replicate the Android manga reader experience (such as Mihon and Tachiyomi) on iOS devices. The research covers three primary areas: the architecture of Mihon's extension system, an evaluation of open-source manga reader backends (specifically Komga and Kavita), and a detailed compilation of the top 10 free manga source APIs. This analysis aims to inform architectural decisions and API integrations for the MangaShelf project.

## 2. Mihon Extension System Architecture

The Mihon application (formerly Tachiyomi) utilizes a robust extension system that allows users to add various manga sources dynamically without updating the core application. Understanding this architecture is crucial for potentially implementing a similar plugin system in future versions of MangaShelf.

### 2.1 Extension Structure and Compilation

Mihon extensions are essentially Android application packages (APKs) that contain specific classes implementing the required interfaces. The source code for these extensions is typically written in Kotlin and managed using the Gradle build system [1]. 

The core of an extension is the main class, which must implement the `SourceFactory` interface or extend either the `HttpSource` or `ParsedHttpSource` classes [1]. This main class defines essential properties such as the source name, base URL, language code, and a unique identifier. 

The compilation process involves building the extension code against the `extensions-lib` API provided by the core application. This library provides the necessary interfaces and stubs. The resulting output is an APK file (often distributed with a `.jar` or `.apk` extension depending on the repository structure) that the main application can load dynamically at runtime [1].

### 2.2 Extension Call Flow

When a user interacts with a source in Mihon, the application invokes specific methods defined in the extension's main class. The typical call flow includes several key operations [1]:

1. **Popular Manga**: The application calls `fetchPopularManga`, which returns a paginated list of manga entries containing basic information like URL, title, and thumbnail URL.
2. **Latest Manga**: Similar to popular manga, the `fetchLatestUpdates` method retrieves the most recently updated entries.
3. **Manga Search**: The `fetchSearchManga` method handles user queries, often incorporating complex filtering systems defined by the `getFilterList` method.
4. **Manga Details**: Once a user selects a specific manga, the `getMangaDetails` method fetches comprehensive metadata, including author, artist, description, and genres.
5. **Chapter List**: The `getChapterList` method retrieves all available chapters for the selected manga.
6. **Page List**: Finally, when a user opens a chapter, the `getPageList` method fetches the individual image URLs required for reading.

This modular architecture allows developers to create scrapers for virtually any manga website by simply implementing these standard methods and handling the site-specific HTML parsing or API requests.

## 3. Open-Source Manga Reader Backends

For users who prefer to host their own manga libraries rather than relying entirely on external sources, open-source backends provide a robust solution. Komga and Kavita are two of the most prominent self-hosted reading servers, both offering comprehensive REST APIs suitable for integration with a custom frontend like MangaShelf.

### 3.1 Komga

Komga is a mature, self-hosted media server designed specifically for comics, mangas, BDs, magazines, and eBooks. It is built on the Java Virtual Machine (JVM) and provides a comprehensive REST API documented via OpenAPI/Swagger [2].

Komga supports multiple authentication methods, including standard HTTP Basic Authentication, API Keys passed via the `X-API-Key` header, and session-based authentication using cookies or the `X-Auth-Token` header [2]. This flexibility makes it relatively straightforward to integrate with various client applications.

The Komga API provides extensive endpoints for managing libraries, series, and individual books. Key operations include retrieving series details (`GET /api/v1/series/{seriesId}`), fetching chapter lists (`GET /api/v1/series/{seriesId}/books`), and accessing individual page images (`GET /api/v1/books/{bookId}/pages/{pageNumber}`) [3]. Furthermore, Komga supports reading progress tracking (`PUT /api/v1/books/{bookId}/progression`), which is essential for a seamless reading experience across devices [3].

### 3.2 Kavita

Kavita is a modern, fast, and feature-rich cross-platform reading server built with Rust. It aims to be a complete solution for all reading needs, supporting a wide array of file formats including CBZ, CBR, PDF, and EPUB [4].

Unlike Komga, Kavita relies primarily on JSON Web Tokens (JWT) for authentication. Users must first authenticate via the `POST /api/Account/login` endpoint to receive a JWT, which is then passed in the `Authorization: Bearer <token>` header for subsequent requests [4]. Kavita also supports user-specific Auth Keys for API access.

The Kavita API is extensive and well-documented. It offers endpoints for retrieving series information (`GET /api/Series/{id}`), accessing chapters (`GET /api/Series/{id}/chapters`), and fetching page images (`GET /api/Chapter/{id}/pages`) [4]. Kavita also includes advanced features such as user collections, reading lists, and annotations, all accessible via the REST API.

### 3.3 Comparison and Recommendation

Both Komga and Kavita offer robust APIs suitable for integration with the MangaShelf PWA. 

| Feature | Komga | Kavita |
|---------|-------|--------|
| **Architecture** | Java (JVM) | Rust |
| **Authentication** | Basic Auth, API Key, Sessions | JWT, Auth Keys |
| **API Documentation** | OpenAPI/Swagger | Swagger |
| **Reading Progress** | Supported | Supported |
| **File Formats** | CBZ, CBR, PDF, EPUB | CBZ, CBR, PDF, EPUB |

For the MangaShelf project, Kavita's JWT-based authentication may align more naturally with modern web development practices (such as Next.js API routes). However, Komga's API Key authentication offers a simpler integration path if user management is not a primary concern. Both backends provide the necessary endpoints to serve images directly to the frontend, though a CORS proxy will likely be required to bypass browser restrictions.

## 4. Top 10 Free Manga Source APIs

To populate the MangaShelf application with content without requiring users to host their own servers, integrating with public manga APIs is necessary. The following table details the top 10 free manga source APIs, including their endpoints, rate limits, and available metadata.

| Rank | API Name | Base URL | Authentication | Rate Limits | Key Features |
|------|----------|----------|----------------|-------------|--------------|
| 1 | **MangaDex API v5** | `api.mangadex.org` | None (Public) | 5 req/sec (Global) | Comprehensive metadata, high-quality images, official documentation. Requires CORS proxy. |
| 2 | **Jikan API v4** | `api.jikan.moe/v4` | None | 60 req/min | Unofficial MyAnimeList API. Excellent for metadata, statistics, and recommendations. Read-only. |
| 3 | **AniList GraphQL** | `graphql.anilist.co` | Optional | 90 req/min | Flexible GraphQL queries. Extensive metadata, character info, and user lists. |
| 4 | **Komga REST API** | Self-hosted | API Key / Basic | Server-dependent | Best for self-hosted local libraries. Supports reading progress and collections. |
| 5 | **Kavita REST API** | Self-hosted | JWT | Server-dependent | Modern self-hosted alternative. Excellent format support and user management. |
| 6 | **Manga Hook API** | `mangahook-api.vercel.app` | None | Vercel limits | Open-source wrapper scraping MangaKakalot. Simple integration but relies on scraping. |
| 7 | **MyAnimeList v2** | `api.myanimelist.net/v2` | OAuth 2.0 | ~2 req/sec | Official beta API. Good for syncing user reading lists, but requires complex authentication. |
| 8 | **MangaKakalot** | Scraper-based | None | Undocumented | Unofficial npm packages available. Large catalog but fragile due to scraping nature. |
| 9 | **Bato.to** | Scraper-based | None | Undocumented | Popular aggregator with many languages. Requires custom scraping logic; frequently breaks. |
| 10 | **Comick API** | Scraper-based | None | Undocumented | Supports both manga and Western comics. Unofficial wrappers available on GitHub. |

### 4.1 Primary Recommendation: MangaDex API v5

For the MangaShelf PWA, the **MangaDex API v5** is the optimal primary source. It is entirely public, free to use, and does not require authentication for browsing or reading chapters [5]. The API provides comprehensive endpoints for searching manga (`GET /manga`), retrieving chapter lists (`GET /manga/{id}/feed`), and accessing image servers (`GET /at-home/server/{chapterId}`) [5]. 

Developers must adhere to MangaDex's acceptable usage policy, which prohibits running ads or paid services and requires crediting scanlation groups [6]. Additionally, MangaDex enforces a global rate limit of approximately 5 requests per second per IP address, with stricter limits on specific endpoints [6]. Crucially, MangaDex does not send CORS responses for external websites, necessitating the implementation of a proxy route (e.g., `/api/image?url=...` in Next.js) to serve images to the PWA [6].

### 4.2 Secondary Recommendation: Jikan API v4

To supplement MangaDex's catalog with enhanced metadata, the **Jikan API v4** (an unofficial MyAnimeList API) is highly recommended. Jikan provides extensive endpoints for retrieving statistics, character information, and recommendations without requiring authentication [7]. It enforces a generous rate limit of 60 requests per minute and utilizes aggressive caching to ensure high performance [7].

## 5. Conclusion

Developing the MangaShelf PWA for iOS requires navigating platform restrictions by leveraging modern web technologies. While replicating Mihon's dynamic `.jar` extension system directly in a PWA is technically challenging due to browser security models, understanding its architecture provides a blueprint for building a modular, API-driven frontend. 

For content delivery, the MangaDex API v5 stands out as the most reliable and comprehensive public source, provided the application implements the necessary CORS proxies. For users desiring a self-hosted solution, both Komga and Kavita offer robust REST APIs that can be seamlessly integrated into the MangaShelf ecosystem. By combining these resources, MangaShelf can successfully deliver a premium, customizable manga reading experience on iOS devices.

## References

[1] Keiyoushi Extensions Source Repository. "Contributing Guide." GitHub. https://github.com/keiyoushi/extensions-source/blob/main/CONTRIBUTING.md
[2] Komga Documentation. "Komga API." https://komga.org/docs/openapi/komga-api/
[3] Komga Swagger UI. "API Reference." https://demo.komga.org/swagger-ui.html
[4] Kavita Documentation. "Kavita API Docs." https://www.kavitareader.com/docs/api/
[5] MangaDex API Documentation. "Home." https://api.mangadex.org/docs/
[6] MangaDex API Documentation. "Limitations and Requirements." https://api.mangadex.org/docs/2-limitations/
[7] Jikan API Documentation. "Jikan REST API v4 Docs." https://docs.api.jikan.moe/
