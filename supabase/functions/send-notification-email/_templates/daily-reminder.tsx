import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "https://esm.sh/@react-email/components@0.0.22";
import * as React from "https://esm.sh/react@18.3.1";

interface DailyReminderEmailProps {
  username: string;
  currentStreak: number;
  potentialReward: number;
  hoursLeft: number;
  emailId: string;
  trackingBaseUrl: string;
}

export const DailyReminderEmail = ({
  username = "User",
  currentStreak = 5,
  potentialReward = 100,
  hoursLeft = 6,
  emailId,
  trackingBaseUrl,
}: DailyReminderEmailProps) => (
  <Html>
    <Head />
    <Preview>{`⏰ Còn ${hoursLeft} giờ để nhận ${potentialReward} CAMLY hàng ngày!`}</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Header */}
        <Section style={header}>
          <Text style={clockEmoji}>⏰</Text>
          <Heading style={h1}>Đừng quên nhận thưởng!</Heading>
          <Text style={subtitle}>Xin chào {username}</Text>
        </Section>

        {/* Urgency Banner */}
        <Section style={urgencyBanner}>
          <Text style={urgencyText}>
            ⚡ Còn <strong>{hoursLeft} giờ</strong> để nhận thưởng hôm nay!
          </Text>
        </Section>

        {/* Streak Section */}
        <Section style={streakSection}>
          <Text style={streakLabel}>Chuỗi đăng nhập hiện tại</Text>
          <Text style={streakNumber}>{currentStreak}</Text>
          <Text style={streakDays}>ngày liên tiếp 🔥</Text>
        </Section>

        {/* Reward Preview */}
        <Section style={rewardPreview}>
          <Text style={rewardLabel}>Phần thưởng chờ bạn</Text>
          <Text style={rewardValue}>+{potentialReward.toLocaleString()} CAMLY</Text>
          <Text style={bonusHint}>
            {currentStreak >= 6 
              ? "🎁 Bonus x2 vào ngày thứ 7!" 
              : `Còn ${7 - currentStreak} ngày nữa để nhận bonus x2!`}
          </Text>
        </Section>

        {/* CTA Button */}
        <Section style={buttonSection}>
          <Link
            href={`${trackingBaseUrl}?id=${emailId}&action=click&redirect=https://funplanet.vn/daily-reward`}
            style={button}
          >
            Nhận Thưởng Ngay 🎁
          </Link>
        </Section>

        {/* Warning */}
        <Section style={warningSection}>
          <Text style={warningText}>
            ⚠️ Nếu bỏ lỡ, chuỗi đăng nhập sẽ reset về 0!
          </Text>
        </Section>

        {/* Footer */}
        <Section style={footer}>
          <Text style={footerText}>
            Đăng nhập mỗi ngày để tích lũy thêm nhiều CAMLY!
          </Text>
          <Text style={footerLinks}>
            <Link href="https://funplanet.vn" style={link}>
              FunPlanet
            </Link>
            {" • "}
            <Link href="https://funplanet.vn/settings" style={link}>
              Tắt nhắc nhở
            </Link>
          </Text>
        </Section>

        {/* Tracking Pixel */}
        <Img
          src={`${trackingBaseUrl}?id=${emailId}&action=open`}
          width="1"
          height="1"
          alt=""
          style={{ display: "none" }}
        />
      </Container>
    </Body>
  </Html>
);

export default DailyReminderEmail;

const main = {
  backgroundColor: "#0f0f23",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "560px",
};

const header = {
  textAlign: "center" as const,
  paddingBottom: "20px",
};

const clockEmoji = {
  fontSize: "48px",
  margin: "0 0 16px 0",
};

const h1 = {
  color: "#ffffff",
  fontSize: "28px",
  fontWeight: "bold" as const,
  margin: "0 0 8px 0",
  padding: "0",
};

const subtitle = {
  color: "#a0a0a0",
  fontSize: "16px",
  margin: "0",
};

const urgencyBanner = {
  backgroundColor: "#dc2626",
  borderRadius: "8px",
  padding: "16px",
  textAlign: "center" as const,
  margin: "24px 0",
};

const urgencyText = {
  color: "#ffffff",
  fontSize: "16px",
  margin: "0",
};

const streakSection = {
  backgroundColor: "#1a1a2e",
  border: "2px solid #f97316",
  borderRadius: "16px",
  padding: "24px",
  textAlign: "center" as const,
  margin: "24px 0",
};

const streakLabel = {
  color: "#a0a0a0",
  fontSize: "14px",
  margin: "0 0 8px 0",
  textTransform: "uppercase" as const,
};

const streakNumber = {
  color: "#f97316",
  fontSize: "64px",
  fontWeight: "bold" as const,
  margin: "0",
  lineHeight: "1",
};

const streakDays = {
  color: "#ffffff",
  fontSize: "18px",
  margin: "8px 0 0 0",
};

const rewardPreview = {
  backgroundColor: "#1e3a5f",
  borderRadius: "12px",
  padding: "20px",
  textAlign: "center" as const,
  margin: "24px 0",
};

const rewardLabel = {
  color: "#a0a0a0",
  fontSize: "14px",
  margin: "0 0 8px 0",
  textTransform: "uppercase" as const,
};

const rewardValue = {
  color: "#4ade80",
  fontSize: "32px",
  fontWeight: "bold" as const,
  margin: "0 0 8px 0",
};

const bonusHint = {
  color: "#fbbf24",
  fontSize: "14px",
  margin: "0",
};

const buttonSection = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#f97316",
  borderRadius: "8px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "18px",
  fontWeight: "bold" as const,
  padding: "16px 40px",
  textDecoration: "none",
};

const warningSection = {
  textAlign: "center" as const,
  margin: "24px 0",
};

const warningText = {
  color: "#fbbf24",
  fontSize: "14px",
  margin: "0",
};

const footer = {
  textAlign: "center" as const,
  paddingTop: "24px",
  borderTop: "1px solid #333",
};

const footerText = {
  color: "#666",
  fontSize: "14px",
  margin: "0 0 16px 0",
};

const footerLinks = {
  color: "#666",
  fontSize: "12px",
  margin: "0",
};

const link = {
  color: "#6366f1",
  textDecoration: "none",
};
