// generalFaqs.ts
// 统一 FAQ 页的通用问答(面向"去中国怎么上网"这类还没锁定品牌的搜索流量)。
// 加新问答:照着格式在数组里加一段 { question, answer } 即可。
// answer 里可以放链接(因为 FAQ.astro 用了 set:html),站内链接用相对路径,如 /best-esim-for-china
// JSON 提醒:answer 里若有引号,用 \" 转义;句子里的双引号同理。

export const generalFaqs = [
  {
    question: "What is an eSIM?",
    answer: "An eSIM is a SIM card built into your phone that you activate by downloading a plan instead of inserting a physical card. For travel, it means you can buy and set up a local data plan before you even land — no swapping tiny plastic cards, no hunting for a shop at the airport.",
  },
  {
    question: "Can I use an eSIM in China?",
    answer: "Yes. Most modern phones support eSIM, and travel eSIMs work across mainland China on the local carrier networks. The key thing to check is whether the plan routes your data outside the mainland — that's what lets you use apps like Google and WhatsApp without a separate VPN.",
  },
  {
    question: "What's the difference between an eSIM and a VPN for China?",
    answer: "A VPN is software you install to tunnel around China's app blocks — but VPN apps themselves are often blocked or unreliable inside China, and you have to get them working before you arrive. A travel eSIM that routes data through Hong Kong or elsewhere gives you open access to blocked apps automatically, with nothing extra to install. For most travelers the right eSIM is simpler and more reliable than fighting with a VPN.",
  },
  {
    question: "Which apps are blocked in China?",
    answer: "On a normal Chinese connection, Google (Search, Maps, Gmail), Instagram, Facebook, WhatsApp, YouTube, and many Western news and AI sites are blocked. A travel eSIM that exits outside the mainland lets these load normally — I field-test exactly which apps work on each provider I review.",
  },
  {
    question: "Which eSIM should I buy for China?",
    answer: "It depends on your trip length and what you use most. Rather than copy spec sheets, I test each provider on the ground in China with real speed data and timestamped photos. You can see how the ones I've tested compare in my <a href=\"/best-esim-for-china\">China eSIM comparison</a>.",
  },
];
