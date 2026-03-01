import type { MetadataRoute } from "next";
import { APP_URL } from "@/lib/constants";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = APP_URL;

  const staticPages = [
    "",
    "/dashboard",
    "/guide",
    "/geo",
    "/macro",
    "/calendar",
    "/fear-greed",
    "/glossary",
    "/etf",
    "/etf/compare",
    "/recommend",
    "/simulator",
    "/ask",
    "/watchlist",
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency:
      path === "" ? ("daily" as const) : ("weekly" as const),
    priority: path === "/dashboard" ? 1.0 : path === "" ? 0.9 : 0.7,
  }));

  return staticPages;
}
