import { lazy } from "react";

// Lazy load pages for better performance
export const Index = lazy(() => import("@/pages/Index"));
export const Games = lazy(() => import("@/pages/Games"));
export const GamePlay = lazy(() => import("@/pages/GamePlay"));
export const GameDetails = lazy(() => import("@/pages/GameDetails"));
export const LovableGamePlay = lazy(() => import("@/pages/LovableGamePlay"));
export const RecentlyPlayed = lazy(() => import("@/pages/RecentlyPlayed"));
export const MyGames = lazy(() => import("@/pages/MyGames"));
export const EditGame = lazy(() => import("@/pages/EditGame"));
export const UploadGame = lazy(() => import("@/pages/UploadGame"));

export const Auth = lazy(() => import("@/pages/Auth"));
export const Profile = lazy(() => import("@/pages/Profile"));
export const PublicProfile = lazy(() => import("@/pages/PublicProfile"));
export const Settings = lazy(() => import("@/pages/Settings"));
export const NFTGallery = lazy(() => import("@/pages/NFTGallery"));

export const RewardsHistory = lazy(() => import("@/pages/RewardsHistory"));
export const RewardGalaxy = lazy(() => import("@/pages/RewardGalaxy"));
export const Friends = lazy(() => import("@/pages/Friends"));
export const FindFriends = lazy(() => import("@/pages/FindFriends"));
export const Chat = lazy(() => import("@/pages/Chat"));
export const PrivateMessages = lazy(() => import("@/pages/PrivateMessages"));
export const Leaderboard = lazy(() => import("@/pages/Leaderboard"));
export const NexusLeaderboard = lazy(() => import("@/pages/NexusLeaderboard"));
export const ComboLeaderboard = lazy(() => import("@/pages/ComboLeaderboard"));
export const CamlyLeaderboard = lazy(() => import("@/pages/CamlyLeaderboard"));
export const AchievementLeaderboard = lazy(() => import("@/pages/AchievementLeaderboard"));
export const MusicLibrary = lazy(() => import("@/pages/MusicLibrary"));
export const ParentDashboard = lazy(() => import("@/pages/ParentDashboard"));
export const Education = lazy(() => import("@/pages/Education"));
export const AdminMasterDashboard = lazy(() => import("@/pages/AdminMasterDashboard"));
export const About = lazy(() => import("@/pages/About"));
export const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
export const Install = lazy(() => import("@/pages/Install"));
export const NotFound = lazy(() => import("@/pages/NotFound"));

// Route configuration for easy management
export const routeConfig = {
  // Main
  home: "/",
  homeAlt: "/home",
  
  // Games
  games: "/games",
  gamePlay: "/game/:gameId",
  gameDetails: "/game-details/:id",
  lovableGame: "/lovable-game/:id",
  recentlyPlayed: "/recently-played",
  myGames: "/my-games",
  editGame: "/edit-game/:id",
  
  // Upload & Creator
  upload: "/upload",
  uploadGame: "/upload-game",
  
  // Auth & Profile
  auth: "/auth",
  profile: "/profile",
  publicProfile: "/profile/:userId",
  dashboard: "/dashboard",
  settings: "/settings",
  nftGallery: "/nft-gallery",
  nft: "/nft",
  
  // Rewards
  rewardsHistory: "/rewards-history",
  rewardGalaxy: "/reward-galaxy",
  
  // Social & Community
  friends: "/friends",
  findFriends: "/find-friends",
  chat: "/chat",
  community: "/community",
  messages: "/messages",
  
  // Leaderboards
  leaderboard: "/leaderboard",
  nexusLeaderboard: "/nexus-leaderboard",
  comboLeaderboard: "/combo-leaderboard",
  camlyLeaderboard: "/camly-leaderboard",
  achievementLeaderboard: "/achievement-leaderboard",
  
  // Music
  music: "/music",
  publicMusic: "/public-music",
  
  // Parent & Education
  parentDashboard: "/parent-dashboard",
  education: "/education",
  
  // Admin - All routes point to Master Dashboard
  adminMaster: "/admin/master",
  
  // Other
  about: "/about",
  resetPassword: "/reset-password",
  install: "/install",
} as const;
