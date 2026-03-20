import React from 'react';
import { Mountain, Heart, Github, Twitter, Linkedin, Mail, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: 'easeOut' }
  };

  return (
    <motion.footer 
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, amount: 0.3 }}
      className="bg-[#0d0d0d] border-t border-white/10 text-white py-20 px-6 relative z-10"
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-12">
        
        {/* Brand Info */}
        <motion.div variants={fadeIn} className="space-y-6 lg:col-span-2">
          <Link to="/" className="flex items-center gap-3">
            <div className="bg-orange-600 p-2 rounded-lg text-white shadow-xl">
              <Mountain size={24}/>
            </div>
            <h3 className="text-3xl font-black tracking-tighter uppercase italic leading-none">M-Mate</h3>
          </Link>
          <p className="text-white/50 text-sm font-medium leading-relaxed max-w-sm">
            Your trusted partner in exploring the Himalayas. Curated stays, reliable transport, and unforgettable expeditions.
          </p>
          <p className="text-white/30 text-[10px] uppercase tracking-widest font-bold">
            Designed with <Heart size={12} className="inline-block text-red-500 fill-red-500" /> for the adventurous spirit.
          </p>
        </motion.div>

        {/* Quick Links */}
        <motion.div variants={fadeIn} className="space-y-6">
          <h4 className="text-white font-black text-sm uppercase tracking-widest">Expedition Hub</h4>
          <ul className="space-y-3">
            <li><Link to="/explore-stays" className="text-white/70 hover:text-orange-500 transition-colors text-sm font-medium">Elite Stays</Link></li>
            <li><Link to="/explore-rides" className="text-white/70 hover:text-orange-500 transition-colors text-sm font-medium">Fleet Services</Link></li>
            <li><Link to="/bookings" className="text-white/70 hover:text-orange-500 transition-colors text-sm font-medium">My Expeditions</Link></li>
            <li><Link to="/profile" className="text-white/70 hover:text-orange-500 transition-colors text-sm font-medium">My Profile</Link></li>
          </ul>
        </motion.div>

        {/* Partner Links */}
        <motion.div variants={fadeIn} className="space-y-6">
          <h4 className="text-white font-black text-sm uppercase tracking-widest">Partner Portal</h4>
          <ul className="space-y-3">
            <li><Link to="/add-hotel" className="text-white/70 hover:text-orange-500 transition-colors text-sm font-medium">List Your Stay</Link></li>
            <li><Link to="/add-transport" className="text-white/70 hover:text-orange-500 transition-colors text-sm font-medium">Offer a Ride</Link></li>
            <li><Link to="/admin-mate" className="text-white/70 hover:text-orange-500 transition-colors text-sm font-medium">Admin Console</Link></li>
            <li><Link to="/register-partner" className="text-white/70 hover:text-orange-500 transition-colors text-sm font-medium">Join as Partner</Link></li>
          </ul>
        </motion.div>

        {/* Contact & Social */}
        <motion.div variants={fadeIn} className="space-y-6">
          <h4 className="text-white font-black text-sm uppercase tracking-widest">Connect</h4>
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

      <div className="mt-20 text-center text-white/30 text-[10px] uppercase tracking-widest font-bold">
        &copy; {currentYear} Mountain Mate. All Rights Reserved. Engineered for the Peaks.
      </div>
    </motion.footer>
  );
};

export default Footer;
