import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getProfile } from "./study.functions";

// Marathi labels keyed by the English text. Unknown strings fall back to English.
const MR: Record<string, string> = {
  Dashboard: "डॅशबोर्ड",
  "Study Now": "आता शिका",
  Practice: "सराव",
  "Mock Tests": "मॉक टेस्ट",
  Mocks: "मॉक",
  Revision: "उजळणी",
  Plan: "योजना",
  "Study Plan": "अभ्यास योजना",
  Mistakes: "चुका",
  "Mistake Book": "चुकांची वही",
  Progress: "प्रगती",
  Settings: "सेटिंग्ज",
  "Sign out": "बाहेर पडा",
  "Ask your coach to teach any topic — Quant, Reasoning, English or Banking.":
    "कोणताही विषय शिकण्यासाठी तुमच्या कोचला विचारा — गणित, रिझनिंग, इंग्रजी किंवा बँकिंग.",
  "Pick a topic — your coach writes a fresh set at your level.":
    "विषय निवडा — तुमचा कोच तुमच्या पातळीनुसार नवीन प्रश्नसंच तयार करेल.",
  "Tag why you got it wrong, then mark it revised once you've mastered it.":
    "चूक का झाली ते नोंदवा, आणि पक्के झाल्यावर उजळणी पूर्ण म्हणून चिन्हांकित करा.",
  "Your coach uses these to personalise lessons and practice.":
    "तुमचा कोच या माहितीवरून धडे आणि सराव तुमच्यासाठी तयार करतो.",
  "Timed, section-wise practice mocks built on the official IBPS patterns.":
    "अधिकृत IBPS पॅटर्नवर आधारित, वेळेच्या मर्यादेसह विभागवार सराव मॉक.",
};

export function useLang(): "en" | "mr" {
  const fn = useServerFn(getProfile);
  const q = useQuery({ queryKey: ["profile"], queryFn: () => fn(), staleTime: 60_000 });
  return q.data?.language === "mr" ? "mr" : "en";
}

export function useT() {
  const lang = useLang();
  return (text: string) => (lang === "mr" ? (MR[text] ?? text) : text);
}
