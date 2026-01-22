import { Link, useLocation } from "react-router-dom";
import { FaTelegram } from "react-icons/fa";
import { Activity, Home, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const location = useLocation();
  
  const isActive = (path) => location.pathname === path;
  
  return (
    <nav className="navbar sticky top-0 z-50 px-4 md:px-8 py-4" data-testid="navbar">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3" data-testid="logo-link">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cricket-blue to-cricket-lightBlue flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-score text-xl md:text-2xl font-bold text-white tracking-wide">
              KSP CRICKET
            </h1>
            <p className="text-[10px] text-muted-foreground -mt-1 hidden sm:block">
              LIVE SCORES
            </p>
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-2 md:gap-4">
          <Link to="/">
            <Button 
              variant={isActive("/") ? "secondary" : "ghost"} 
              size="sm"
              className="gap-2"
              data-testid="home-nav-btn"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </Button>
          </Link>
          
          <Link to="/subscribe">
            <Button 
              variant={isActive("/subscribe") ? "secondary" : "ghost"}
              size="sm"
              className="gap-2"
              data-testid="subscribe-nav-btn"
            >
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Alerts</span>
            </Button>
          </Link>

          {/* Telegram Button */}
          <a 
            href="https://t.me/KSPCricketBot" 
            target="_blank" 
            rel="noopener noreferrer"
            data-testid="telegram-nav-btn"
          >
            <Button 
              className="telegram-btn gap-2 btn-press"
              size="sm"
            >
              <FaTelegram className="w-4 h-4" />
              <span className="hidden sm:inline">Telegram</span>
            </Button>
          </a>
        </div>
      </div>
    </nav>
  );
}
