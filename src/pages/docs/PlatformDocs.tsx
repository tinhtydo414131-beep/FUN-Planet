import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Database, 
  Server, 
  Palette, 
  Shield, 
  Gamepad2, 
  Users, 
  Coins, 
  Bot,
  Trophy,
  Music,
  Globe,
  Code,
  Rocket,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const sections = [
  { id: "overview", label: "Project Overview", icon: Globe },
  { id: "tech-stack", label: "Tech Stack", icon: Code },
  { id: "database", label: "Database Schema", icon: Database },
  { id: "edge-functions", label: "Edge Functions", icon: Server },
  { id: "features", label: "Key Features", icon: Gamepad2 },
  { id: "design", label: "Design System", icon: Palette },
  { id: "security", label: "Security", icon: Shield },
  { id: "development", label: "Development Roadmap", icon: Rocket },
];

const PlatformDocs = () => {
  const [activeSection, setActiveSection] = useState("overview");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    toast({ title: "Copied to clipboard!" });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    setSidebarOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="font-bold text-lg text-gray-900">Fun Planet Docs</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-72 bg-white border-r border-gray-200 transform transition-transform duration-300 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Gamepad2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">Fun Planet</h1>
              <p className="text-xs text-gray-500">Developer Documentation</p>
            </div>
          </div>
        </div>
        
        <ScrollArea className="h-[calc(100vh-88px)] p-4">
          <nav className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  activeSection === section.id
                    ? "bg-purple-100 text-purple-700"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <section.icon className="h-4 w-4" />
                {section.label}
                {activeSection === section.id && (
                  <ChevronRight className="h-4 w-4 ml-auto" />
                )}
              </button>
            ))}
          </nav>

          <Separator className="my-6" />

          <div className="px-3">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
              Quick Links
            </p>
            <div className="space-y-2">
              <a
                href="https://funplanet.lovable.app"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-purple-600"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Live Preview
              </a>
              <a
                href="/admin/master"
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-purple-600"
              >
                <Shield className="h-3.5 w-3.5" />
                Admin Dashboard
              </a>
            </div>
          </div>
        </ScrollArea>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-72 pt-16 lg:pt-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          
          {/* Overview Section */}
          <section id="overview" className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-8 text-white mb-8"
            >
              <h1 className="text-3xl lg:text-4xl font-bold mb-4">
                Fun Planet Documentation
              </h1>
              <p className="text-lg opacity-90 mb-6">
                Comprehensive developer guide for the Montessori Gaming Platform with Web3 CAMLY rewards.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">v1.0.5</span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">React 18</span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">TypeScript</span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">Supabase</span>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoCard
                title="Project Name"
                value="Fun Planet - Montessori Gaming Platform"
                icon={<Gamepad2 className="h-5 w-5 text-purple-500" />}
              />
              <InfoCard
                title="Target Users"
                value="Children 4-12 years + Parents"
                icon={<Users className="h-5 w-5 text-blue-500" />}
              />
              <InfoCard
                title="Supported Languages"
                value="13 languages (VI, EN, JA, KO, ZH, TH, ID, ES, FR, DE, RU, PT, HI)"
                icon={<Globe className="h-5 w-5 text-green-500" />}
              />
              <InfoCard
                title="Live URL"
                value="funplanet.lovable.app"
                icon={<ExternalLink className="h-5 w-5 text-pink-500" />}
              />
            </div>
          </section>

          {/* Tech Stack Section */}
          <section id="tech-stack" className="mb-16">
            <SectionHeader title="Tech Stack" icon={<Code className="h-6 w-6" />} />
            
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Layer</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Technology</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Version</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <TechRow layer="Frontend" tech="React + TypeScript + Vite" version="18.3.1" />
                  <TechRow layer="UI Library" tech="Shadcn/UI + Radix UI + Tailwind CSS" version="3.4.17" />
                  <TechRow layer="Animations" tech="Framer Motion" version="12.23.24" />
                  <TechRow layer="State Management" tech="TanStack Query + Zustand" version="5.83.0 / 5.0.9" />
                  <TechRow layer="Backend" tech="Supabase (Lovable Cloud)" version="2.84.0" />
                  <TechRow layer="Game Engine" tech="Phaser" version="3.70.0" />
                  <TechRow layer="3D Graphics" tech="Three.js + React Three Fiber" version="0.168.0 / 8.18.0" />
                  <TechRow layer="Web3" tech="Wagmi + Viem + WalletConnect" version="2.5.0 / 2.9.0" />
                  <TechRow layer="Internationalization" tech="i18next + react-i18next" version="25.7.2 / 16.4.0" />
                  <TechRow layer="Forms" tech="React Hook Form + Zod" version="7.61.1 / 3.25.76" />
                </tbody>
              </table>
            </div>
          </section>

          {/* Database Section */}
          <section id="database" className="mb-16">
            <SectionHeader title="Database Schema (113 Tables)" icon={<Database className="h-6 w-6" />} />
            
            <div className="space-y-6">
              <TableCategory 
                title="Core Tables" 
                tables={[
                  { name: "profiles", desc: "User info (avatar, username, birth_year, wallet_balance, referral_code)" },
                  { name: "web3_rewards", desc: "CAMLY balance, total_referrals, referral_earnings" },
                  { name: "uploaded_games", desc: "Game catalog (ZIP/URL, status: pending/approved/rejected)" },
                  { name: "game_plays", desc: "Play history with duration tracking" },
                  { name: "user_rewards", desc: "Pending and claimed reward amounts" },
                ]}
              />
              
              <TableCategory 
                title="Social Tables" 
                tables={[
                  { name: "friends", desc: "Friend relationships (user_id, friend_id)" },
                  { name: "friend_requests", desc: "Friend requests (sender_id, receiver_id, status)" },
                  { name: "private_messages", desc: "1-1 messaging with rich media support" },
                  { name: "chat_rooms / chat_messages", desc: "Group chat system" },
                  { name: "angel_ai_chat_history", desc: "Angel AI conversation logs" },
                ]}
              />
              
              <TableCategory 
                title="Reward System Tables" 
                tables={[
                  { name: "camly_coin_transactions", desc: "All CAMLY transactions log" },
                  { name: "daily_login_rewards", desc: "Daily check-in (5,000 CAMLY)" },
                  { name: "daily_play_rewards", desc: "Gameplay rewards tracking" },
                  { name: "referrals", desc: "Referral relationships" },
                  { name: "claimed_referral_tiers", desc: "Claimed tier rewards" },
                  { name: "platform_donations", desc: "On-chain donations to treasury" },
                ]}
              />
              
              <TableCategory 
                title="Admin & Security Tables" 
                tables={[
                  { name: "admin_blocked_users", desc: "Blocked users management" },
                  { name: "fraud_logs", desc: "Fraud detection audit trail" },
                  { name: "suspicious_activity_logs", desc: "Activity monitoring" },
                  { name: "admin_audit_logs", desc: "Admin actions log" },
                  { name: "ip_blacklist", desc: "Blocked IP addresses" },
                  { name: "user_roles", desc: "Admin/Moderator roles" },
                ]}
              />
              
              <TableCategory 
                title="Game-specific Tables" 
                tables={[
                  { name: "game_ai_reviews", desc: "AI content moderation results" },
                  { name: "game_appeals", desc: "User appeals for rejected games" },
                  { name: "game_achievements", desc: "Achievement unlocks" },
                  { name: "game_sessions", desc: "Recently played tracking" },
                ]}
              />
            </div>
          </section>

          {/* Edge Functions Section */}
          <section id="edge-functions" className="mb-16">
            <SectionHeader title="Edge Functions (21 Functions)" icon={<Server className="h-6 w-6" />} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FunctionCard name="angel-ai-chat" desc="Angel AI assistant (Gemini integration)" />
              <FunctionCard name="ai-game-suggestions" desc="AI-powered game recommendations" />
              <FunctionCard name="claim-arbitrary" desc="On-chain CAMLY withdrawal processing" />
              <FunctionCard name="check-ip-eligibility" desc="IP fraud detection (max 3 accounts/IP)" />
              <FunctionCard name="check-reward-wallet-balance" desc="Monitor reward wallet BNB/CAMLY" />
              <FunctionCard name="r2-upload" desc="Cloudflare R2 file uploads" />
              <FunctionCard name="upload-to-r2" desc="Alternative R2 upload handler" />
              <FunctionCard name="validate-music-upload" desc="Music file validation" />
              <FunctionCard name="send-weekly-summary" desc="Automated weekly email reports" />
              <FunctionCard name="generate-daily-quiz" desc="Daily quiz generation" />
              <FunctionCard name="rotate-daily-challenge" desc="Daily challenge rotation" />
              <FunctionCard name="scan-game-content" desc="Game content moderation" />
              <FunctionCard name="fetch-itchio-game" desc="Itch.io game import" />
              <FunctionCard name="achievement-nft-metadata" desc="NFT metadata for achievements" />
              <FunctionCard name="process-approved-withdrawal" desc="Process approved withdrawals" />
              <FunctionCard name="process-donation-onchain" desc="Process on-chain donations" />
            </div>
          </section>

          {/* Features Section */}
          <section id="features" className="mb-16">
            <SectionHeader title="Key Features" icon={<Gamepad2 className="h-6 w-6" />} />
            
            <div className="space-y-6">
              <FeatureBlock
                title="Game System"
                icon={<Gamepad2 className="h-5 w-5 text-purple-500" />}
                items={[
                  "Upload Types: ZIP files (max 50MB) or External URLs (HTTPS only)",
                  "Categories: Educational (x2.0), Brain/Kindness/Creative/Music (x1.5), Puzzle (x1.2), Casual (x1.0)",
                  "Approval Flow: pending → admin review → approved/rejected",
                  "Test Requirement: 30s play test with interaction detection",
                  "Upload Reward: 500,000 CAMLY upon approval",
                ]}
              />
              
              <FeatureBlock
                title="CAMLY Reward System"
                icon={<Coins className="h-5 w-5 text-yellow-500" />}
                items={[
                  "Daily Login: 5,000 CAMLY (once per day)",
                  "First Play Bonus: 5,000 CAMLY for new games",
                  "Daily Limit: 50,000 CAMLY from games, 100,000 CAMLY total",
                  "Withdrawal: Via BSC wallet, 200,000 CAMLY daily limit",
                  "Referral Tiers: Multi-tier referral rewards system",
                ]}
              />
              
              <FeatureBlock
                title="Angel AI Assistant"
                icon={<Bot className="h-5 w-5 text-pink-500" />}
                items={[
                  "Backend: Google Gemini 2.5 Pro via Lovable AI Gateway",
                  "Features: Chat, storytelling, game suggestions",
                  "UI: Floating mascot with holographic speech bubble",
                  "Visibility: Always visible for all users (guests included)",
                ]}
              />
              
              <FeatureBlock
                title="Leaderboards"
                icon={<Trophy className="h-5 w-5 text-orange-500" />}
                items={[
                  "Honor Board: Top CAMLY earners (get_public_ranking RPC)",
                  "Legend Board: Top donors (get_public_donors RPC)",
                  "Achievement Leaderboard: Badge rankings",
                  "Real-time: Supabase Realtime subscriptions",
                ]}
              />
              
              <FeatureBlock
                title="Music Library"
                icon={<Music className="h-5 w-5 text-blue-500" />}
                items={[
                  "Personal & Community tabs",
                  "Cloudflare R2 storage integration",
                  "Admin approval for community uploads",
                  "20,000 CAMLY reward for approved music",
                ]}
              />
            </div>
          </section>

          {/* Design System Section */}
          <section id="design" className="mb-16">
            <SectionHeader title="Design System" icon={<Palette className="h-6 w-6" />} />
            
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Typography (Hologram Montessori)</h3>
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 text-sm font-medium text-gray-600">Element</th>
                      <th className="text-left py-2 text-sm font-medium text-gray-600">Font</th>
                      <th className="text-left py-2 text-sm font-medium text-gray-600">Size</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    <tr className="border-b border-gray-100">
                      <td className="py-2">H1 (Hero)</td>
                      <td className="py-2">Quicksand Bold</td>
                      <td className="py-2">56px / 28-32px mobile</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-2">H2 (Section)</td>
                      <td className="py-2">Quicksand Bold</td>
                      <td className="py-2">36px / 22-24px mobile</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-2">Body</td>
                      <td className="py-2">Nunito Medium</td>
                      <td className="py-2">18px / 16px mobile</td>
                    </tr>
                    <tr>
                      <td className="py-2">Buttons</td>
                      <td className="py-2">Quicksand Bold Uppercase</td>
                      <td className="py-2">14-16px</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Color System (Holographic Pastel)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <ColorSwatch name="--holo-pink" color="#F3C4FB" />
                  <ColorSwatch name="--holo-purple" color="#CDB4DB" />
                  <ColorSwatch name="--holo-blue" color="#A2D2FF" />
                  <ColorSwatch name="--holo-mint" color="#B8F0F0" />
                </div>
              </div>
              
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">UI Patterns</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <code className="px-2 py-1 bg-gray-100 rounded text-xs">Glassmorphism</code>
                    <span className="text-gray-600">bg-white/45 backdrop-blur-lg border-white/60</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <code className="px-2 py-1 bg-gray-100 rounded text-xs">Touch Targets</code>
                    <span className="text-gray-600">Minimum 48px height</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <code className="px-2 py-1 bg-gray-100 rounded text-xs">Mobile Safe Area</code>
                    <span className="text-gray-600">pb-24 (76px bottom nav)</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <code className="px-2 py-1 bg-gray-100 rounded text-xs">Holographic Border</code>
                    <span className="text-gray-600">Animated gradient border on hover</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Security Section */}
          <section id="security" className="mb-16">
            <SectionHeader title="Security Patterns" icon={<Shield className="h-6 w-6" />} />
            
            <div className="space-y-4">
              <SecurityCard
                title="Row Level Security (RLS)"
                items={[
                  "All tables protected with RLS policies",
                  "profiles: Users can only view/edit their own record",
                  "user_rewards: Public SELECT for leaderboards, protected mutations",
                  "Public data exposed via SECURITY DEFINER RPCs only",
                ]}
              />
              
              <SecurityCard
                title="Fraud Protection"
                items={[
                  "IP Limit: Max 3 accounts per IP address",
                  "Reward Cooldown: 5-second cooldown between claims",
                  "Row Locking: FOR UPDATE to prevent race conditions",
                  "Hash Validation: SHA-256 for uploaded files",
                  "Admin Monitoring: is_fraud_suspect flag, fraud_logs table",
                ]}
              />
              
              <SecurityCard
                title="Authentication"
                items={[
                  "Email/Password with auto-confirm",
                  "Web3 wallet connection (WalletConnect)",
                  "Role-based access (user_roles table)",
                  "IP eligibility check on registration",
                ]}
              />
            </div>
          </section>

          {/* Development Roadmap Section */}
          <section id="development" className="mb-16">
            <SectionHeader title="Development Roadmap" icon={<Rocket className="h-6 w-6" />} />
            
            <div className="space-y-6">
              <RoadmapPhase
                phase="Short-term (1-2 weeks)"
                color="green"
                items={[
                  "Complete Holographic Design System refinement",
                  "Performance optimization (bundle size, lazy loading)",
                  "Bug fixes and console warning cleanup",
                  "Test coverage for critical hooks",
                ]}
              />
              
              <RoadmapPhase
                phase="Mid-term (1-2 months)"
                color="blue"
                items={[
                  "Multiplayer Gaming with Supabase Realtime",
                  "Advanced Parent Controls (screen time, content filters)",
                  "Creator Monetization (revenue sharing)",
                  "AI-Generated Games (text-to-game)",
                  "Push Notifications for PWA",
                ]}
              />
              
              <RoadmapPhase
                phase="Long-term (3-6 months)"
                color="purple"
                items={[
                  "Mobile Native App (React Native / Capacitor)",
                  "NFT Achievement Marketplace on BSC",
                  "Educational Partnerships (Khan Academy, PBS Kids)",
                  "Gamified Learning Paths with rewards",
                  "Real-time Voice Chat in games",
                ]}
              />
            </div>
          </section>

          {/* Footer */}
          <div className="text-center py-8 text-sm text-gray-500 border-t border-gray-200">
            <p>Fun Planet Documentation • Last updated: January 2026</p>
            <p className="mt-1">Built with ❤️ for children's education and fun</p>
          </div>
        </div>
      </main>
    </div>
  );
};

