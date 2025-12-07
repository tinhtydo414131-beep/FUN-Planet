import { toast } from "sonner";

/**
 * Retry wrapper for Supabase operations with exponential backoff
 * Specifically designed to handle mobile network issues
 */
export async function withRetry<T>(
  operation: () => Promise<{ data: T | null; error: any }>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    onRetry?: (attempt: number, error: any) => void;
    showToast?: boolean;
    operationName?: string;
  } = {}
): Promise<{ data: T | null; error: any }> {
  const {
    maxRetries = 3,
    initialDelay = 500,
    maxDelay = 5000,
    onRetry,
    showToast = true,
    operationName = "Thao tác"
  } = options;

  let lastError: any = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      
      // If successful or error is not retryable, return immediately
      if (!result.error) {
        return result;
      }
      
      // Check if error is retryable (network issues, timeouts)
      const errorMessage = result.error?.message?.toLowerCase() || '';
      const isRetryable = 
        errorMessage.includes('network') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('fetch') ||
        errorMessage.includes('connection') ||
        errorMessage.includes('econnreset') ||
        errorMessage.includes('socket') ||
        result.error?.code === 'PGRST301' || // Timeout
        result.error?.code === '57014'; // Query cancelled
      
      if (!isRetryable || attempt === maxRetries) {
        return result;
      }
      
      lastError = result.error;
      
      // Calculate delay with exponential backoff and jitter
      const delay = Math.min(
        initialDelay * Math.pow(2, attempt - 1) + Math.random() * 200,
        maxDelay
      );
      
      if (showToast && attempt < maxRetries) {
        toast.info(`⏳ ${operationName} đang thử lại... (${attempt}/${maxRetries})`);
      }
      
      onRetry?.(attempt, result.error);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      
    } catch (error: any) {
      lastError = error;
      
      if (attempt === maxRetries) {
        return { data: null, error };
      }
      
      const delay = Math.min(initialDelay * Math.pow(2, attempt - 1), maxDelay);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return { data: null, error: lastError };
}

/**
 * Helper to create upsert operation for profiles
 * This ensures data is saved even if the user already exists
 */
export async function upsertProfile(
  supabase: any,
  profileData: Record<string, any>,
  userId: string
): Promise<{ data: any; error: any }> {
  return withRetry(
    async () => {
      // First try update
      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', userId)
        .select()
        .single();
      
      if (error && error.code === 'PGRST116') {
        // No rows returned - profile doesn't exist, try insert
        return supabase
          .from('profiles')
          .insert({ id: userId, ...profileData })
          .select()
          .single();
      }
      
      return { data, error };
    },
    {
      operationName: "Lưu thông tin",
      maxRetries: 3
    }
  );
}

/**
 * Debounce function for preventing double submissions
 */
export function createSubmitGuard() {
  let isSubmitting = false;
  let lastSubmitTime = 0;
  const DEBOUNCE_MS = 1000; // 1 second debounce

  return {
    canSubmit: (): boolean => {
      const now = Date.now();
      if (isSubmitting || now - lastSubmitTime < DEBOUNCE_MS) {
        return false;
      }
      return true;
    },
    startSubmit: () => {
      isSubmitting = true;
      lastSubmitTime = Date.now();
    },
    endSubmit: () => {
      isSubmitting = false;
    }
  };
}

/**
 * Format error message for user-friendly display
 */
export function formatErrorMessage(error: any): string {
  const errorMessage = error?.message?.toLowerCase() || '';
  
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return 'Mạng không ổn định. Vui lòng kiểm tra kết nối internet và thử lại.';
  }
  
  if (errorMessage.includes('timeout')) {
    return 'Kết nối quá lâu. Vui lòng thử lại.';
  }
  
  if (errorMessage.includes('duplicate') || errorMessage.includes('unique')) {
    return 'Thông tin này đã tồn tại.';
  }
  
  if (errorMessage.includes('permission') || errorMessage.includes('denied') || errorMessage.includes('policy')) {
    return 'Bạn không có quyền thực hiện thao tác này.';
  }
  
  if (errorMessage.includes('not found')) {
    return 'Không tìm thấy dữ liệu.';
  }
  
  // Return original message if no match
  return error?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';
}
