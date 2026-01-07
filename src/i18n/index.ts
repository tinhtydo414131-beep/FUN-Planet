import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import ja from './locales/ja';
import ko from './locales/ko';
import zh from './locales/zh';
import th from './locales/th';
import id from './locales/id';
import es from './locales/es';
import fr from './locales/fr';
import de from './locales/de';
import ru from './locales/ru';
import pt from './locales/pt';
import hi from './locales/hi';

const resources = {
  en: { translation: { 
    nav: { home: 'Home', games: 'Games', wallet: 'Wallet', profile: 'Profile', friends: 'Friends', messages: 'Messages', leaderboard: 'Leaderboard', settings: 'Settings', playGames: 'Play Games', music: 'Music', rewardGalaxy: '🎁 Gifts From Father Universe', myProfile: 'My Profile', funWallet: 'Fun Wallet', findFriends: 'Find Friends', educationHub: 'Education Hub', inviteFriends: 'Invite Friends', parentControls: 'Parent Controls', achievementLeaderboard: '🏅 Achievement Leaderboard', adminDashboard: 'Admin Dashboard', logOut: 'Log Out', loginSignup: 'Login / Sign Up', upload: 'Upload', rank: 'Rank' }, 
    common: { play: 'Play', back: 'Back', save: 'Save', cancel: 'Cancel', confirm: 'Confirm', loading: 'Loading...', error: 'Error', success: 'Success', welcome: 'Welcome', logout: 'Logout', login: 'Login', signup: 'Sign Up', search: 'Search', close: 'Close', open: 'Open', submit: 'Submit', delete: 'Delete', edit: 'Edit', view: 'View', download: 'Download', share: 'Share', like: 'Like', follow: 'Follow', unfollow: 'Unfollow', send: 'Send', receive: 'Receive' }, 
    wallet: { title: 'FUN Wallet', balance: 'Balance', send: 'Send', receive: 'Receive', history: 'History', connect: 'Connect Wallet', disconnect: 'Disconnect', totalDonated: 'Total Donated', kidsHelped: 'Kids Helped', transactions: 'Transactions' }, 
    games: { title: 'Games', play: 'Play Now', featured: 'Featured Games', popular: 'Popular', new: 'New', categories: 'Categories', search: 'Search games...', uploadGame: 'Upload Game', myGames: 'My Games', recentlyPlayed: 'Recently Played', createdBy: 'Created by', allAges: 'All Ages', ages4to7: '4-7 years', ages8to12: '8-12 years', ages13plus: '13+ years', creative: 'Creative', brain: 'Brain', adventure: 'Universe', casual: 'Friendship', educational: 'Gratitude', racing: 'Earth', loadingTreasure: 'Opening Light Treasure...', treasureVault: 'Light Treasure Vault', gamesAvailable: 'games available', communityGames: 'Community Games', sampleGames: 'Sample Games', lovableGames: 'Lovable Games', builtInGames: 'Built-in Games', filterByAge: 'Filter by Age', filterByTopic: 'Filter by Topic', hotGames: 'Hot Games', newGames: 'New Games', favGames: 'Favorites' }, 
    rewards: { title: 'Rewards', earnedToday: 'Earned Today', totalEarned: 'Total Earned', claimReward: 'Claim Reward', dailyBonus: 'Daily Bonus', gameReward: 'Game Reward', referralReward: 'Referral Reward', uploadReward: 'Upload Reward' }, 
    roles: { selectRole: 'Select Your Role', player: "I'm a Player", playerDesc: 'Play games and earn CAMLY coins!', developer: "I'm a Developer", developerDesc: 'Create games and earn 500,000 CAMLY per game!', welcome: 'Role saved successfully!', welcomeDesc: 'Welcome to FUN Planet 5D!' }, 
    messages: { title: 'Messages', newMessage: 'New Message', typeMessage: 'Type a message...', send: 'Send', online: 'Online', offline: 'Offline', typing: 'typing...' }, 
    profile: { title: 'Profile', editProfile: 'Edit Profile', myAchievements: 'My Achievements', myNFTs: 'My NFTs', totalPlays: 'Total Plays', totalLikes: 'Total Likes', joinedDate: 'Joined' }, 
    leaderboard: { topCreators: 'Top Creators', donateAndSponsor: 'Donate & Sponsor' },
    auth: { welcome: 'Welcome! 🎮', chooseLogin: 'Choose login method', email: 'Email', cryptoWallet: 'Crypto Wallet', login: 'Login', signup: 'Sign Up', username: 'Username', usernamePlaceholder: 'Enter username', password: 'Password', confirmPassword: 'Confirm Password', rememberMe: 'Remember me', forgotPassword: 'Forgot password?', processing: 'Processing...', sendResetLink: 'Send Reset Link', backToLogin: 'Back to Login', walletConnected: 'Wallet Connected', walletAddress: 'Address', disconnect: 'Disconnect', continueToRegister: 'Continue to Register', createAccount: 'Create Account', support: 'Support:', worksOnWebMobile: 'Works on web & mobile', orLoginWith: 'Or login with' },
    hero: { badge: 'The Ultimate Kids Gaming Universe!', slogan: 'Build Your Planet – Play & Earn Joy!', searchPlaceholder: 'Search for games...', searchButton: 'Search', scrollToPlay: 'Scroll to Play' },
    home: { 
      funGames: '100+ Fun Games', funGamesDesc: 'Play amazing games made for kids! From puzzles to adventures! 🎮',
      safeSecure: 'Safe & Secure', safeSecureDesc: 'Kid-friendly content, no ads, and parent-approved safety! 🛡️',
      earnRewards: 'Earn Rewards', earnRewardsDesc: 'Play games and earn crypto tokens you can collect! 🎁',
      makeFriends: 'Make Friends', makeFriendsDesc: 'Chat with other kids and make new gaming buddies! 👥',
      competeWin: 'Compete & Win', competeWinDesc: 'Join the leaderboard and become the top player! 🏆',
      learnPlaying: 'Learn While Playing', learnPlayingDesc: 'Educational games that make learning super fun! ✨',
      gameCategories: 'Game Categories', pickFavorite: 'Pick your favorite type of game!',
      adventure: 'Adventure 🗺️', puzzle: 'Puzzle 🧩', casual: 'Casual 🎯', educational: 'Educational 📚',
      whyKidsLove: 'Why Kids Love Us! 💖', bestExperience: 'Everything you need for the best gaming experience!',
      quickAccess: 'Quick Access 🚀', readyToPlay: 'Ready to Start Playing? 🚀',
      joinThousands: 'Join thousands of kids having fun, making friends, and earning rewards!',
      playNow: 'Play Now! 🎮', uploadGame: 'Upload Game 📤', browseAll: 'Browse All Games 🎮', playNowArrow: 'Play now →',
      gamesLabel: 'Games', uploadLabel: 'Upload', airdropLabel: 'Airdrop', buildLabel: '3D Build', nftsLabel: 'NFTs', chatLabel: 'Chat', parentsLabel: 'Parents', walletLabel: 'Wallet', leadersLabel: 'Leaders', achievementsLabel: 'Achievements', friendsLabel: 'Friends', profileLabel: 'Profile', loginLabel: 'Login',
      footerSlogan: 'Build Your Planet – Play & Earn Joy!', browseGames: 'Browse Games', leaderboard: 'Leaderboard', claimAirdrop: 'Claim Airdrop', nftGallery: 'NFT Gallery', parentDashboard: 'Parent Dashboard', followUs: 'Follow Us', allRightsReserved: 'All rights reserved.'
    },
    landscape: { title: 'Rotate Your Phone', description: 'For the best gaming experience, please rotate your phone to landscape! 🎮✨' }
  } },
  vi: { translation: { 
    nav: { home: 'Trang chủ', games: 'Trò chơi', wallet: 'Ví', profile: 'Hồ sơ', friends: 'Bạn bè', messages: 'Tin nhắn', leaderboard: 'Bảng xếp hạng', settings: 'Cài đặt', playGames: 'Chơi Game', music: 'Nhạc', rewardGalaxy: '🎁 Quà Từ Cha Vũ Trụ', myProfile: 'Hồ Sơ Của Tôi', funWallet: 'Ví Vui Vẻ', findFriends: 'Tìm Bạn Bè', educationHub: 'Trung Tâm Học Tập', inviteFriends: 'Mời Bạn Bè', parentControls: 'Quản Lý Phụ Huynh', achievementLeaderboard: '🏅 BXH Thành Tích', adminDashboard: 'Bảng Điều Khiển Admin', logOut: 'Đăng Xuất', loginSignup: 'Đăng Nhập / Đăng Ký', upload: 'Tải Lên', rank: 'BXH' }, 
    common: { play: 'Chơi', back: 'Quay lại', save: 'Lưu', cancel: 'Hủy', confirm: 'Xác nhận', loading: 'Đang tải...', error: 'Lỗi', success: 'Thành công', welcome: 'Chào mừng', logout: 'Đăng xuất', login: 'Đăng nhập', signup: 'Đăng ký', search: 'Tìm kiếm', close: 'Đóng', open: 'Mở', submit: 'Gửi', delete: 'Xóa', edit: 'Sửa', view: 'Xem', download: 'Tải về', share: 'Chia sẻ', like: 'Thích', follow: 'Theo dõi', unfollow: 'Bỏ theo dõi', send: 'Gửi', receive: 'Nhận' }, 
    wallet: { title: 'Ví FUN', balance: 'Số dư', send: 'Gửi', receive: 'Nhận', history: 'Lịch sử', connect: 'Kết nối ví', disconnect: 'Ngắt kết nối', totalDonated: 'Đã Quyên Góp', kidsHelped: 'Trẻ Em Được Giúp', transactions: 'Giao Dịch' }, 
    games: { title: 'Trò Chơi', play: 'Chơi Ngay', featured: 'Game Nổi Bật', popular: 'Phổ Biến', new: 'Mới', categories: 'Thể Loại', search: 'Tìm kiếm game...', uploadGame: 'Tải Game Lên', myGames: 'Game Của Tôi', recentlyPlayed: 'Chơi Gần Đây', createdBy: 'Tạo bởi', allAges: 'Tất cả', ages4to7: '4-7 tuổi', ages8to12: '8-12 tuổi', ages13plus: '13+ tuổi', creative: 'Sáng tạo', brain: 'Trí tuệ', adventure: 'Vũ trụ', casual: 'Tình bạn', educational: 'Biết ơn', racing: 'Trái Đất', loadingTreasure: 'Đang mở Kho Báu Ánh Sáng...', treasureVault: 'Kho Báu Ánh Sáng', gamesAvailable: 'game có sẵn', communityGames: 'Game Cộng Đồng', sampleGames: 'Game Mẫu', lovableGames: 'Lovable Games', builtInGames: 'Game Tích Hợp', filterByAge: 'Lọc theo độ tuổi', filterByTopic: 'Lọc theo chủ đề', hotGames: 'Game Hot', newGames: 'Game Mới', favGames: 'Yêu Thích' }, 
    rewards: { title: 'Phần Thưởng', earnedToday: 'Hôm Nay', totalEarned: 'Tổng Cộng', claimReward: 'Nhận Thưởng', dailyBonus: 'Thưởng Hàng Ngày', gameReward: 'Thưởng Game', referralReward: 'Thưởng Giới Thiệu', uploadReward: 'Thưởng Upload' }, 
    roles: { selectRole: 'Chọn Vai Trò', player: 'Tôi là Người Chơi', playerDesc: 'Chơi game và kiếm CAMLY coins!', developer: 'Tôi là Lập Trình Viên', developerDesc: 'Tạo game và kiếm 500.000 CAMLY mỗi game!', welcome: 'Role đã được lưu thành công!', welcomeDesc: 'Chào mừng đến FUN Planet 5D!' }, 
    messages: { title: 'Tin Nhắn', newMessage: 'Tin Nhắn Mới', typeMessage: 'Nhập tin nhắn...', send: 'Gửi', online: 'Trực tuyến', offline: 'Ngoại tuyến', typing: 'đang nhập...' }, 
    profile: { title: 'Hồ Sơ', editProfile: 'Chỉnh Sửa', myAchievements: 'Thành Tựu', myNFTs: 'NFT Của Tôi', totalPlays: 'Tổng Lượt Chơi', totalLikes: 'Tổng Lượt Thích', joinedDate: 'Ngày Tham Gia' }, 
    leaderboard: { topCreators: 'Top Nhà Sáng Tạo', donateAndSponsor: 'Donate & Sponsor' },
    auth: { welcome: 'Chào mừng! 🎮', chooseLogin: 'Chọn cách đăng nhập', email: 'Email', cryptoWallet: 'Ví Crypto', login: 'Đăng nhập', signup: 'Đăng ký', username: 'Tên người dùng', usernamePlaceholder: 'Nhập tên người dùng', password: 'Mật khẩu', confirmPassword: 'Xác nhận mật khẩu', rememberMe: 'Ghi nhớ đăng nhập', forgotPassword: 'Quên mật khẩu?', processing: 'Đang xử lý...', sendResetLink: 'Gửi Link Đặt Lại', backToLogin: 'Quay lại Đăng nhập', walletConnected: 'Ví Đã Kết Nối', walletAddress: 'Địa chỉ', disconnect: 'Ngắt kết nối', continueToRegister: 'Tiếp tục Đăng ký', createAccount: 'Tạo Tài Khoản', support: 'Hỗ trợ:', worksOnWebMobile: 'Hoạt động trên web & mobile', orLoginWith: 'Hoặc đăng nhập với' },
    hero: { badge: 'Vũ Trụ Game Trẻ Em Tuyệt Vời Nhất!', slogan: 'Xây Dựng Hành Tinh – Chơi & Nhận Niềm Vui!', searchPlaceholder: 'Tìm kiếm game...', searchButton: 'Tìm kiếm', scrollToPlay: 'Cuộn để Chơi' },
    home: { 
      funGames: '100+ Game Vui', funGamesDesc: 'Chơi các game tuyệt vời dành cho trẻ em! Từ giải đố đến phiêu lưu! 🎮',
      safeSecure: 'An Toàn & Bảo Mật', safeSecureDesc: 'Nội dung thân thiện với trẻ em, không quảng cáo, được phụ huynh phê duyệt! 🛡️',
      earnRewards: 'Kiếm Phần Thưởng', earnRewardsDesc: 'Chơi game và kiếm token crypto để sưu tầm! 🎁',
      makeFriends: 'Kết Bạn Mới', makeFriendsDesc: 'Trò chuyện với các bạn khác và kết bạn mới! 👥',
      competeWin: 'Thi Đấu & Chiến Thắng', competeWinDesc: 'Tham gia bảng xếp hạng và trở thành người chơi số 1! 🏆',
      learnPlaying: 'Học Qua Chơi', learnPlayingDesc: 'Game giáo dục giúp học tập trở nên thú vị! ✨',
      gameCategories: 'Thể Loại Game', pickFavorite: 'Chọn loại game yêu thích của bạn!',
      adventure: 'Phiêu Lưu 🗺️', puzzle: 'Giải Đố 🧩', casual: 'Giải Trí 🎯', educational: 'Giáo Dục 📚',
      whyKidsLove: 'Tại Sao Trẻ Em Yêu Thích! 💖', bestExperience: 'Mọi thứ bạn cần cho trải nghiệm chơi game tốt nhất!',
      quickAccess: 'Truy Cập Nhanh 🚀', readyToPlay: 'Sẵn Sàng Chơi Chưa? 🚀',
      joinThousands: 'Tham gia cùng hàng ngàn bạn nhỏ vui chơi, kết bạn và nhận thưởng!',
      playNow: 'Chơi Ngay! 🎮', uploadGame: 'Tải Game Lên 📤', browseAll: 'Xem Tất Cả Game 🎮', playNowArrow: 'Chơi ngay →',
      gamesLabel: 'Games', uploadLabel: 'Upload', airdropLabel: 'Airdrop', buildLabel: '3D Build', nftsLabel: 'NFTs', chatLabel: 'Chat', parentsLabel: 'Phụ huynh', walletLabel: 'Ví', leadersLabel: 'BXH', achievementsLabel: 'Thành tích', friendsLabel: 'Bạn bè', profileLabel: 'Hồ sơ', loginLabel: 'Đăng nhập',
      footerSlogan: 'Xây Dựng Hành Tinh – Chơi & Nhận Niềm Vui!', browseGames: 'Xem Game', leaderboard: 'Bảng Xếp Hạng', claimAirdrop: 'Nhận Airdrop', nftGallery: 'Bộ Sưu Tập NFT', parentDashboard: 'Trang Phụ Huynh', followUs: 'Theo Dõi', allRightsReserved: 'Bảo lưu mọi quyền.'
    },
    landscape: { title: 'Xoay Điện Thoại Ngang', description: 'Để chơi game tốt nhất, hãy xoay điện thoại ngang nhé con yêu! 🎮✨' }
  } },
  ja: { translation: ja },
  ko: { translation: ko },
  zh: { translation: zh },
  th: { translation: th },
  id: { translation: id },
  es: { translation: es },
  fr: { translation: fr },
  de: { translation: de },
  ru: { translation: ru },
  pt: { translation: pt },
  hi: { translation: hi },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: 'vi',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    detection: { order: ['localStorage', 'navigator'], caches: ['localStorage'] },
  });

export default i18n;
