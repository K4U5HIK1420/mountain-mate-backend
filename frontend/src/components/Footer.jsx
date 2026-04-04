import React from "react";
import { ArrowUp, Instagram, Linkedin, Mail, Phone, ShieldCheck, Twitter } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Container } from "./ui/Container";
import { Button } from "./ui/Button";

const platformLinks = [
  { label: "Elite Stays", to: "/explore-stays" },
  { label: "Fleet Services", to: "/explore-rides" },
  { label: "AI Planner", to: "/planner" },
  { label: "Profile Hub", to: "/profile" },
];

const partnerLinks = [
  { label: "List Your Stay", to: "/add-hotel" },
  { label: "Offer a Ride", to: "/add-transport" },
  { label: "Admin Console", to: "/admin-mate" },
  { label: "Join as Partner", to: "/register-partner" },
];

const companyLinks = [
  { label: "About", to: "/" },
  { label: "Contact", to: "/support" },
  { label: "Privacy Policy", to: "/" },
  { label: "Terms", to: "/" },
];

const socials = [
  { label: "Twitter", href: "https://twitter.com", icon: Twitter },
  { label: "LinkedIn", href: "https://linkedin.com", icon: Linkedin },
  { label: "Instagram", href: "https://instagram.com", icon: Instagram },
];

function FooterColumn({ title, items }) {
  return (
    <div>
      <h4 className="text-[10px] font-black uppercase tracking-[0.28em] text-white/45">{title}</h4>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item.label}>
            <Link
              to={item.to}
              className="text-sm text-white/68 transition-colors duration-300 hover:text-orange-300"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <motion.footer
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-10 mt-20 border-t border-white/10 bg-[#060606]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(249,115,22,0.18),transparent_34%),linear-gradient(180deg,rgba(10,10,10,0.88),#050505)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/65 to-transparent" />

      <Container className="relative z-10 px-4 pb-10 pt-14 md:pt-16">
        <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(140deg,rgba(255,255,255,0.06),rgba(255,255,255,0.01)),rgba(8,8,8,0.86)] p-6 backdrop-blur-2xl md:p-8">
          <div className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.32em] text-orange-300">From booking to basecamp</p>
              <h3 className="mt-2 text-2xl font-black uppercase italic tracking-tight text-white md:text-3xl">
                Start Planning Your Journey
              </h3>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button as={Link} to="/planner" size="sm" className="rounded-xl px-5 py-3 tracking-[0.16em]">
                Plan Now
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={scrollToTop} className="rounded-xl px-5 py-3 tracking-[0.14em]">
                <ArrowUp size={14} />
                Back To Top
              </Button>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
            <div className="sm:col-span-2 lg:col-span-1">
              <Link to="/" className="inline-flex items-center gap-3">
                <img
                  src="/mountain-mate-mark.svg"
                  alt="Mountain Mate"
                  className="h-11 w-11 rounded-xl border border-white/10 shadow-[0_14px_30px_rgba(249,115,22,0.28)]"
                />
                <span className="text-xl font-black uppercase italic tracking-tight text-white">Mountain Mate</span>
              </Link>
              <p className="mt-4 text-sm leading-7 text-white/62">
                Premium platform for Uttarakhand travel planning with verified stays, reliable rides, and one clean flow.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200">
                <ShieldCheck size={12} />
                Trusted by travelers
              </div>
            </div>

            <FooterColumn title="Platform" items={platformLinks} />
            <FooterColumn title="For Partners" items={partnerLinks} />
            <FooterColumn title="Company" items={companyLinks} />

            <div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.28em] text-white/45">Contact & Social</h4>
              <div className="mt-4 space-y-3">
                <a
                  href="mailto:mountainmate.app@mail.com"
                  className="flex items-center gap-2 text-sm text-white/68 transition-colors hover:text-orange-300"
                >
                  <Mail size={14} className="text-orange-300" />
                  mountainmate.app@mail.com
                </a>
                <a
                  href="tel:+919876543210"
                  className="flex items-center gap-2 text-sm text-white/68 transition-colors hover:text-orange-300"
                >
                  <Phone size={14} className="text-orange-300" />
                  +91 98765 43210
                </a>
              </div>
              <div className="mt-4 flex gap-2">
                {socials.map((item) => {
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={item.label}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-white/5 text-white/65 transition-all duration-300 hover:-translate-y-0.5 hover:border-orange-300/35 hover:text-orange-300"
                    >
                      <Icon size={14} />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-white/10 pt-5 text-center text-[10px] font-bold uppercase tracking-[0.24em] text-white/35">
            © {year} Mountain Mate. All rights reserved.
          </div>
        </div>
      </Container>
    </motion.footer>
  );
}
