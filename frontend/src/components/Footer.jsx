import { FaTelegram, FaTwitter, FaInstagram } from "react-icons/fa";
import { Activity } from "lucide-react";

export default function Footer() {
  return (
    <footer className="footer py-8 px-4 md:px-8" data-testid="footer">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cricket-blue to-cricket-lightBlue flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-score text-lg font-bold text-white">KSP CRICKET</h2>
              <p className="text-xs text-muted-foreground">Live Cricket Scores</p>
            </div>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            <a 
              href="https://t.me/KSPCricketBot" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-stadium-subtle flex items-center justify-center text-muted-foreground hover:text-cricket-telegram hover:bg-cricket-telegram/10 transition-all"
              data-testid="footer-telegram"
            >
              <FaTelegram className="w-5 h-5" />
            </a>
            <a 
              href="#" 
              className="w-10 h-10 rounded-full bg-stadium-subtle flex items-center justify-center text-muted-foreground hover:text-cricket-blue hover:bg-cricket-blue/10 transition-all"
              data-testid="footer-twitter"
            >
              <FaTwitter className="w-5 h-5" />
            </a>
            <a 
              href="#" 
              className="w-10 h-10 rounded-full bg-stadium-subtle flex items-center justify-center text-muted-foreground hover:text-pink-500 hover:bg-pink-500/10 transition-all"
              data-testid="footer-instagram"
            >
              <FaInstagram className="w-5 h-5" />
            </a>
          </div>

          {/* Copyright */}
          <p className="text-sm text-muted-foreground">
            © 2026 KSP Cricket. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
