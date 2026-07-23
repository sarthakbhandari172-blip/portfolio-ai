"use server";

import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function submitContact(formData: FormData) {
  const honeypot = String(formData.get("company") ?? "");
  const senderName = String(formData.get("name") ?? "").trim();
  const senderEmail = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail);

  if (
    honeypot ||
    senderName.length < 2 ||
    senderName.length > 120 ||
    !validEmail ||
    message.length < 10 ||
    message.length > 5000
  ) {
    redirect("/?contact=invalid#contact");
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) redirect("/?contact=offline#contact");

  const { error } = await supabase.from("contact_messages").insert({
    sender_name: senderName,
    sender_email: senderEmail,
    subject: "Portfolio enquiry",
    message,
  });

  redirect(error ? "/?contact=offline#contact" : "/?contact=sent#contact");
}

