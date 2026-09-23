import React from "react";
import { Link } from "react-router-dom";
import { Smartphone, ShieldCheck, Wrench, Clock, MapPin, Phone, Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm mt-20 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Col 1: Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white">
                <Smartphone className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-base text-white tracking-tight">
                Mobile<span className="text-blue-500">Center</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              Your trusted partner for genuine smartphones, accessories, and certified device repair services.
            </p>
            <div className="flex items-center gap-3 pt-1 text-slate-400 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Certified Technicians & Official Warranty</span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/products" className="hover:text-white transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white transition-colors">
                  Repair Services
                </Link>
              </li>
              <li>
                <Link to="/services/book" className="hover:text-white transition-colors">
                  Book a Repair Ticket
                </Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-white transition-colors">
                  Shopping Cart
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Services */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">
              Repair Offerings
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-center gap-2">
                <Wrench className="w-3.5 h-3.5 text-blue-400" /> Screen & Glass Replacement
              </li>
              <li className="flex items-center gap-2">
                <Wrench className="w-3.5 h-3.5 text-blue-400" /> Original Battery Swap
              </li>
              <li className="flex items-center gap-2">
                <Wrench className="w-3.5 h-3.5 text-blue-400" /> Charging Port Repair
              </li>
              <li className="flex items-center gap-2">
                <Wrench className="w-3.5 h-3.5 text-blue-400" /> Complete Device Diagnostics
              </li>
            </ul>
          </div>

          {/* Col 4: Contact */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">
              Store Info
            </h4>
            <ul className="space-y-3 text-xs">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>101 Tech Avenue, Downtown Retail District</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span>+1 (800) 555-MOBILE</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span>support@mobilecenter.com</span>
              </li>
              <li className="flex items-center gap-2.5 text-slate-400">
                <Clock className="w-4 h-4 shrink-0 text-slate-500" />
                <span>Mon - Sat: 9:00 AM - 8:00 PM</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800/80 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Retail Mobile Shop & Service Management System. PoC Demo.</p>
          <div className="flex items-center gap-6">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>System Status</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
