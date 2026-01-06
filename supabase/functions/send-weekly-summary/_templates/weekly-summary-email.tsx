import React from 'https://esm.sh/react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Text,
  Section,
  Row,
  Column,
  Hr,
} from 'https://esm.sh/@react-email/components@0.0.22'

interface WeeklySummaryEmailProps {
  username: string;
  gamesPlayed: number;
  camlyEarned: number;
  newAchievements: number;
  weekStart: string;
  emailId?: string;
  trackingBaseUrl?: string;
}

export const WeeklySummaryEmail = ({
  username,
  gamesPlayed,
  camlyEarned,
  newAchievements,
  weekStart,
  emailId,
  trackingBaseUrl,
}: WeeklySummaryEmailProps) => (
  <Html>
    <Head />
    <Preview>{`🎮 Tổng kết tuần của bạn trên FunPlanet - ${gamesPlayed} games, ${camlyEarned.toLocaleString()} CAMLY`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Text style={logoText}>🌟 FunPlanet</Text>
        </Section>
        
        <Heading style={h1}>Chào {username}! 👋</Heading>
        <Text style={text}>
          Đây là tổng kết hoạt động của bạn trong tuần bắt đầu từ <strong>{weekStart}</strong>:
        </Text>
        
        <Section style={statsSection}>
          <Row>
            <Column style={statBox}>
              <Text style={statEmoji}>🎮</Text>
              <Text style={statNumber}>{gamesPlayed}</Text>
              <Text style={statLabel}>Games Played</Text>
            </Column>
            <Column style={statBox}>
              <Text style={statEmoji}>💎</Text>
              <Text style={statNumber}>{camlyEarned.toLocaleString()}</Text>
              <Text style={statLabel}>CAMLY Earned</Text>
            </Column>
            <Column style={statBox}>
              <Text style={statEmoji}>🏆</Text>
              <Text style={statNumber}>{newAchievements}</Text>
              <Text style={statLabel}>New Achievements</Text>
            </Column>
          </Row>
        </Section>

        <Hr style={hr} />
        
        <Text style={motivationText}>
          {gamesPlayed > 10 
            ? "🔥 Tuyệt vời! Bạn đã có một tuần cực kỳ năng động!" 
            : gamesPlayed > 5 
            ? "👍 Tốt lắm! Tiếp tục duy trì nhé!" 
            : "💪 Hãy chơi thêm game để kiếm nhiều CAMLY hơn nữa!"}
        </Text>

        {/* CTA Button */}
        {emailId && trackingBaseUrl && (
          <Section style={buttonSection}>
            <Link
              href={`${trackingBaseUrl}?id=${emailId}&action=click&redirect=https://funplanet.vn/games`}
              style={button}
            >
              Chơi Game Ngay 🎮
            </Link>
          </Section>
        )}
        
        <Text style={footer}>
          Tiếp tục chơi game và kiếm thêm CAMLY nhé! 🚀
        </Text>
        
        <Hr style={hr} />
        
        <Text style={footerSmall}>
          © 2025 FunPlanet. Email này được gửi tự động hàng tuần.
          <br />
          <Link href="https://funplanet.vn/settings" style={footerLink}>
            Cài đặt email
          </Link>
        </Text>

        {/* Tracking Pixel */}
        {emailId && trackingBaseUrl && (
          <Img
            src={`${trackingBaseUrl}?id=${emailId}&action=open`}
            width="1"
            height="1"
            alt=""
            style={{ display: 'none' }}
          />
        )}
      </Container>
    </Body>
  </Html>
)

export default WeeklySummaryEmail

const main = {
  backgroundColor: '#0f0f23',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif',
}

const container = {
  padding: '24px',
  margin: '0 auto',
  maxWidth: '600px',
  backgroundColor: '#1a1a2e',
  borderRadius: '12px',
}

const logoSection = {
  textAlign: 'center' as const,
  marginBottom: '20px',
}

const logoText = {
  fontSize: '28px',
  fontWeight: 'bold' as const,
  color: '#fbbf24',
  margin: '0',
}

const h1 = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold' as const,
  margin: '20px 0 10px',
  textAlign: 'center' as const,
}

const text = {
  color: '#a1a1aa',
  fontSize: '14px',
  lineHeight: '24px',
  textAlign: 'center' as const,
}

const statsSection = {
  margin: '24px 0',
  backgroundColor: '#16213e',
  borderRadius: '8px',
  padding: '20px',
}

const statBox = {
  textAlign: 'center' as const,
  padding: '10px',
}

const statEmoji = {
  fontSize: '32px',
  margin: '0 0 8px',
}

const statNumber = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold' as const,
  margin: '0 0 4px',
}

const statLabel = {
  color: '#71717a',
  fontSize: '12px',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  margin: '0',
}

const hr = {
  borderColor: '#27272a',
  margin: '20px 0',
}

const motivationText = {
  color: '#22c55e',
  fontSize: '16px',
  fontWeight: '500' as const,
  textAlign: 'center' as const,
  margin: '16px 0',
}

const footer = {
  color: '#a1a1aa',
  fontSize: '14px',
  textAlign: 'center' as const,
  margin: '16px 0',
}

const footerSmall = {
  color: '#52525b',
  fontSize: '11px',
  textAlign: 'center' as const,
  margin: '0',
}

const footerLink = {
  color: '#6366f1',
  textDecoration: 'none',
}

const buttonSection = {
  textAlign: 'center' as const,
  margin: '24px 0',
}

const button = {
  backgroundColor: '#6366f1',
  borderRadius: '8px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: 'bold' as const,
  padding: '14px 32px',
  textDecoration: 'none',
}
