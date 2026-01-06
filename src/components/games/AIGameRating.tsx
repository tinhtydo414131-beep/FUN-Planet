import { Shield, ShieldAlert, ShieldCheck, Star, AlertTriangle, BookOpen, Sparkles, Baby, User, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AIReview {
  overall_score: number;
  is_safe_for_kids: boolean;
  recommended_age: string;
  violence_score: number;
  violence_types: string[];
  violence_details: string;
  has_lootbox: boolean;
  has_gambling_mechanics: boolean;
  monetization_concerns: string[];
  educational_score: number;
  educational_categories: string[];
  learning_outcomes: string[];
  detected_themes: string[];
  positive_aspects: string[];
  concerns: string[];
  review_summary: string;
  confidence_score: number;
}

// Age Badge Component
export const AgeBadge = ({ age, size = "md" }: { age: string; size?: "sm" | "md" | "lg" }) => {
  const getAgeConfig = (age: string) => {
    switch (age) {
      case "3+":
        return { bg: "bg-green-500", icon: Baby, label: "3+" };
      case "6+":
        return { bg: "bg-blue-500", icon: Baby, label: "6+" };
      case "9+":
        return { bg: "bg-yellow-500", icon: User, label: "9+" };
      case "12+":
        return { bg: "bg-orange-500", icon: Users, label: "12+" };
      case "Not suitable":
        return { bg: "bg-red-500", icon: ShieldAlert, label: "18+" };
      default:
        return { bg: "bg-gray-500", icon: User, label: age };
    }
  };

  const config = getAgeConfig(age);
  const Icon = config.icon;
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-2"
  };

  return (
    <Badge className={cn(config.bg, "text-white font-bold", sizeClasses[size])}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
};

// Safety Badge Component
export const SafetyBadge = ({ isSafe, size = "md" }: { isSafe: boolean; size?: "sm" | "md" | "lg" }) => {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-2"
  };

  return isSafe ? (
    <Badge className={cn("bg-green-500/20 text-green-400 border-green-500/50", sizeClasses[size])}>
      <ShieldCheck className="w-3 h-3 mr-1" />
      An toàn cho bé
    </Badge>
  ) : (
    <Badge className={cn("bg-red-500/20 text-red-400 border-red-500/50", sizeClasses[size])}>
      <ShieldAlert className="w-3 h-3 mr-1" />
      Cần kiểm duyệt
    </Badge>
  );
};

// Violence Meter Component
export const ViolenceMeter = ({ score }: { score: number }) => {
  const getColor = (score: number) => {
    if (score <= 2) return "bg-green-500";
    if (score <= 4) return "bg-yellow-500";
    if (score <= 6) return "bg-orange-500";
    return "bg-red-500";
  };

  const getLabel = (score: number) => {
    if (score <= 2) return "Không bạo lực";
    if (score <= 4) return "Bạo lực nhẹ";
    if (score <= 6) return "Bạo lực vừa";
    return "Bạo lực cao";
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Mức độ bạo lực</span>
        <span className="font-medium">{getLabel(score)}</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div 
          className={cn("h-full transition-all", getColor(score))}
          style={{ width: `${score * 10}%` }}
        />
      </div>
    </div>
  );
};

// Educational Stars Component
export const EducationalStars = ({ score }: { score: number }) => {
  const stars = Math.round(score / 2);
  
  return (
    <div className="flex items-center gap-1">
      <BookOpen className="w-4 h-4 text-blue-400 mr-1" />
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            "w-4 h-4",
            i <= stars ? "text-yellow-400 fill-yellow-400" : "text-gray-600"
          )}
        />
      ))}
      <span className="ml-2 text-sm text-muted-foreground">({score}/10)</span>
    </div>
  );
};

// Lootbox Warning Component
export const LootboxWarning = ({ hasLootbox, hasGambling }: { hasLootbox: boolean; hasGambling: boolean }) => {
  if (!hasLootbox && !hasGambling) return null;

  return (
    <div className="bg-orange-500/20 border border-orange-500/50 rounded-lg p-3 flex items-start gap-2">
      <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
      <div>
        <p className="font-medium text-orange-400">Cảnh báo kiếm tiền</p>
        <ul className="text-sm text-muted-foreground mt-1">
          {hasLootbox && <li>• Có cơ chế lootbox/hộp quà ngẫu nhiên</li>}
          {hasGambling && <li>• Có yếu tố cờ bạc/may rủi</li>}
        </ul>
      </div>
    </div>
  );
};

