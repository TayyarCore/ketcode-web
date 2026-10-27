"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage, Language } from "../../lib/ai-sales-assistant";

type LeadForm = {
  name: string;
  contactMethod: "email" | "phone" | "whatsapp";
  contact: string;
  consent: boolean;
};

const copy = {
  ar: {
    title: "مساعد Ket Code",
    subtitle: "لنحدد احتياج موقعك",
    welcome: "أهلًا بك! 👋 هل تريد تصميم موقع جديد أم تطوير موقع حالي؟",
    choices: ["تصميم موقع جديد", "تطوير موقع حالي", "أريد استشارة عن موقعي"],
    placeholder: "اكتب رسالتك هنا...",
    send: "إرسال",
    sending: "جارٍ التفكير...",
    notice: "مساعد بالذكاء الاصطناعي. لا تشارك كلمات مرور أو بيانات دفع أو معلومات حساسة.",
    status: "مساعد ذكاء اصطناعي",
    close: "إغلاق",
    open: "تحدث معنا",
    followUp: "طلب متابعة بشرية",
    followUpTitle: "بيانات التواصل",
    name: "الاسم",
    contactMethod: "طريقة التواصل",
    email: "البريد الإلكتروني",
    phone: "اتصال هاتفي",
    whatsapp: "واتساب",
    contact: "البريد أو رقم الهاتف",
    consent: "أوافق على حفظ هذه البيانات والمحادثة ليتواصل معي فريق Ket Code.",
    submitLead: "إرسال الطلب",
    saving: "جارٍ الحفظ...",
    leadSaved: "تم استلام طلبك. سيتواصل معك فريق Ket Code بعد مراجعة الاحتياج.",
    cancel: "إلغاء",
    turnLimit: "وصلت المحادثة إلى الحد المسموح. يمكنك طلب متابعة بشرية.",
    genericError: "تعذر إكمال الطلب الآن. حاول مرة أخرى.",
  },
  en: {
    title: "Ket Code Assistant",
    subtitle: "Let's define your website needs",
    welcome: "Welcome! 👋 Do you need a new website or improvements to an existing one?",
    choices: ["Design a new website", "Improve my current website", "I need website advice"],
    placeholder: "Type your message...",
    send: "Send",
    sending: "Thinking...",
    notice: "AI assistant. Do not share passwords, payment details, or sensitive information.",
    status: "AI assistant",
    close: "Close",
    open: "Chat with us",
    followUp: "Request human follow-up",
    followUpTitle: "Contact details",
    name: "Name",
    contactMethod: "Contact method",
    email: "Email",
    phone: "Phone call",
    whatsapp: "WhatsApp",
    contact: "Email or phone number",
    consent: "I agree that Ket Code may store these details and this conversation to contact me.",
    submitLead: "Send request",
    saving: "Saving...",
    leadSaved: "Your request was received. The Ket Code team will review it and contact you.",
    cancel: "Cancel",
    turnLimit: "This chat has reached its message limit. You can request a human follow-up.",
    genericError: "The request could not be completed. Please try again.",
  },
} as const;

function firstMessage(language: Language): ChatMessage {
  return { role: "assistant", content: copy[language].welcome };
}