// Sub-components
const InfoCard = ({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
    <div className="mt-0.5">{icon}</div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="font-medium text-gray-900">{value}</p>
    </div>
  </div>
);

const SectionHeader = ({ title, icon }: { title: string; icon: React.ReactNode }) => (
  <div className="flex items-center gap-3 mb-6">
    <div className="p-2 bg-purple-100 rounded-lg text-purple-600">{icon}</div>
    <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
  </div>
);

const TechRow = ({ layer, tech, version }: { layer: string; tech: string; version: string }) => (
  <tr>
    <td className="px-4 py-3 text-sm font-medium text-gray-700">{layer}</td>
    <td className="px-4 py-3 text-sm text-gray-600">{tech}</td>
    <td className="px-4 py-3 text-sm text-gray-500">{version}</td>
  </tr>
);

const TableCategory = ({ title, tables }: { title: string; tables: { name: string; desc: string }[] }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-6">
    <h3 className="font-semibold text-gray-900 mb-4">{title}</h3>
    <div className="space-y-3">
      {tables.map((table) => (
        <div key={table.name} className="flex items-start gap-3">
          <code className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs font-mono shrink-0">
            {table.name}
          </code>
          <span className="text-sm text-gray-600">{table.desc}</span>
        </div>
      ))}
    </div>
  </div>
);

const FunctionCard = ({ name, desc }: { name: string; desc: string }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-4">
    <code className="text-sm font-mono text-purple-600">{name}</code>
    <p className="text-xs text-gray-500 mt-1">{desc}</p>
  </div>
);

const FeatureBlock = ({ title, icon, items }: { title: string; icon: React.ReactNode; items: string[] }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-6">
    <div className="flex items-center gap-2 mb-4">
      {icon}
      <h3 className="font-semibold text-gray-900">{title}</h3>
    </div>
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
          <span className="text-purple-500 mt-1">•</span>
          {item}
        </li>
      ))}
    </ul>
  </div>
);

