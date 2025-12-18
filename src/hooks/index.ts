// Hooks barrel export for cleaner imports

// Auth & User
export { useAuth } from "./useAuth";
export { useUserRole } from "./useUserRole";
export { useFunId } from "./useFunId";
export { useLegendStatus } from "./useLegendStatus";

// Game related
export { useGameState } from "./useGameState";
export { useGameLevel } from "./useGameLevel";
export { useGameAudio } from "./useGameAudio";
export { useGameCompletePopup } from "./useGameCompletePopup";
export { useGameTrash } from "./useGameTrash";

// Rewards & Claims
export { useDailyLoginReward } from "./useDailyLoginReward";
export { useCamlyClaim } from "./useCamlyClaim";
export { useUploadReward } from "./useUploadReward";
export { useUserRewards } from "./useUserRewards";
export { useWeb3Rewards } from "./useWeb3Rewards";

// Social & Communication
export { useFriendRequestNotifications } from "./useFriendRequestNotifications";
export { usePrivateMessages } from "./usePrivateMessages";
export { useMessageActions } from "./useMessageActions";
export { useMessageSearch } from "./useMessageSearch";
export { useMessageSound } from "./useMessageSound";
export { useTypingIndicator } from "./useTypingIndicator";
export { useReadReceipts } from "./useReadReceipts";
export { useVoiceRecorder } from "./useVoiceRecorder";
export { useVoiceReactions } from "./useVoiceReactions";
export { useVideoCall } from "./useVideoCall";

// Referral
export { useReferral } from "./useReferral";

// Mobile & UI
export { useIsMobile } from "./use-mobile";
export { useToast, toast } from "./use-toast";
export { useDebounce } from "./useDebounce";
export { useDoubleTap } from "./useDoubleTap";
export { useDraggable } from "./useDraggable";
export { useFullscreen } from "./useFullscreen";
export { useMobileTouch } from "./useMobileTouch";
export { useMobileUpload } from "./useMobileUpload";
export { useScrollAnimation } from "./useScrollAnimation";
export { usePerformanceMode } from "./usePerformanceMode";

// Notifications & Preferences
export { useNotificationPreferences } from "./useNotificationPreferences";
export { usePushNotifications } from "./usePushNotifications";
export { useTransactionNotifications } from "./useTransactionNotifications";

// Onboarding & Setup
export { useOnboarding } from "./useOnboarding";

// Realtime & Data
export { useOnlinePresence } from "./useOnlinePresence";
export { useRealtimeConnection } from "./useRealtimeConnection";
export { useInfiniteFeed } from "./useInfiniteFeed";
