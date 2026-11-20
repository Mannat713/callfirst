import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui";
import { getPost, POSTS } from "@/content/posts";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export function generateStaticParams() {
  return POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const post = getPost((await params).slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { type: "article", title: post.title, description: post.description, publishedTime: post.date, url: `/blog/${post.slug}` },
  };
}

const fmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export default async function BlogPost({ params }: PageProps<"/blog/[slug]">) {
  const post = getPost((await params).slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  };

  return (
    <article className="mx-auto max-w-2xl px-5 py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Link href="/blog" className="text-sm text-muted hover:text-ink">← All posts</Link>
      <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight">{post.title}</h1>
      <p className="mt-4 text-sm text-muted">
        <time dateTime={post.date}>{fmt.format(new Date(post.date))}</time> · {post.minutes} min read
      </p>
      <div className="mt-8 space-y-5 text-lg leading-relaxed">
        {post.body.map((block, i) =>
          block.h ? (
            <h2 key={i} className="pt-4 text-2xl font-semibold tracking-tight">{block.h}</h2>
          ) : block.list ? (
            <ul key={i} className="list-disc space-y-2 pl-6">
              {block.list.map((item) => <li key={item}>{item}</li>)}
            </ul>
          ) : (
            <p key={i}>{block.p}</p>
          ),
        )}
      </div>
      <aside className="mt-12 rounded-2xl border border-line bg-surface p-6">
        <h2 className="text-xl font-semibold tracking-tight">Rank your own lead sheet</h2>
        <p className="mt-2 text-muted">Upload an export and see who to call first, with the reason for every rank. Free, and nothing leaves your browser.</p>
        <ButtonLink href="/app" className="mt-4">Open CallFirst</ButtonLink>
      </aside>
    </article>
  );
}
