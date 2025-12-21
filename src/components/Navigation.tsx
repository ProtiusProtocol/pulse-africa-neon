import { Menu, X, Wallet, LogOut, Copy, Check } from "lucide-react";
import { useState } from "react";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/contexts/WalletContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { walletAddress, isConnecting, connect, disconnect } = useWallet();

  const handleCopyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/intelligence", label: "Markets with Signals" },
    { to: "/markets", label: "Markets with Trades" },
    { to: "/dashboard", label: "Your Dashboard" },
  ];

  const externalLinks = [
    { href: "https://protiuspete.substack.com", label: "Learn" },
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
          <div className="hidden md:flex items-center space-x-6 text-sm">
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
            {externalLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors font-medium"
              >
                {link.label}
              </a>
            ))}
            {walletAddress ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="font-mono text-xs">
                    <Wallet className="w-4 h-4 mr-2 text-primary" />
                    {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleCopyAddress} className="cursor-pointer">
                    {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    Copy Address
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={disconnect} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                variant="hero" 
                size="sm" 
                onClick={connect}
                disabled={isConnecting}
              >
                <Wallet className="w-4 h-4 mr-2" />
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </Button>
            )}
          </div>

          {/* Mobile Menu Button - 44px min touch target */}
          <button
            className="md:hidden text-foreground min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 space-y-1 animate-slide-down">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className="block text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors font-medium py-3 px-2 rounded-md min-h-[44px] flex items-center"
                activeClassName="text-primary text-glow-primary bg-primary/10"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
            {externalLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors font-medium py-3 px-2 rounded-md min-h-[44px] flex items-center"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </a>
            ))}
            {walletAddress ? (
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full font-mono text-xs justify-between">
                  <span className="flex items-center">
                    <Wallet className="w-4 h-4 mr-2 text-primary" />
                    {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
                  </span>
                </Button>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="flex-1" onClick={handleCopyAddress}>
                    {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                    Copy
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1 text-destructive hover:text-destructive" onClick={disconnect}>
                    <LogOut className="w-4 h-4 mr-1" />
                    Disconnect
                  </Button>
                </div>
              </div>
            ) : (
              <Button 
                variant="hero" 
                size="sm" 
                className="w-full"
                onClick={connect}
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