export default function ChatDemo() {
  const [open, setOpen] = useState(true);
  const [language, setLanguage] = useState<Language>("ar");
  const [messages, setMessages] = useState<ChatMessage[]>([firstMessage("ar")]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadForm, setLeadForm] = useState<LeadForm>({ name: "", contactMethod: "email", contact: "", consent: false });
  const [isSavingLead, setIsSavingLead] = useState(false);
  const [leadSaved, setLeadSaved] = useState(false);
  const sessionId = useRef("");
  const end = useRef<HTMLDivElement>(null);
  const text = copy[language];
  const userTurns = messages.filter((message) => message.role === "user").length;

  useEffect(() => {
    sessionId.current ||= crypto.randomUUID();
  }, []);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, open, showLeadForm, error]);

  function switchLanguage(nextLanguage: Language) {
    setLanguage(nextLanguage);
    setMessages([firstMessage(nextLanguage)]);
    setInput("");
    setError("");
    setShowLeadForm(false);
    setLeadSaved(false);
    sessionId.current = crypto.randomUUID();
  }

  async function send(value: string) {
    const content = value.trim().slice(0, 500);
    if (!content || isSending) return;
    if (userTurns >= 5) {
      setError(text.turnLimit);
      return;
    }

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setError("");
    setIsSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionId.current, language, messages: nextMessages.slice(-10) }),
      });
      const payload = (await response.json()) as { reply?: string; error?: string };
      if (!response.ok || !payload.reply) throw new Error(payload.error || text.genericError);
      setMessages((current) => [...current, { role: "assistant", content: payload.reply as string }]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : text.genericError);
    } finally {
      setIsSending(false);
    }
  }

  async function submitLead(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!leadForm.consent || isSavingLead) return;

    setError("");
    setIsSavingLead(true);
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...leadForm,
          sessionId: sessionId.current,
          language,
          sourcePage: window.location.href,
          messages: messages.slice(-10),
        }),
      });
      const payload = (await response.json()) as { saved?: boolean; error?: string };
      if (!response.ok || !payload.saved) throw new Error(payload.error || text.genericError);
      setLeadSaved(true);
      setShowLeadForm(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : text.genericError);
    } finally {
      setIsSavingLead(false);
    }
  }

  return (
    <div className="fixed bottom-5 left-5 z-50 sm:bottom-7 sm:left-7">
      {open ? (
        <section role="dialog" aria-label={text.title} dir={language === "ar" ? "rtl" : "ltr"} className="flex h-[min(680px,calc(100dvh-40px))] w-[min(400px,calc(100vw-40px))] flex-col overflow-hidden rounded-[26px] border border-white/15 bg-[#101c30] shadow-2xl shadow-black/60">
          <div className="flex items-center justify-between bg-[#162840] px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-400 text-lg font-black text-[#082329]">K</div>
              <div><h2 className="font-bold">{text.title}</h2><p className="text-xs text-slate-300">{text.subtitle}</p></div>
            </div>
            <button onClick={() => setOpen(false)} aria-label={text.close} className="rounded-lg px-3 py-2 text-xl text-slate-300 hover:bg-white/10">×</button>
          </div>

          <div className="flex items-center justify-between border-b border-white/10 px-5 py-3 text-xs">
            <span className="flex items-center gap-2 text-teal-300"><span className="h-2 w-2 rounded-full bg-teal-400" />{text.status}</span>
            <div className="flex gap-2">
              <button onClick={() => switchLanguage("ar")} className={language === "ar" ? "font-bold text-teal-300" : "text-slate-400"}>العربية</button><span className="text-slate-600">|</span>
              <button onClick={() => switchLanguage("en")} className={language === "en" ? "font-bold text-teal-300" : "text-slate-400"}>English</button>
            </div>
          </div>

          <div aria-live="polite" className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[86%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-7 ${message.role === "user" ? "bg-teal-400 text-slate-950" : "border border-white/10 bg-[#1c2e48] text-slate-100"}`}>{message.content}</div>
              </div>
            ))}

            {userTurns === 0 && !isSending && <div className="flex flex-wrap gap-2">{text.choices.map((choice) => <button key={choice} onClick={() => send(choice)} className="rounded-xl border border-teal-400/40 bg-teal-400/10 px-3 py-2 text-xs text-teal-200 hover:bg-teal-400/20">{choice}</button>)}</div>}
            {isSending && <p className="text-xs text-slate-400">{text.sending}</p>}
            {error && <p role="alert" className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs leading-5 text-amber-200">{error}</p>}
            {leadSaved && <p className="rounded-xl border border-teal-400/30 bg-teal-400/10 px-3 py-3 text-sm leading-6 text-teal-100">{text.leadSaved}</p>}

            {showLeadForm && !leadSaved && (
              <form onSubmit={submitLead} className="space-y-3 rounded-2xl border border-white/10 bg-[#0b1526] p-4">
                <h3 className="font-bold">{text.followUpTitle}</h3>
                <input required minLength={2} maxLength={100} value={leadForm.name} onChange={(event) => setLeadForm((current) => ({ ...current, name: event.target.value }))} placeholder={text.name} aria-label={text.name} className="w-full rounded-xl border border-white/10 bg-[#101c30] px-3 py-2 text-sm" />
                <select value={leadForm.contactMethod} onChange={(event) => setLeadForm((current) => ({ ...current, contactMethod: event.target.value as LeadForm["contactMethod"] }))} aria-label={text.contactMethod} className="w-full rounded-xl border border-white/10 bg-[#101c30] px-3 py-2 text-sm">
                  <option value="email">{text.email}</option><option value="phone">{text.phone}</option><option value="whatsapp">{text.whatsapp}</option>
                </select>
                <input required minLength={5} maxLength={160} value={leadForm.contact} onChange={(event) => setLeadForm((current) => ({ ...current, contact: event.target.value }))} placeholder={text.contact} aria-label={text.contact} className="w-full rounded-xl border border-white/10 bg-[#101c30] px-3 py-2 text-sm" />
                <label className="flex items-start gap-2 text-xs leading-5 text-slate-300"><input required type="checkbox" checked={leadForm.consent} onChange={(event) => setLeadForm((current) => ({ ...current, consent: event.target.checked }))} className="mt-1" /><span>{text.consent}</span></label>
                <div className="flex gap-2"><button disabled={!leadForm.consent || isSavingLead} className="rounded-xl bg-teal-400 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-40">{isSavingLead ? text.saving : text.submitLead}</button><button type="button" onClick={() => setShowLeadForm(false)} className="rounded-xl border border-white/15 px-4 py-2 text-sm text-slate-300">{text.cancel}</button></div>
              </form>
            )}
            <div ref={end} />
          </div>

          {!showLeadForm && !leadSaved && <button onClick={() => setShowLeadForm(true)} className="mx-4 mb-3 rounded-xl border border-teal-400/40 px-4 py-2 text-sm font-semibold text-teal-200 hover:bg-teal-400/10">{text.followUp}</button>}
          <form onSubmit={(event) => { event.preventDefault(); send(input); }} className="flex gap-2 border-t border-white/10 p-4">
            <input aria-label={text.placeholder} maxLength={500} value={input} onChange={(event) => setInput(event.target.value)} placeholder={text.placeholder} disabled={isSending || userTurns >= 5} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#0b1526] px-4 py-3 text-sm text-white placeholder:text-slate-500 disabled:opacity-50" />
            <button disabled={!input.trim() || isSending || userTurns >= 5} className="rounded-xl bg-teal-400 px-4 py-3 text-sm font-bold text-slate-950 disabled:opacity-40">{text.send}</button>
          </form>
          <p className="px-5 pb-3 text-center text-[10px] leading-4 text-slate-400">{text.notice}</p>
        </section>
      ) : <button onClick={() => setOpen(true)} className="flex items-center gap-3 rounded-full bg-teal-400 px-6 py-4 font-bold text-slate-950 shadow-2xl shadow-black/50"><span className="text-xl">✦</span>{text.open}</button>}
    </div>
  );
}
