import React from 'react';
import { Mountain, Heart, Github, Twitter, Linkedin, Mail, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const fadeIn = {
    initial: { opacity: 0, y: 28 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] }
  };

  return (
    <motion.footer 
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, amount: 0.3 }}
      className="relative z-10 overflow-hidden border-t border-white/10 bg-[#070707]/95 px-6 py-20 text-white"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(247,185,85,0.12),transparent_28%)] opacity-80" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-500/60 to-transparent" />

      <div className="cinematic-surface spotlight-border relative mx-auto grid max-w-7xl grid-cols-1 gap-12 rounded-[38px] p-8 md:grid-cols-3 md:p-12 lg:grid-cols-5">
        
        {/* Brand Info */}
        <motion.div variants={fadeIn} className="space-y-6 lg:col-span-2">
          <Link to="/" className="flex items-center gap-3">
            <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 p-3 text-white shadow-[0_20px_45px_rgba(249,115,22,0.35)]">
              <Mountain size={24}/>
            </div>
            <h3 className="text-3xl font-black tracking-tighter uppercase italic leading-none">M-Mate</h3>
          </Link>
          <p className="max-w-sm text-sm font-medium leading-relaxed text-white/60">
            A cinematic basecamp for the Himalayas: curated stays, reliable rides, and journey planning that feels precise from the first click.
          </p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">
            Designed with <Heart size={12} className="inline-block text-red-500 fill-red-500" /> for the adventurous spirit.
          </p>
        </motion.div>

        {/* Quick Links */}
        <motion.div variants={fadeIn} className="space-y-6">
          <h4 className="text-sm font-black uppercase tracking-widest text-white">Expedition Hub</h4>
          <ul className="space-y-3">
            <li><Link to="/explore-stays" className="text-white/70 hover:text-orange-500 transition-colors text-sm font-medium">Elite Stays</Link></li>
            <li><Link to="/explore-rides" className="text-white/70 hover:text-orange-500 transition-colors text-sm font-medium">Fleet Services</Link></li>
            <li><Link to="/bookings" className="text-white/70 hover:text-orange-500 transition-colors text-sm font-medium">My Expeditions</Link></li>
            <li><Link to="/profile" className="text-white/70 hover:text-orange-500 transition-colors text-sm font-medium">My Profile</Link></li>
          </ul>
        </motion.div>

        {/* Partner Links */}
        <motion.div variants={fadeIn} className="space-y-6">
          <h4 className="text-sm font-black uppercase tracking-widest text-white">Partner Portal</h4>
          <ul className="space-y-3">
            <li><Link to="/add-hotel" className="text-white/70 hover:text-orange-500 transition-colors text-sm font-medium">List Your Stay</Link></li>
            <li><Link to="/add-transport" className="text-white/70 hover:text-orange-500 transition-colors text-sm font-medium">Offer a Ride</Link></li>
            <li><Link to="/admin-mate" className="text-white/70 hover:text-orange-500 transition-colors text-sm font-medium">Admin Console</Link></li>
            <li><Link to="/register-partner" className="text-white/70 hover:text-orange-500 transition-colors text-sm font-medium">Join as Partner</Link></li>
          </ul>
        </motion.div>

        {/* Contact & Social */}
        <motion.div variants={fadeIn} className="space-y-6">
          <h4 className="text-sm font-black uppercase tracking-widest text-white">Connect</h4>
          <ul className="space-y-3">
            <li className="flex items-center gap-3 text-white/70 text-sm font-medium">
              <Mail size={16} className="text-orange-500" />
              <span>support@mountainmate.com</span>
            </li>
            <li className="flex items-center gap-3 text-white/70 text-sm font-medium">
              <Phone size={16} className="text-orange-500" />
              <span>+91 98765 43210</span>
            </li>
          </ul>
          <div className="flex gap-4 pt-4">
            <a href="#" className="text-white/40 hover:text-white transition-colors">
              <Github size={20} />
            </a>
            <a href="#" className="text-white/40 hover:text-white transition-colors">
              <Twitter size={20} />
            </a>
            <a href="#" className="text-white/40 hover:text-white transition-colors">
              <Linkedin size={20} />
            </a>
          </div>
        </motion.div>
      </div>

      <div className="mt-10 text-center text-[10px] font-bold uppercase tracking-widest text-white/30">
        &copy; {currentYear} Mountain Mate. All Rights Reserved. Engineered for the Peaks.
      </div>
    </motion.footer>
  );
};

export default Footer;
