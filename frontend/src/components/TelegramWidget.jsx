import { FaTelegram } from "react-icons/fa";
import { Bell, MessageCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function TelegramWidget({ botUsername = "KSPCricketBot" }) {
  return (
    <motion.div 
      className="telegram-widget p-6 md:p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      data-testid="telegram-widget"
    >
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-cricket-telegram/20 flex items-center justify-center flex-shrink-0">
          <FaTelegram className="w-9 h-9 text-cricket-telegram" />
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="font-score text-xl md:text-2xl font-bold text-white mb-2">
            Get Live Alerts on Telegram
          </h3>
          <p className="text-muted-foreground text-sm md:text-base mb-4">
            Subscribe to our Telegram bot and never miss a ball! Get instant score updates, match alerts, and more.
          </p>

          {/* Features */}
          <div className="flex flex-wrap gap-4 mb-5">
            <div className="flex items-center gap-2 text-sm text-white/80">
              <Zap className="w-4 h-4 text-cricket-boundary" />
              <span>Instant Updates</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-white/80">
              <Bell className="w-4 h-4 text-cricket-live" />
              <span>Match Alerts</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-white/80">
              <MessageCircle className="w-4 h-4 text-cricket-telegram" />
              <span>Bot Commands</span>
            </div>
          </div>

          {/* CTA */}
          <a 
            href={`https://t.me/${botUsername}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button 
              className="telegram-btn gap-2 btn-press"
              size="lg"
              data-testid="telegram-subscribe-btn"
            >
              <FaTelegram className="w-5 h-5" />
              Subscribe Now
            </Button>
          </a>
        </div>
      </div>
    </motion.div>
  );
}
