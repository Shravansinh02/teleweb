import { useState, useEffect } from "react";
import axios from "axios";
import { FaTelegram } from "react-icons/fa";
import { Bell, MessageCircle, Zap, Shield, Users, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function SubscribePage() {
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [botInfo, setBotInfo] = useState(null);

  useEffect(() => {
    // Fetch subscriber count
    axios.get(`${API}/subscribers`)
      .then(res => {
        if (res.data.status === "success") {
          setSubscriberCount(res.data.active_subscribers);
        }
      })
      .catch(console.error);

    // Fetch bot info
    axios.get(`${API}/telegram/bot-info`)
      .then(res => {
        if (res.data.status === "success") {
          setBotInfo(res.data);
        }
      })
      .catch(console.error);
  }, []);

  const botUsername = botInfo?.bot_username || "KSPCricketBot";

  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Instant Score Updates",
      description: "Get live score updates the moment they happen"
    },
    {
      icon: <Bell className="w-6 h-6" />,
      title: "Match Alerts",
      description: "Never miss a match start or key moment"
    },
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: "Bot Commands",
      description: "Use simple commands like /score, /matches"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Free Forever",
      description: "No ads, no premium, completely free"
    }
  ];

  const commands = [
    { cmd: "/start", desc: "Welcome message और help" },
    { cmd: "/score", desc: "Current live scores देखें" },
    { cmd: "/matches", desc: "All current matches list" },
    { cmd: "/subscribe", desc: "Alerts के लिए subscribe करें" },
    { cmd: "/unsubscribe", desc: "Alerts बंद करें" }
  ];

  return (
    <div className="min-h-screen py-8 md:py-12 px-4 md:px-8" data-testid="subscribe-page">
      <div className="max-w-4xl mx-auto">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="w-20 h-20 rounded-3xl bg-cricket-telegram/20 flex items-center justify-center mx-auto mb-6">
            <FaTelegram className="w-12 h-12 text-cricket-telegram" />
          </div>
          
          <h1 className="font-score text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Get <span className="text-cricket-telegram">Telegram</span> Alerts
          </h1>
          
          <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-6">
            Subscribe to our Telegram bot and receive instant cricket score updates, match alerts, and more!
          </p>

          {/* Subscriber Count */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cricket-live/10 border border-cricket-live/20 mb-8">
            <Users className="w-4 h-4 text-cricket-live" />
            <span className="text-sm text-cricket-live font-medium">
              {subscriberCount}+ active subscribers
            </span>
          </div>

          {/* CTA Button */}
          <div>
            <a 
              href={`https://t.me/${botUsername}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button 
                className="telegram-btn gap-3 btn-press text-lg px-8 py-6"
                size="lg"
                data-testid="subscribe-main-btn"
              >
                <FaTelegram className="w-6 h-6" />
                Open in Telegram
              </Button>
            </a>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12"
        >
          {features.map((feature, idx) => (
            <Card 
              key={idx}
              className="match-card p-6 flex items-start gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-cricket-blue/10 flex items-center justify-center flex-shrink-0 text-cricket-blue">
                {feature.icon}
              </div>
              <div>
                <h3 className="font-score text-lg font-bold text-white mb-1">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </Card>
          ))}
        </motion.div>

        {/* Bot Commands */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="match-card p-6 md:p-8">
            <h2 className="font-score text-xl md:text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <MessageCircle className="w-6 h-6 text-cricket-telegram" />
              Bot Commands
            </h2>
            
            <div className="space-y-4">
              {commands.map((item, idx) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between p-4 bg-stadium-subtle rounded-xl"
                >
                  <code className="font-mono text-cricket-telegram font-semibold">
                    {item.cmd}
                  </code>
                  <span className="text-sm text-muted-foreground">
                    {item.desc}
                  </span>
                </div>
              ))}
            </div>

            {/* How to Start */}
            <div className="mt-8 p-6 bg-cricket-telegram/5 border border-cricket-telegram/20 rounded-xl">
              <h3 className="font-score text-lg font-bold text-white mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-cricket-live" />
                How to Start
              </h3>
              <ol className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-cricket-blue text-white flex items-center justify-center text-sm flex-shrink-0">1</span>
                  <span>Click "Open in Telegram" button above</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-cricket-blue text-white flex items-center justify-center text-sm flex-shrink-0">2</span>
                  <span>Press "START" in Telegram app</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-cricket-blue text-white flex items-center justify-center text-sm flex-shrink-0">3</span>
                  <span>Type /subscribe to get match alerts</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-cricket-live text-white flex items-center justify-center text-sm flex-shrink-0">✓</span>
                  <span>Done! You'll receive live score updates</span>
                </li>
              </ol>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
