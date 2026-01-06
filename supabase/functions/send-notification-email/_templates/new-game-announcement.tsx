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

interface NewGameAnnouncementEmailProps {
  username: string;
  gameName: string;
  gameDescription: string;
  gameImage?: string;
  launchDate: string;
  bonusReward: number;
  emailId: string;
  trackingBaseUrl: string;
}

export const NewGameAnnouncementEmail = ({
  username = "User",
  gameName = "Super Adventure",
  gameDescription = "Một trò chơi phiêu lưu thú vị dành cho mọi lứa tuổi!",
  gameImage = "https://funplanet.vn/placeholder-game.jpg",
  launchDate = "Hôm nay",
  bonusReward = 500,
  emailId,
  trackingBaseUrl,
}: NewGameAnnouncementEmailProps) => (
  <Html>
    <Head />
    <Preview>{`🎮 Game mới: ${gameName} - Nhận ${bonusReward} CAMLY bonus!`}</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Header */}
        <Section style={header}>
          <Text style={newBadge}>🆕 MỚI RA MẮT</Text>
          <Heading style={h1}>{gameName}</Heading>
          <Text style={subtitle}>Xin chào {username}!</Text>
        </Section>

        {/* Game Preview */}
        <Section style={gamePreviewSection}>
          {gameImage && (
            <Img
              src={gameImage}
              width="100%"
              height="auto"
              alt={gameName}
              style={gameImageStyle}
            />
          )}
          <Text style={gameDescription as React.CSSProperties}>{gameDescription}</Text>
        </Section>

        {/* Launch Info */}
        <Section style={launchInfo}>
          <Text style={launchLabel}>📅 Ngày ra mắt</Text>
          <Text style={launchDateStyle}>{launchDate}</Text>
        </Section>

        {/* Bonus Section */}
        {bonusReward > 0 && (
          <Section style={bonusSection}>
            <Text style={bonusLabel}>🎁 BONUS ĐẶC BIỆT</Text>
            <Text style={bonusAmount}>+{bonusReward.toLocaleString()} CAMLY</Text>
            <Text style={bonusNote}>Dành cho 100 người chơi đầu tiên!</Text>
          </Section>
        )}

        {/* CTA Button */}
        <Section style={buttonSection}>
          <Link
            href={`${trackingBaseUrl}?id=${emailId}&action=click&redirect=https://funplanet.vn/games`}
            style={button}
          >
            Chơi Ngay 🎮
          </Link>
        </Section>

        {/* Features List */}
        <Section style={featuresSection}>
          <Text style={featuresTitle}>✨ Tính năng nổi bật:</Text>
          <Text style={featureItem}>🎯 Gameplay dễ chơi, khó bỏ</Text>
          <Text style={featureItem}>🏆 Nhiều achievement để mở khóa</Text>
          <Text style={featureItem}>💰 Kiếm CAMLY khi chơi</Text>
          <Text style={featureItem}>👨‍👩‍👧‍👦 Phù hợp mọi lứa tuổi</Text>
        </Section>

        {/* Footer */}
        <Section style={footer}>
          <Text style={footerText}>
            Khám phá thêm nhiều game thú vị khác tại FunPlanet!
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

export default NewGameAnnouncementEmail;

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

const newBadge = {
  backgroundColor: "#22c55e",
  borderRadius: "20px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "12px",
  fontWeight: "bold" as const,
  padding: "6px 16px",
  margin: "0 0 16px 0",
  textTransform: "uppercase" as const,
};

const h1 = {
  color: "#ffffff",
  fontSize: "32px",
  fontWeight: "bold" as const,
  margin: "0 0 8px 0",
  padding: "0",
};

const subtitle = {
  color: "#a0a0a0",
  fontSize: "16px",
  margin: "0",
};

const gamePreviewSection = {
  backgroundColor: "#1a1a2e",
  borderRadius: "16px",
  overflow: "hidden",
  margin: "24px 0",
};

const gameImageStyle = {
  borderRadius: "16px 16px 0 0",
};

const gameDescriptionStyle = {
  color: "#e0e0e0",
  fontSize: "16px",
  lineHeight: "1.6",
  padding: "20px",
  margin: "0",
};

const launchInfo = {
  textAlign: "center" as const,
  margin: "24px 0",
};

const launchLabel = {
  color: "#a0a0a0",
  fontSize: "14px",
  margin: "0 0 4px 0",
};

const launchDateStyle = {
  color: "#ffffff",
  fontSize: "20px",
  fontWeight: "bold" as const,
  margin: "0",
};

const bonusSection = {
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  backgroundColor: "#6366f1",
  borderRadius: "16px",
  padding: "24px",
  textAlign: "center" as const,
  margin: "24px 0",
};

const bonusLabel = {
  color: "#fbbf24",
  fontSize: "14px",
  fontWeight: "bold" as const,
  margin: "0 0 8px 0",
  textTransform: "uppercase" as const,
};

const bonusAmount = {
  color: "#ffffff",
  fontSize: "36px",
  fontWeight: "bold" as const,
  margin: "0 0 8px 0",
};

const bonusNote = {
  color: "#e0e0e0",
  fontSize: "14px",
  margin: "0",
};

const buttonSection = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#22c55e",
  borderRadius: "8px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "18px",
  fontWeight: "bold" as const,
  padding: "16px 48px",
  textDecoration: "none",
};

const featuresSection = {
  backgroundColor: "#1a1a2e",
  borderRadius: "12px",
  padding: "20px",
  margin: "24px 0",
};

const featuresTitle = {
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold" as const,
  margin: "0 0 12px 0",
};

const featureItem = {
  color: "#e0e0e0",
  fontSize: "14px",
  margin: "8px 0",
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
