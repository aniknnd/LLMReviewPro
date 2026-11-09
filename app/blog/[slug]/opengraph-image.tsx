import { ImageResponse } from "next/og";
import { getPublishedPostBySlug } from "@/lib/queries";
import { site } from "@/lib/site";

export const alt = "Blog article cover image";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Auto-generated OG image per post (next/og).
 * Shows category, title (truncated), author, and site brand.
 */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug).catch(() => null);

  const title = post?.title || site.name;
  const category = post?.category?.name || "LLM coverage";
  const author = post?.author.name || site.name;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px",
          background: "#0a0f0d",
          color: "#f5f5f4",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              padding: "8px 16px",
              borderRadius: "999px",
              background: "#065f46",
              color: "#ffffff",
              fontSize: "18px",
              fontWeight: 600,
            }}
          >
            {category}
          </div>
          <div
            style={{
              marginTop: "28px",
              fontSize: title.length > 70 ? "44px" : "56px",
              fontWeight: 800,
              lineHeight: 1.15,
            }}
          >
            {title.length > 110 ? `${title.slice(0, 107)}…` : title}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "24px",
            color: "#a8a29e",
          }}
        >
          <span>{site.name}</span>
          <span>By {author}</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
