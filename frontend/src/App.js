import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import HomePage from "@/pages/HomePage";
import MatchDetailsPage from "@/pages/MatchDetailsPage";
import SubscribePage from "@/pages/SubscribePage";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

function App() {
  return (
    <div className="App min-h-screen flex flex-col">
      <BrowserRouter>
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/match/:matchId" element={<MatchDetailsPage />} />
            <Route path="/subscribe" element={<SubscribePage />} />
          </Routes>
        </main>
        <Footer />
      </BrowserRouter>
      <Toaster position="bottom-right" />
    </div>
  );
}

export default App;
