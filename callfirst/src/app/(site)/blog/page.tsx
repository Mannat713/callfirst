import type { Metadata } from "next";
import Link from "next/link";
import { POSTS } from "@/content/posts";

export const metadata: Metadata = {
  title: "Blog",
  description: "Practical notes on working real estate leads: who to call first, how fast, and how to clean a lead export.",
  alternates: { canonical: "/blog" },
};

const fmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export default function BlogIndex() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-14">
      <h1 className="text-4xl font-semibold tracking-tight">Blog</h1>
      <p className="mt-3 text-lg text-muted">Practical notes on working real estate leads.</p>
      <ul className="mt-10 space-y-4">
        {POSTS.map((post) => (
          <li key={post.slug}>
            <Link href={`/blog/${post.slug}`} className="block rounded-2xl border border-line bg-surface p-6 transition-colors hover:border-faint">
              <p className="text-sm text-muted">
                <time dateTime={post.date}>{fmt.format(new Date(post.date))}</time> · {post.minutes} min read
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">{post.title}</h2>
              <p className="mt-2 text-muted">{post.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
