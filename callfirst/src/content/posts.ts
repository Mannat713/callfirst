export interface Post {
  slug: string;
  title: string;
  description: string;
  date: string;
  minutes: number;
  /** Each block is a heading or a paragraph. Kept as data so posts need no extra tooling. */
  body: Array<{ h?: string; p?: string; list?: string[] }>;
}

export const POSTS: Post[] = [
  {
    slug: "how-to-prioritise-real-estate-leads",
    title: "How to prioritise real estate leads when you have 300 and one afternoon",
    description:
      "A simple, repeatable way to decide which property enquiries to call first, using intent and fit instead of the order they arrived in.",
    date: "2026-11-18",
    minutes: 6,
    body: [
      { p: "Most sales teams work a lead sheet from the top down. The top of the sheet is whoever enquired first, or whoever the export happened to list first. Neither has anything to do with who is most likely to book a site visit." },
      { p: "Calling in the wrong order is expensive in a quiet way. The buyer who asked for a visit this morning waits until Thursday. By then they have spoken to two other projects. Meanwhile your team has spent the afternoon on wrong numbers and people who were just browsing." },
      { h: "Two questions decide the order" },
      { p: "Every enquiry can be judged on two things. The first is intent: how much does this person want to act now? The second is fit: could they actually buy what you are selling? A lead needs both. High intent with no fit wastes a call. Good fit with no intent can wait." },
      { h: "Reading intent from what you already have" },
      { list: [
        "Recency. An enquiry from the last 24 hours is worth far more than one from last week. Interest cools quickly.",
        "What they wrote. \"Can I visit on Saturday?\" and \"please share the payment plan\" are buying questions. A blank message is not.",
        "Where they came from. Someone who searched for your project by name was looking for you. Someone who tapped an ad while scrolling was not.",
        "Whether you can reach them. A working phone number matters more than a perfect profile.",
      ] },
      { h: "Reading fit" },
      { list: [
        "Budget against your price range. A buyer at 75 lakh will not stretch to a 1.8 crore home, however keen they sound.",
        "Configuration. If they want a 2 BHK and you sell 3 and 4 BHK, say so early and move on.",
        "Location. Buyers already living or working near the project convert more often than those who would be relocating.",
      ] },
      { h: "Clear out the noise first" },
      { p: "Before ranking anything, remove what should never be called: duplicate enquiries from the same number, numbers that are obviously fake, brokers posing as buyers, and people asking about jobs. On a typical ad export this is a fifth to a third of the sheet." },
      { h: "Then sort into four piles" },
      { list: [
        "Call today: fresh, asked a buying question, and fits the project.",
        "This week: fits, but less urgent, or urgent with a question mark over fit.",
        "Nurture: send the brochure and check back in a fortnight.",
        "Skip: duplicates, dead numbers and everyone who is not a buyer.",
      ] },
      { p: "You can do this by hand with a few extra columns in a spreadsheet. It takes about an hour per few hundred leads. CallFirst does the same thing in a few seconds and shows the reason beside each rank, so your team can disagree with it when they know better." },
    ],
  },
  {
    slug: "lead-response-time-real-estate",
    title: "Why the first hour matters more than the first call script",
    description:
      "Property buyers enquire with several projects at once. Here is how to make sure the fresh enquiries are the ones your team reaches first.",
    date: "2026-11-15",
    minutes: 4,
    body: [
      { p: "A home buyer rarely enquires about one project. They fill three or four forms in an evening and then talk to whoever calls back while they are still thinking about it." },
      { p: "That makes speed a feature of your sales process, not just a nice habit. The team that calls within the hour is having a conversation. The team that calls in three days is interrupting one." },
      { h: "Why fast teams still call slowly" },
      { p: "Most teams want to respond quickly. What stops them is the list. New enquiries land at the bottom of a sheet, under a week of older ones, and nobody can tell at a glance which rows are new, which are duplicates and which are worth the first slot of the day." },
      { h: "A routine that works" },
      { list: [
        "Export leads twice a day, mid-morning and late afternoon, not once a week.",
        "Rank the export before anyone picks up a phone.",
        "Work the fresh, high-intent enquiries first, even if older ones are still open.",
        "When there is no answer, send a short message straight away so they know who called.",
        "Mark the outcome on every call. An honest \"no answer\" is more useful than an empty cell.",
      ] },
      { h: "What to say when they do not pick up" },
      { p: "Keep it to three lines: who you are, which project, and one easy question. \"Hi Priya, this is Asha from Skyline Residences. I tried calling just now. When is a good time to talk for five minutes?\" works better than a brochure and four paragraphs." },
      { p: "CallFirst drafts that message for each lead and opens it in WhatsApp for you to edit and send." },
    ],
  },
  {
    slug: "clean-meta-lead-export",
    title: "Cleaning a Meta lead export: what to fix before your team starts dialling",
    description:
      "Lead form exports arrive with prefixed phone numbers, duplicates and junk entries. A checklist for turning one into a usable call list.",
    date: "2026-11-12",
    minutes: 5,
    body: [
      { p: "A lead export from an ad platform looks tidy until you try to call from it. Phone numbers carry a \"p:\" prefix. Some have turned into 9.19E+11 because a spreadsheet tried to be helpful. One person appears four times because they tapped four ads." },
      { h: "The usual problems" },
      { list: [
        "Prefixes and formats. \"p:+919812045671\", \"098120 45671\" and \"9812045671\" are the same number. They need to become one format before you can spot duplicates.",
        "Scientific notation. If a number shows as 9.19811E+11 the digits are gone. That lead can only be reached by email, if at all.",
        "Fake numbers. 9999999999 and 9876543210 are typed by people who wanted to see the price without being called.",
        "Duplicates. The same buyer enquiring twice is one call, not two. Keep the newest enquiry.",
        "Non-buyers. Brokers, channel partners and job seekers fill in lead forms too.",
      ] },
      { h: "Do not open the CSV in Excel first" },
      { p: "Most of the damage happens when a CSV is opened and saved again in a spreadsheet. Long numbers get rounded and leading zeros vanish. If you need to look at the file, import it as text, or use a tool that reads the raw file." },
      { h: "A five minute checklist" },
      { list: [
        "Normalise every phone number to +91 and ten digits.",
        "Flag anything that is not a real mobile number.",
        "Remove duplicates by phone number, keeping the latest row.",
        "Search the message column for \"broker\", \"channel partner\" and \"job\".",
        "Only then sort by how recent and how promising each enquiry is.",
      ] },
      { p: "CallFirst runs this checklist on import. It reads the raw CSV in your browser, so the file is never uploaded and the numbers are never mangled by a round trip through a spreadsheet." },
    ],
  },
];

export function getPost(slug: string): Post | undefined {
  return POSTS.find((p) => p.slug === slug);
}
