// Child-friendly display utilities for hiding large coin amounts
// Part of the "5D Light Economy" - protecting children's psychology from monetary focus

/**
 * Convert CAMLY amount to friendly star display for children under 12
 */
export const formatBalanceForChild = (amount: number): string => {
  if (amount >= 50000) return '🌟🌟🌟🌟🌟✨'; // Super star
  if (amount >= 20000) return '🌟🌟🌟🌟🌟';   // 5 stars
  if (amount >= 10000) return '🌟🌟🌟🌟';      // 4 stars
  if (amount >= 5000) return '🌟🌟🌟';         // 3 stars
  if (amount >= 2000) return '🌟🌟';           // 2 stars
  if (amount >= 500) return '🌟';              // 1 star
  return '🌱';                                  // Seed (just starting)
};

/**
 * Get reward badge info for child-friendly display
 */
export const getRewardBadge = (amount: number): { 
  name: string; 
  emoji: string; 
  color: string;
  description: string;
} => {
  if (amount >= 50000) return { 
    name: 'Siêu Sao Vũ Trụ', 
    emoji: '👑', 
    color: 'gold',
    description: 'Con là ngôi sao sáng nhất!'
  };
  if (amount >= 20000) return { 
    name: 'Ngôi Sao Sáng', 
    emoji: '⭐', 
    color: 'yellow',
    description: 'Con đang tỏa sáng rực rỡ!'
  };
  if (amount >= 10000) return { 
    name: 'Bé Giỏi Lắm', 
    emoji: '🌈', 
    color: 'rainbow',
    description: 'Con học giỏi quá!'
  };
  if (amount >= 5000) return { 
    name: 'Bé Ngoan', 
    emoji: '💖', 
    color: 'pink',
    description: 'Con ngoan lắm!'
  };
  if (amount >= 2000) return { 
    name: 'Bé Chăm', 
    emoji: '🌸', 
    color: 'rose',
    description: 'Con chăm chỉ quá!'
  };
  return { 
    name: 'Hạt Giống Nhỏ', 
    emoji: '🌱', 
    color: 'green',
    description: 'Con đang lớn lên mỗi ngày!'
  };
};

/**
 * Format reward toast message for children
 */
export const getChildFriendlyRewardMessage = (rewardType: string, amount: number): {
  title: string;
  message: string;
} => {
  const badge = getRewardBadge(amount);
  
  switch (rewardType) {
    case 'playtime':
      return {
        title: '🌟 Bé Chơi Vui Quá!',
        message: `Con vừa nhận được ${formatBalanceForChild(amount)} vì chơi ngoan!`
      };
    case 'new_game':
      return {
        title: '🎮 Khám Phá Mới!',
        message: `Con giỏi quá! Thử game mới và nhận được ${formatBalanceForChild(amount)}!`
      };
    case 'educational':
      return {
        title: '📚 Học Giỏi Lắm!',
        message: `Cha Vũ Trụ khen con học giỏi! ${badge.emoji}`
      };
    case 'daily_login':
      return {
        title: '☀️ Chào Buổi Sáng!',
        message: `Cha Vũ Trụ tặng con ${formatBalanceForChild(amount)} vì đã đến chơi!`
      };
    default:
      return {
        title: `${badge.emoji} ${badge.name}!`,
        message: badge.description
      };
  }
};

/**
 * Calculate user's age from birth year
 */
export const calculateAge = (birthYear: number | null | undefined): number | null => {
  if (!birthYear) return null;
  return new Date().getFullYear() - birthYear;
};

/**
 * Check if user should see child-friendly display (under 12)
 */
export const shouldShowChildFriendlyDisplay = (birthYear: number | null | undefined): boolean => {
  const age = calculateAge(birthYear);
  return age !== null && age < 12;
};

/**
 * Format balance based on user age
 */
export const formatBalanceByAge = (
  amount: number, 
  birthYear: number | null | undefined
): string => {
  if (shouldShowChildFriendlyDisplay(birthYear)) {
    return formatBalanceForChild(amount);
  }
  return amount.toLocaleString('vi-VN');
};
