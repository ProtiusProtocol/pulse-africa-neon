import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="w-full border-t border-primary/20 bg-card mt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="text-2xl font-bold">
              <span className="text-primary text-glow-primary">Augurion</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Outcome Intelligence Before Markets Move.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h3 className="font-bold text-foreground mb-4">Platform</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/how-it-works" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/early-access" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Early Access
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-bold text-foreground mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <a href="https://augurionpete.substack.com" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Learn
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Terms
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Privacy
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-bold text-foreground mb-4">Community</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  𝕏 Twitter
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Telegram
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border mt-8 pt-8">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-primary to-transparent opacity-50 animate-pulse-glow" />
          <p className="text-center text-sm text-muted-foreground mt-4">
            © 2025 Augurion. Outcome Intelligence Before Markets Move.
          </p>
        </div>
      </div>
    </footer>
  );
};
