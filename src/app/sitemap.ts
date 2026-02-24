import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://stock-intelligence-seven.vercel.app";

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