const ColorSwatch = ({ name, color }: { name: string; color: string }) => (
  <div className="text-center">
    <div 
      className="w-full h-16 rounded-lg border border-gray-200 mb-2" 
      style={{ backgroundColor: color }}
    />
    <code className="text-xs text-gray-600">{name}</code>
    <p className="text-xs text-gray-400">{color}</p>
  </div>
);

const SecurityCard = ({ title, items }: { title: string; items: string[] }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-6">
    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
      <Shield className="h-4 w-4 text-green-500" />
      {title}
    </h3>
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
          <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
          {item}
        </li>
      ))}
    </ul>
  </div>
);

const RoadmapPhase = ({ phase, color, items }: { phase: string; color: string; items: string[] }) => {
  const colorClasses = {
    green: "border-green-200 bg-green-50",
    blue: "border-blue-200 bg-blue-50",
    purple: "border-purple-200 bg-purple-50",
  };
  
  const dotClasses = {
    green: "bg-green-500",
    blue: "bg-blue-500",
    purple: "bg-purple-500",
  };
  
  return (
    <div className={cn("rounded-xl border p-6", colorClasses[color as keyof typeof colorClasses])}>
      <h3 className="font-semibold text-gray-900 mb-4">{phase}</h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
            <span className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", dotClasses[color as keyof typeof dotClasses])} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PlatformDocs;
