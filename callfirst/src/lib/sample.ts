/** A realistic messy export: mixed formats, a duplicate, a broker, junk numbers. Dates are relative to today. */
export function sampleCsv(now: number = Date.now()): string {
  const day = (n: number) => new Date(now - n * 86400000).toISOString().slice(0, 16).replace("T", " ");
  const rows = [
    ["Rohit Sharma", "p:+919812045671", "rohit.s@example.com", "1.8 Cr", "3 BHK", "Gurugram", "Google Search", "Want to do a site visit this weekend. Please share payment plan.", day(0.3)],
    ["Priya Menon", "9820011432", "", "2 - 2.5 cr", "4 BHK", "Gurugram", "Website", "Is the 4 BHK still available? Call me back today.", day(0.6)],
    ["Amit Verma", "098110 55234", "amitv@example.com", "90 lakh", "2 BHK", "Faridabad", "Facebook", "", day(1)],
    ["Sneha Kapoor", "+971 50 123 4567", "sneha.k@example.com", "3 Cr", "4 BHK", "Dubai", "Instagram", "NRI buyer. What is the possession date and is it RERA approved?", day(2)],
    ["Karan Malhotra", "9999999999", "", "", "", "", "Facebook", "", day(2)],
    ["Pooja Iyer", "9711200345", "pooja.iyer@example.com", "1.5 crore", "3 BHK", "Delhi", "Referral", "Friend lives in phase 1. Looking for price and floor plan.", day(3)],
    ["Vivek Gupta", "9650088712", "", "", "3 BHK", "Gurugram", "99acres", "Channel partner here, we have clients for your project.", day(3)],
    ["Anjali Singh", "9873300129", "", "60 L", "2 BHK", "Noida", "Facebook", "Just browsing", day(4)],
    ["Rohit Sharma", "9812045671", "", "1.8 Cr", "3 BHK", "Gurugram", "Facebook", "", day(6)],
    ["Manish Jain", "9310455210", "manish.j@example.com", "above 2 cr", "3 BHK", "Gurugram", "Google Search", "Need home loan details and EMI.", day(5)],
    ["Ritu Bansal", "9.19811E+11", "", "1.2 Cr", "3 BHK", "Gurugram", "Facebook", "", day(7)],
    ["Sahil Arora", "8826011745", "", "1.6 Cr", "3 BHK", "Gurugram", "Instagram", "Share brochure", day(9)],
    ["Deepa Nair", "9958044321", "deepa.n@example.com", "", "", "Delhi", "Website", "Any jobs open in your sales team?", day(10)],
    ["Nitin Chopra", "9717066580", "", "2.2 Cr", "4 BHK", "Gurugram", "Walk-in", "Visited sample flat, wants cost sheet.", day(12)],
    ["Kavita Rao", "9899012276", "", "75 lakh", "3 BHK", "Ghaziabad", "Facebook", "", day(20)],
    ["Arjun Mehta", "9811733402", "arjun.m@example.com", "1.9 Cr", "3 BHK", "Gurugram", "Google Search", "Ready to book if the payment plan works.", day(1.5)],
    ["Meera Pillai", "9540021188", "", "", "3 BHK", "Gurugram", "Instagram", "", day(45)],
    ["Tarun Khanna", "", "tarun.k@example.com", "1.7 Cr", "3 BHK", "Gurugram", "Website", "Please email the price sheet.", day(2)],
  ];
  const header = ["full_name", "phone_number", "email", "budget", "bhk", "city", "platform", "comments", "created_time"];
  const quote = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  return [header, ...rows].map((r) => r.map(quote).join(",")).join("\n");
}

export const SAMPLE_SETTINGS = {
  projectName: "Skyline Residences",
  agentName: "Asha",
  priceMinLakh: 150,
  priceMaxLakh: 240,
  configs: ["3 BHK", "4 BHK"],
  locations: ["Gurugram", "Delhi"],
};
