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

interface AchievementUnlockedEmailProps {
  username: string;
  achievementName: string;
  achievementDescription: string;
  achievementIcon?: string;
  rewardAmount: number;
  emailId: string;
  trackingBaseUrl: string;
}

export const AchievementUnlockedEmail = ({
  username = "User",
  achievementName = "First Steps",
  achievementDescription = "Complete your first game",
  achievementIcon = "🏆",
  rewardAmount = 100,
  emailId,
  trackingBaseUrl,
}: AchievementUnlockedEmailProps) => (
  <Html>
    <Head />
    <Preview>🏆 Bạn đã mở khóa achievement: {achievementName}!</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Header with confetti effect */}
        <Section style={header}>
          <Text style={celebration}>🎉🎊🎉</Text>
          <Heading style={h1}>Chúc mừng {username}!</Heading>
        </Section>

        {/* Achievement Badge */}
        <Section style={achievementSection}>
          <Text style={achievementIconStyle}>{achievementIcon}</Text>
          <Heading style={achievementTitle}>{achievementName}</Heading>
          <Text style={achievementDesc}>{achievementDescription}</Text>
        </Section>

        {/* Reward Section */}
        {rewardAmount > 0 && (
          <Section style={rewardSection}>
            <Text style={rewardLabel}>Phần thưởng của bạn</Text>
            <Text style={rewardAmount as React.CSSProperties}>+{rewardAmount.toLocaleString()} CAMLY</Text>
          </Section>
        )}

        {/* CTA Button */}
        <Section style={buttonSection}>
          <Link
            href={`${trackingBaseUrl}?id=${emailId}&action=click&redirect=https://funplanet.vn/achievements`}
            style={button}
          >
            Xem tất cả Achievements
          </Link>
        </Section>

        {/* Footer */}
        <Section style={footer}>
          <Text style={footerText}>
            Tiếp tục chơi để mở khóa thêm nhiều achievement thú vị!
          </Text>
          <Text style={footerLinks}>
            <Link href="https://funplanet.vn" style={link}>
              FunPlanet
            </Link>
            {" • "}
            <Link href="https://funplanet.vn/settings" style={link}>
              Cài đặt email
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

export default AchievementUnlockedEmail;

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

const celebration = {
  fontSize: "48px",
  margin: "0 0 16px 0",
};

const h1 = {
  color: "#ffffff",
  fontSize: "28px",
  fontWeight: "bold" as const,
  margin: "0",
  padding: "0",
};

const achievementSection = {
  backgroundColor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  background: "#1a1a2e",
  border: "2px solid #ffd700",
  borderRadius: "16px",
  padding: "32px",
  textAlign: "center" as const,
  margin: "24px 0",
};

const achievementIconStyle = {
  fontSize: "64px",
  margin: "0 0 16px 0",
};

const achievementTitle = {
  color: "#ffd700",
  fontSize: "24px",
  fontWeight: "bold" as const,
  margin: "0 0 8px 0",
};

const achievementDesc = {
  color: "#a0a0a0",
  fontSize: "16px",
  margin: "0",
};

const rewardSection = {
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

const rewardAmountStyle = {
  color: "#4ade80",
  fontSize: "32px",
  fontWeight: "bold" as const,
  margin: "0",
};

const buttonSection = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#6366f1",
  borderRadius: "8px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "16px",
  fontWeight: "bold" as const,
  padding: "14px 32px",
  textDecoration: "none",
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
