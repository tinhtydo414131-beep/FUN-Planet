import { User, LogOut, Trophy, Users, MessageCircle, Wallet, Music, Settings, Gift, Bell, Menu, X, Search, Gamepad2, BookOpen, Shield, Sparkles, Crown } from "lucide-react";

const funPlanetLogo = "/logo-header-circular.png";
import { NavLink } from "./NavLink";
import { Button } from "./ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FriendRequestNotification } from "./FriendRequestNotification";
import { useFriendRequestNotifications } from "@/hooks/useFriendRequestNotifications";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { GlobalSearchModal } from "./GlobalSearchModal";
import { MessengerButton } from "./MessengerButton";
import { NotificationBell } from "./notifications/NotificationBell";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useTranslation } from "react-i18next";

export const Navigation = () => {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminRole();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const {
    pendingRequest,
    pendingCount,
    acceptRequest,
    rejectRequest,
    dismissNotification,
  } = useFriendRequestNotifications();


  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("avatar_url, username")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setAvatarUrl(data.avatar_url);
        setUsername(data.username);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const navLinks = [
    { path: "/games", label: t('nav.playGames') },
    { path: "/public-music", label: t('nav.music') },
    { path: "/reward-galaxy", label: t('nav.rewardGalaxy'), special: true },
    ...(isAdmin ? [{ path: "/admin/master", label: "👑 Admin", admin: true }] : []),
  ];

  return (
    <>
      {/* Global Search Modal */}
      <GlobalSearchModal open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Friend Request Notification */}
      <FriendRequestNotification
        request={pendingRequest}
        onClose={dismissNotification}
        onAccept={acceptRequest}
        onReject={rejectRequest}
      />

      {/* Desktop Navigation - Sticky */}
      <nav className="hidden md:block sticky-header">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo - Circular with Image + Text */}
            <NavLink 
              to="/" 
              className="flex items-center group ml-2 md:ml-5"
            >
              {/* Circular logo - larger size, no text */}
              <div className="w-16 h-16 lg:w-[72px] lg:h-[72px] rounded-full overflow-hidden border-2 border-purple-400/50 shadow-lg group-hover:border-purple-500 group-hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] transition-all duration-300">
                <img 
                  src={funPlanetLogo} 
                  alt="FUN Planet" 
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/logo-header-fallback.jpg';
                  }}
                />
              </div>
            </NavLink>

            {/* Desktop Links */}
            <div className="flex items-center gap-2">
              {navLinks.map((link) => (
                <NavLink 
                  key={link.path}
                  to={link.path} 
                  className={`px-5 py-2.5 rounded-xl font-jakarta font-semibold text-base transition-all ${
                    (link as any).admin
                      ? 'bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/40 text-orange-600 hover:border-orange-500/60 hover:shadow-[0_0_15px_rgba(255,100,0,0.3)]'
                      : (link as any).angelAI
                        ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/40 text-purple-600 hover:border-purple-500/60 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] animate-pulse'
                        : link.special 
                          ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/40 text-yellow-600 hover:border-yellow-500/60 hover:shadow-[0_0_15px_rgba(255,215,0,0.3)]'
                          : isActive(link.path) 
                            ? 'bg-primary/10 text-primary border-b-2 border-primary' 
                            : 'text-foreground hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  {link.label}
                </NavLink>
              ))}


              <LanguageSwitcher />
              
              {user && (
                <>
                  <NotificationBell />
                  <MessengerButton />
                </>
              )}

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-3 ml-2 p-1.5 rounded-xl hover:bg-muted/50 active:scale-95 transition-all">
                      <Avatar className="w-10 h-10 border-2 border-primary/30">
                        <AvatarImage src={avatarUrl || undefined} />
                        <AvatarFallback className="bg-primary/20 text-primary font-jakarta font-bold">
                          {user?.email?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      {username && (
                        <span className="font-jakarta font-semibold text-foreground">
                          {username}
                        </span>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-xl">
                    <DropdownMenuItem onClick={() => navigate("/profile")} className="py-3">
                      <User className="mr-3 h-5 w-5" />
                      <span className="font-medium">{t('nav.myProfile')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/find-friends")} className="py-3 relative">
                      <Users className="mr-3 h-5 w-5" />
                      <span className="font-medium">{t('nav.findFriends')}</span>
                      {pendingCount > 0 && (
                        <Badge className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5">
                          {pendingCount}
                        </Badge>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/messages")} className="py-3">
                      <MessageCircle className="mr-3 h-5 w-5" />
                      <span className="font-medium">{t('nav.messages')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/education")} className="py-3">
                      <BookOpen className="mr-3 h-5 w-5" />
                      <span className="font-medium">{t('nav.educationHub')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => navigate("/reward-galaxy")} 
                      className="py-3 text-yellow-600 hover:text-yellow-500 bg-gradient-to-r from-yellow-500/5 to-orange-500/5 hover:from-yellow-500/10 hover:to-orange-500/10 group"
                    >
                      <Gift className="mr-3 h-5 w-5 group-hover:animate-bounce" />
                      <span className="font-medium">{t('nav.rewardGalaxy')}</span>
                      <Sparkles className="ml-auto h-4 w-4 text-yellow-400 animate-pulse" />
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/dashboard")} className="py-3 text-pink-600">
                      <Users className="mr-3 h-5 w-5" />
                      <span className="font-medium">{t('nav.inviteFriends')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/parent-dashboard")} className="py-3">
                      <Shield className="mr-3 h-5 w-5" />
                      <span className="font-medium">{t('nav.parentControls')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/settings")} className="py-3">
                      <Settings className="mr-3 h-5 w-5" />
                      <span className="font-medium">{t('nav.settings')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/achievement-leaderboard")} className="py-3">
                      <Trophy className="mr-3 h-5 w-5 text-amber-500" />
                      <span className="font-medium">{t('nav.achievementLeaderboard')}</span>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => navigate("/admin/master")} 
                          className="py-3 text-orange-600 hover:text-orange-500 bg-gradient-to-r from-orange-500/5 to-red-500/5 hover:from-orange-500/10 hover:to-red-500/10"
                        >
                          <Crown className="mr-3 h-5 w-5" />
                          <span className="font-medium">{t('nav.adminDashboard')}</span>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="py-3">
                      <LogOut className="mr-3 h-5 w-5" />
                      <span className="font-medium">{t('nav.logOut')}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  onClick={() => navigate("/auth")}
                  className="font-jakarta font-bold text-base px-6 py-2.5 h-11 rounded-xl bg-gradient-to-r from-primary to-secondary shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                >
                  {t('common.login')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Top Header - Sticky */}
      <div className="md:hidden sticky-header">
        <div className="flex items-center justify-between h-16 px-4">
          <NavLink 
            to="/" 
            className="flex items-center group active:scale-95 transition-transform ml-2"
          >
            {/* Circular logo only - no text */}
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-400/50 shadow-md group-hover:border-purple-500 transition-all">
              <img 
                src={funPlanetLogo} 
                alt="FUN Planet" 
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo-header-fallback.jpg';
                }}
              />
            </div>
          </NavLink>
          
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            
            {user && (
              <>
                <NotificationBell />
                <MessengerButton />
              </>
            )}
            
            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <button className="p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                  <Menu className="w-6 h-6 text-foreground" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] p-0">
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="p-6 border-b border-border">
                    {user ? (
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12 border-2 border-primary/30">
                          <AvatarImage src={avatarUrl || undefined} />
                          <AvatarFallback className="bg-primary/20 text-primary font-jakarta font-bold text-lg">
                            {user?.email?.[0]?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-jakarta font-bold text-foreground">{username || "User"}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    ) : (
                      <Button
                        onClick={() => {
                          navigate("/auth");
                          setMobileMenuOpen(false);
                        }}
                        className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-secondary font-jakarta font-bold text-base"
                      >
                        {t('nav.loginSignup')}
                      </Button>
                    )}
                  </div>

                  {/* Menu Items */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {user && (
                      <>
                        <SheetClose asChild>
                          <button
                            onClick={() => navigate("/profile")}
                            className="flex items-center gap-3 w-full p-4 rounded-xl hover:bg-muted/50 transition-colors"
                          >
                            <User className="w-5 h-5 text-muted-foreground" />
                            <span className="font-inter font-medium">{t('nav.myProfile')}</span>
                          </button>
                        </SheetClose>
                        <SheetClose asChild>
                          <button
                            onClick={() => navigate("/reward-galaxy")}
                            className="flex items-center gap-3 w-full p-4 rounded-xl transition-colors"
                            style={{
                              background: 'linear-gradient(135deg, rgba(255,215,0,0.15) 0%, rgba(255,165,0,0.15) 100%)',
                              border: '2px solid rgba(255,215,0,0.4)',
                            }}
                          >
                            <Gift className="w-5 h-5 text-yellow-500" />
                            <span className="font-inter font-bold text-yellow-600">{t('nav.rewardGalaxy')}</span>
                            <Sparkles className="ml-auto w-4 h-4 text-yellow-400 animate-pulse" />
                          </button>
                        </SheetClose>
                        <SheetClose asChild>
                          <button
                            onClick={() => navigate("/find-friends")}
                            className="flex items-center gap-3 w-full p-4 rounded-xl hover:bg-muted/50 transition-colors"
                          >
                            <Users className="w-5 h-5 text-muted-foreground" />
                            <span className="font-inter font-medium">{t('nav.findFriends')}</span>
                            {pendingCount > 0 && (
                              <Badge className="ml-auto bg-red-500 text-white text-xs px-2">
                                {pendingCount}
                              </Badge>
                            )}
                          </button>
                        </SheetClose>
                        {/* Messages */}
                        <SheetClose asChild>
                          <button
                            onClick={() => navigate("/messages")}
                            className="flex items-center gap-3 w-full p-4 rounded-xl hover:bg-muted/50 transition-colors"
                          >
                            <MessageCircle className="w-5 h-5 text-muted-foreground" />
                            <span className="font-inter font-medium">{t('nav.messages')}</span>
                          </button>
                        </SheetClose>
                        {/* Public Music */}
                        <SheetClose asChild>
                          <button
                            onClick={() => navigate("/public-music")}
                            className="flex items-center gap-3 w-full p-4 rounded-xl hover:bg-muted/50 transition-colors"
                          >
                            <Music className="w-5 h-5 text-muted-foreground" />
                            <span className="font-inter font-medium">{t('nav.music')}</span>
                          </button>
                        </SheetClose>
                        {/* Education Hub */}
                        <SheetClose asChild>
                          <button
                            onClick={() => navigate("/education")}
                            className="flex items-center gap-3 w-full p-4 rounded-xl hover:bg-muted/50 transition-colors"
                          >
                            <BookOpen className="w-5 h-5 text-muted-foreground" />
                            <span className="font-inter font-medium">{t('nav.educationHub')}</span>
                          </button>
                        </SheetClose>
                        {/* Parent Controls */}
                        <SheetClose asChild>
                          <button
                            onClick={() => navigate("/parent-dashboard")}
                            className="flex items-center gap-3 w-full p-4 rounded-xl hover:bg-muted/50 transition-colors"
                          >
                            <Shield className="w-5 h-5 text-muted-foreground" />
                            <span className="font-inter font-medium">{t('nav.parentControls')}</span>
                          </button>
                        </SheetClose>
                        {/* Achievement Leaderboard */}
                        <SheetClose asChild>
                          <button
                            onClick={() => navigate("/achievement-leaderboard")}
                            className="flex items-center gap-3 w-full p-4 rounded-xl hover:bg-muted/50 transition-colors"
                          >
                            <Trophy className="w-5 h-5 text-amber-500" />
                            <span className="font-inter font-medium">{t('nav.achievementLeaderboard')}</span>
                          </button>
                        </SheetClose>
                        {/* Settings */}
                        <SheetClose asChild>
                          <button
                            onClick={() => navigate("/settings")}
                            className="flex items-center gap-3 w-full p-4 rounded-xl hover:bg-muted/50 transition-colors"
                          >
                            <Settings className="w-5 h-5 text-muted-foreground" />
                            <span className="font-inter font-medium">{t('nav.settings')}</span>
                          </button>
                        </SheetClose>
                        {isAdmin && (
                          <SheetClose asChild>
                            <button
                              onClick={() => navigate("/admin/master")}
                              className="flex items-center gap-3 w-full p-4 rounded-xl transition-colors"
                              style={{
                                background: 'linear-gradient(135deg, rgba(255,100,0,0.15) 0%, rgba(239,68,68,0.15) 100%)',
                                border: '2px solid rgba(255,100,0,0.4)',
                              }}
                            >
                              <Crown className="w-5 h-5 text-orange-500" />
                              <span className="font-inter font-bold text-orange-600">👑 {t('nav.adminDashboard')}</span>
                            </button>
                          </SheetClose>
                        )}
                      </>
                    )}
                  </div>

                  {/* Footer */}
                  {user && (
                    <div className="p-4 border-t border-border">
                      <SheetClose asChild>
                        <button
                          onClick={handleSignOut}
                          className="flex items-center gap-3 w-full p-4 rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <LogOut className="w-5 h-5" />
                          <span className="font-inter font-medium">{t('nav.logOut')}</span>
                        </button>
                      </SheetClose>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </>
  );
};
