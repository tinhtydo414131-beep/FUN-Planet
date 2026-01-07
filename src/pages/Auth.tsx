import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Gamepad2, User, Wallet, Mail, Lock } from "lucide-react";
import { useAccount, useDisconnect, useConnect } from 'wagmi';
import { z } from "zod";
import { withRetry, formatErrorMessage } from "@/utils/supabaseRetry";

export default function Auth() {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"connect" | "register">("connect");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  
  // Validation schemas with translations
  const emailSchema = z.string().email(t('auth.invalidEmail')).max(255, t('auth.emailTooLong'));
  const passwordSchema = z.string().min(6, t('auth.passwordMin')).max(100, t('auth.passwordTooLong'));
  const usernameSchema = z.string().min(3, t('auth.usernameMin')).max(20, t('auth.usernameTooLong'));
  
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  // Auto-proceed to register step when wallet connects
  useEffect(() => {
    if (isConnected && address && step === "connect") {
      setStep("register");
    }
  }, [isConnected, address, step]);

  // Redirect if already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };
    checkAuth();
  }, [navigate]);

  const { connectAsync, connectors } = useConnect();
  
  // Ref to prevent double-click on wallet connect
  const isConnectingRef = useRef(false);

  const handleConnect = async () => {
    // Prevent double-click causing -32002 error
    if (isConnectingRef.current || loading) {
      toast.info(t('auth.connectingWallet'));
      return;
    }

    try {
      // Check if any wallet is available in the browser
      if (typeof window.ethereum === 'undefined') {
        // Check if on mobile
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile) {
          toast.error(t('auth.noWalletMobile'), {
            description: t('auth.installWalletMobile'),
            duration: 6000,
          });
        } else {
          toast.error(t('auth.noWalletDetected'), {
            description: t('auth.installWallet'),
            duration: 5000,
          });
        }
        return;
      }

      // Find the injected connector
      const injectedConnector = connectors.find((c) => c.id === 'injected');

      if (!injectedConnector) {
        toast.error(t('auth.walletConnectFailed'));
        return;
      }

      isConnectingRef.current = true;
      setLoading(true);
      
      // Set a timeout to reset loading state if connection takes too long
      const timeoutId = setTimeout(() => {
        if (isConnectingRef.current) {
          setLoading(false);
          isConnectingRef.current = false;
          toast.error(t('auth.walletTimeout'), {
            description: t('auth.pendingRequest'),
          });
        }
      }, 30000);

      await connectAsync({ connector: injectedConnector });
      clearTimeout(timeoutId);
      toast.success(t('auth.walletConnectSuccess'));
    } catch (error: any) {
      console.error("Wallet connect error:", error);
      const errorCode = error?.code || error?.cause?.code;
      const message = String(error?.shortMessage || error?.message || "");
      
      // Handle specific error codes
      if (errorCode === -32002 || message.includes("pending") || message.includes("already pending")) {
        toast.error(t('auth.pendingWalletRequest'), {
          description: t('auth.checkWallet'),
          duration: 6000,
        });
      } else if (message.toLowerCase().includes("user rejected") || message.toLowerCase().includes("user denied")) {
        toast.error(t('auth.walletRejected'));
      } else if (message.includes("already connected") || message.includes("Connector already connected")) {
        // Already connected - just proceed
        toast.success(t('auth.walletAlreadyConnected'));
      } else {
        toast.error(t('auth.walletConnectFailed'), {
          description: message.slice(0, 100),
        });
      }
    } finally {
      setLoading(false);
      isConnectingRef.current = false;
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setStep("connect");
    setUsername("");
    toast.info(t('auth.walletDisconnected'));
  };

  // Prevent double submission on mobile
  const isSubmittingRef = useRef(false);
  const lastSubmitTimeRef = useRef(0);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submission (mobile double-tap issue)
    const now = Date.now();
    if (isSubmittingRef.current || now - lastSubmitTimeRef.current < 1000) {
      return;
    }

    // Validate inputs
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      if (authMode === "signup") {
        usernameSchema.parse(username);
        if (password !== confirmPassword) {
          toast.error(t('auth.passwordMismatch'));
          return;
        }
      }
    } catch (error: any) {
      toast.error(error.errors?.[0]?.message || t('auth.invalidData'));
      return;
    }

    isSubmittingRef.current = true;
    lastSubmitTimeRef.current = now;
    setLoading(true);

    try {
      if (authMode === "login") {
        // Login with retry
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        // Save session to localStorage if Remember Me is checked
        if (rememberMe && data.session) {
          localStorage.setItem("funplanet_session", JSON.stringify({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          }));
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", data.user.id)
          .single();

        toast.success(t('auth.welcomeBack', { name: profile?.username || "bạn" }));
        navigate("/");
      } else {
        // Signup
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              username: username.trim(),
            },
          },
        });

        if (error) throw error;

        if (!data.session) {
          toast.success(t('auth.signupSuccess'));
        } else {
          toast.success(t('auth.welcomeFunPlanet'));
          navigate("/");
        }
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      if (error.message?.includes("already registered")) {
        toast.error(t('auth.emailAlreadyRegistered'));
      } else if (error.message?.includes("Invalid login credentials")) {
        toast.error(t('auth.invalidCredentials'));
      } else {
        toast.error(formatErrorMessage(error));
      }
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      emailSchema.parse(resetEmail);
    } catch (error: any) {
      toast.error(error.errors?.[0]?.message || t('auth.invalidData'));
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast.success(t('auth.resetEmailSent'));
      setShowForgotPassword(false);
      setResetEmail("");
    } catch (error: any) {
      console.error("Reset password error:", error);
      toast.error(error.message || t('auth.cannotSendEmail'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submission (mobile double-tap issue)
    const now = Date.now();
    if (isSubmittingRef.current || now - lastSubmitTimeRef.current < 1000) {
      return;
    }

    if (!address) {
      toast.error(t('auth.walletNotConnected'));
      return;
    }

    if (!username.trim()) {
      toast.error(t('auth.enterUsername'));
      return;
    }

    if (username.length < 3) {
      toast.error(t('auth.usernameMin'));
      return;
    }

    isSubmittingRef.current = true;
    lastSubmitTimeRef.current = now;
    setLoading(true);

    try {
      const walletEmail = `${address.toLowerCase()}@wallet.funplanet`;
      const walletPassword = address.toLowerCase();

      // Try sign in first
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: walletEmail,
        password: walletPassword,
      });

      if (signInError && signInError.message.includes("Invalid login credentials")) {
        // Account doesn't exist, create new
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: walletEmail,
          password: walletPassword,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              username: username.trim(),
              wallet_address: address.toLowerCase(),
            },
          },
        });

        if (signUpError) {
          throw new Error(signUpError.message || t('auth.cannotCreateAccount'));
        }

        if (!signUpData.session) {
          throw new Error(t('auth.cannotCreateSession'));
        }

        localStorage.setItem("funplanet_session", JSON.stringify(signUpData.session));
        
        // Update profile with retry
        const updateResult = await withRetry(
          async () => {
            return supabase
              .from("profiles")
              .update({ wallet_address: address.toLowerCase() })
              .eq("id", signUpData.user!.id);
          },
          { operationName: "Cập nhật ví", maxRetries: 3 }
        );

        if (updateResult.error) {
          console.error("Profile update error:", updateResult.error);
          // Don't throw - user is already logged in
        }

        toast.success(t('auth.welcomeFunPlanet'));
        navigate("/");
      } else if (signInData?.session) {
        // Login successful
        localStorage.setItem("funplanet_session", JSON.stringify(signInData.session));
        
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", signInData.user.id)
          .single();

        toast.success(t('auth.welcomeBack', { name: profile?.username || "bạn" }));
        navigate("/");
      } else {
        throw new Error(signInError?.message || t('auth.loginFailed'));
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      toast.error(formatErrorMessage(error));
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  if (step === "connect") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-2 border-primary/20 shadow-2xl rounded-3xl">
          <CardHeader className="text-center space-y-4 pb-4">
            <div className="flex justify-center">
              <div className="bg-gradient-to-br from-primary to-secondary p-4 rounded-full">
                <Gamepad2 className="w-12 h-12 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-fredoka text-primary">
              {t('auth.welcome')}
            </CardTitle>
            <CardDescription className="text-base font-comic">
              {t('auth.chooseLogin')}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 px-6 pb-6">
            <Tabs defaultValue="email" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="email" className="font-fredoka">
                  <Mail className="w-4 h-4 mr-2" />
                  {t('auth.email')}
                </TabsTrigger>
                <TabsTrigger value="wallet" className="font-fredoka">
                  <Wallet className="w-4 h-4 mr-2" />
                  {t('auth.cryptoWallet')}
                </TabsTrigger>
              </TabsList>

              {/* Email/Password Tab */}
              <TabsContent value="email" className="space-y-4">
                <div className="flex justify-center gap-2 mb-4">
                  <Button
                    variant={authMode === "login" ? "default" : "outline"}
                    onClick={() => setAuthMode("login")}
                    className="font-fredoka flex-1"
                  >
                    {t('auth.login')}
                  </Button>
                  <Button
                    variant={authMode === "signup" ? "default" : "outline"}
                    onClick={() => setAuthMode("signup")}
                    className="font-fredoka flex-1"
                  >
                    {t('auth.signup')}
                  </Button>
                </div>

                <form onSubmit={handleEmailAuth} className="space-y-4">
                  {authMode === "signup" && (
                    <div className="space-y-2">
                      <label className="text-sm font-comic text-muted-foreground flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {t('auth.username')}
                      </label>
                      <Input
                        type="text"
                        placeholder={t('auth.usernamePlaceholder')}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="h-12 border-4 border-primary/40 focus:border-primary focus:ring-4 focus:ring-primary/20"
                        required
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-comic text-muted-foreground flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {t('auth.email')}
                    </label>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 border-4 border-primary/40 focus:border-primary focus:ring-4 focus:ring-primary/20"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-comic text-muted-foreground flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      {t('auth.password')}
                    </label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 border-4 border-primary/40 focus:border-primary focus:ring-4 focus:ring-primary/20"
                      required
                    />
                  </div>

                  {authMode === "signup" && (
                    <div className="space-y-2">
                      <label className="text-sm font-comic text-muted-foreground flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        {t('auth.confirmPassword')}
                      </label>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-12 border-4 border-primary/40 focus:border-primary focus:ring-4 focus:ring-primary/20"
                        required
                      />
                    </div>
                  )}

                  {authMode === "login" && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remember"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                      />
                      <label
                        htmlFor="remember"
                        className="text-sm font-comic leading-none cursor-pointer select-none"
                      >
                        {t('auth.rememberMe')}
                      </label>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 text-lg font-fredoka font-bold bg-gradient-to-r from-primary to-secondary hover:shadow-xl transition-all"
                  >
                    {loading ? t('auth.processing') : authMode === "login" ? `${t('auth.login')} 🚀` : `${t('auth.signup')} 🎉`}
                  </Button>

                  {authMode === "login" && (
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => setShowForgotPassword(true)}
                      className="w-full font-comic text-sm text-muted-foreground hover:text-primary"
                    >
                      {t('auth.forgotPassword')} 🔑
                    </Button>
                  )}
                </form>
              </TabsContent>

              {/* Wallet Tab */}
              <TabsContent value="wallet" className="space-y-4">
                <Button
                  onClick={handleConnect}
                  disabled={loading}
                  className="w-full h-16 text-lg font-fredoka font-bold bg-gradient-to-r from-accent to-secondary hover:shadow-xl transition-all"
                >
                  {loading ? t('auth.sending') : `🦊 ${t('heroActions.connectWallet')}`}
                </Button>

                <div className="p-4 bg-muted/50 rounded-xl space-y-2 text-sm font-comic text-muted-foreground">
                  <p className="font-bold text-foreground">📱 {t('auth.support')}</p>
                  <p>• MetaMask • Trust Wallet</p>
                  <p>• Coinbase • WalletConnect</p>
                  <p className="text-xs pt-2 border-t">{t('auth.worksOnWebMobile')}</p>
                </div>
              </TabsContent>
            </Tabs>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-muted-foreground/20" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground font-comic">
                  {t('auth.or')}
                </span>
              </div>
            </div>

            {/* Explore as Guest Button */}
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/")}
              className="w-full h-12 font-fredoka text-base border-2 border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5 transition-all"
            >
              {t('auth.exploreAsGuest')}
            </Button>

            {/* Forgot Password Modal */}
            {showForgotPassword && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <Card className="w-full max-w-md border-2 border-primary/20 shadow-2xl rounded-3xl">
                  <CardHeader>
                    <CardTitle className="text-2xl font-fredoka text-primary">
                      {t('auth.resetPassword')}
                    </CardTitle>
                    <CardDescription className="font-comic">
                      {t('auth.enterEmailReset')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-comic text-muted-foreground flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {t('auth.email')}
                        </label>
                        <Input
                          type="email"
                          placeholder="your@email.com"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          className="h-12 border-4 border-primary/40 focus:border-primary focus:ring-4 focus:ring-primary/20"
                          required
                        />
                      </div>

                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowForgotPassword(false);
                            setResetEmail("");
                          }}
                          className="flex-1 h-12 font-fredoka"
                          disabled={loading}
                        >
                          {t('common.cancel')}
                        </Button>
                        <Button
                          type="submit"
                          disabled={loading}
                          className="flex-1 h-12 font-fredoka font-bold bg-gradient-to-r from-primary to-secondary"
                        >
                          {loading ? t('auth.sending') : t('auth.sendEmail')}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-2 border-primary/20 shadow-2xl rounded-3xl">
        <CardHeader className="text-center space-y-4 pb-4">
          <div className="flex justify-center">
            <div className="bg-gradient-to-br from-primary to-secondary p-4 rounded-full">
              <User className="w-12 h-12 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-fredoka text-primary">
            {t('auth.finalStep')}
          </CardTitle>
          <CardDescription className="text-base font-comic">
            {t('auth.chooseUsername')}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 px-6 pb-6">
          {/* Connected Wallet Info */}
          <div className="p-4 bg-accent/10 border-2 border-accent/30 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-accent to-secondary rounded-full flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{t('auth.walletConnected')}</p>
                <p className="font-mono text-xs truncate">{address}</p>
              </div>
              <Button
                onClick={handleDisconnect}
                variant="ghost"
                size="sm"
                className="text-xs"
              >
                {t('auth.change')}
              </Button>
            </div>
          </div>

          {/* Register Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder={t('auth.usernamePlaceholderMin')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-14 text-base border-2 border-primary/30 focus:border-primary"
                required
                minLength={3}
                maxLength={20}
              />
            </div>

            <Button
              type="submit"
              disabled={loading || username.length < 3}
              className="w-full h-14 text-lg font-fredoka font-bold bg-gradient-to-r from-primary to-secondary hover:shadow-xl transition-all"
            >
              {loading ? t('auth.processing') : t('auth.startPlaying')}
            </Button>
          </form>

          <p className="text-xs text-center text-muted-foreground font-comic">
            {t('auth.infoSecure')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
