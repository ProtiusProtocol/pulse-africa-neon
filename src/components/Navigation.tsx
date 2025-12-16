import { Menu, X, Wallet } from "lucide-react";
import { useState } from "react";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { connectWallet } from "@/lib/algorand";
import { toast } from "sonner";

export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnectWallet = async () => {
    setIsConnecting(true);
    try {
      const address = await connectWallet();
      setWalletAddress(address);
      toast.success("Wallet connected!");
    } catch (error) {
      toast.error("Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  };

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/about", label: "About" },
    { to: "/intelligence", label: "Intelligence" },
    { to: "/markets", label: "Markets" },
    { to: "/dashboard", label: "Dashboard" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <NavLink to="/" className="flex items-center space-x-2 group">
            <div className="text-2xl font-bold">
              <span className="text-primary text-glow-primary">Augurion</span>
              <span className="text-accent text-glow-accent ml-1">Africa</span>
            </div>
          </NavLink>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className="text-muted-foreground hover:text-primary transition-colors font-medium"
                activeClassName="text-primary text-glow-primary"
              >
                {link.label}
              </NavLink>
            ))}
            {walletAddress ? (
              <Button variant="outline" size="sm" className="font-mono text-xs">
                <Wallet className="w-4 h-4 mr-2" />
                {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
              </Button>
            ) : (
              <Button 
                variant="hero" 
                size="sm" 
                onClick={handleConnectWallet}
                disabled={isConnecting}
              >
                <Wallet className="w-4 h-4 mr-2" />
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-foreground"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 space-y-4 animate-slide-down">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className="block text-muted-foreground hover:text-primary transition-colors font-medium py-2"
                activeClassName="text-primary text-glow-primary"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
            {walletAddress ? (
              <Button variant="outline" size="sm" className="w-full font-mono text-xs">
                <Wallet className="w-4 h-4 mr-2" />
                {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
              </Button>
            ) : (
              <Button 
                variant="hero" 
                size="sm" 
                className="w-full"
                onClick={handleConnectWallet}
                disabled={isConnecting}
              >
                <Wallet className="w-4 h-4 mr-2" />
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </Button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};