// Overall Score Badge
export const OverallScoreBadge = ({ score }: { score: number }) => {
  const getConfig = (score: number) => {
    if (score >= 80) return { bg: "bg-green-500", label: "Xuất sắc" };
    if (score >= 60) return { bg: "bg-blue-500", label: "Tốt" };
    if (score >= 40) return { bg: "bg-yellow-500", label: "Trung bình" };
    if (score >= 20) return { bg: "bg-orange-500", label: "Kém" };
    return { bg: "bg-red-500", label: "Không đạt" };
  };

  const config = getConfig(score);

  return (
    <div className={cn("rounded-full w-16 h-16 flex flex-col items-center justify-center", config.bg)}>
      <span className="text-xl font-bold text-white">{score}</span>
      <span className="text-[10px] text-white/80">/100</span>
    </div>
  );
};

// Full AI Review Card for Admin
export const AIReviewCard = ({ review }: { review: AIReview }) => {
  return (
    <Card className="bg-card/50 border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-purple-400" />
            Đánh giá Angel AI
          </CardTitle>
          <div className="flex items-center gap-2">
            <OverallScoreBadge score={review.overall_score} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Badges Row */}
        <div className="flex flex-wrap gap-2">
          <AgeBadge age={review.recommended_age} />
          <SafetyBadge isSafe={review.is_safe_for_kids} />
        </div>

        {/* Summary */}
        <p className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg">
          {review.review_summary}
        </p>

        {/* Violence & Educational */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <ViolenceMeter score={review.violence_score} />
            {review.violence_types?.length > 0 && review.violence_types[0] !== 'none' && (
              <div className="flex flex-wrap gap-1">
                {review.violence_types.map((type) => (
                  <Badge key={type} variant="outline" className="text-xs">
                    {type}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <EducationalStars score={review.educational_score} />
            {review.educational_categories?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {review.educational_categories.map((cat) => (
                  <Badge key={cat} variant="secondary" className="text-xs">
                    {cat}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Lootbox Warning */}
        <LootboxWarning 
          hasLootbox={review.has_lootbox} 
          hasGambling={review.has_gambling_mechanics} 
        />

        {/* Positive Aspects & Concerns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {review.positive_aspects?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-green-400 mb-1">✓ Điểm tích cực</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                {review.positive_aspects.slice(0, 3).map((aspect, i) => (
                  <li key={i}>• {aspect}</li>
                ))}
              </ul>
            </div>
          )}
          {review.concerns?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-orange-400 mb-1">⚠ Lưu ý</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                {review.concerns.slice(0, 3).map((concern, i) => (
                  <li key={i}>• {concern}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Themes */}
        {review.detected_themes?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {review.detected_themes.map((theme) => (
              <Badge key={theme} variant="outline" className="text-xs bg-purple-500/10 border-purple-500/30">
                {theme}
              </Badge>
            ))}
          </div>
        )}

        {/* Confidence */}
        <div className="text-xs text-muted-foreground text-right">
          Độ tin cậy: {Math.round((review.confidence_score || 0.8) * 100)}%
        </div>
      </CardContent>
    </Card>
  );
};

// Compact version for game cards
export const AIRatingBadges = ({ review }: { review: Partial<AIReview> }) => {
  if (!review) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {review.recommended_age && <AgeBadge age={review.recommended_age} size="sm" />}
      {review.is_safe_for_kids !== undefined && (
        <SafetyBadge isSafe={review.is_safe_for_kids} size="sm" />
      )}
      {review.educational_score !== undefined && review.educational_score >= 7 && (
        <Badge className="bg-blue-500/20 text-blue-400 text-xs">
          <BookOpen className="w-3 h-3 mr-1" />
          Giáo dục
        </Badge>
      )}
    </div>
  );
};
