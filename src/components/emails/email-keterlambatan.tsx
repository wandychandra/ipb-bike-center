import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Hr,
  Button,
  Img,
} from "@react-email/components"

interface PropsEmailKeterlambatan {
  namaUser: string
  merkSepeda: string
  jenisSepeda: string
  nomorSeriSepeda: string
  tanggalPeminjaman: string
  tanggalPengembalian: string
  jamAtauHariTerlambat: string
}

export const EmailKeterlambatan = ({
  namaUser,
  merkSepeda,
  jenisSepeda,
  nomorSeriSepeda,
  tanggalPeminjaman,
  tanggalPengembalian,
  jamAtauHariTerlambat,
}: PropsEmailKeterlambatan) => {
  return (
    <Html>
      <Head />
      <Preview>Pemberitahuan Keterlambatan Pengembalian Sepeda | IPB Bike Center</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src="https://kbyohjsdzfncnqnnzzwe.supabase.co/storage/v1/object/public/peminjaman//Logo.png"
            width="120"
            height="120"
            alt="IPB University"
            style={logo}
          />

          <Heading style={header}>Pemberitahuan Keterlambatan</Heading>

          <Section style={section}>
            <Text style={paragraph}>Halo <strong>{namaUser}</strong>,</Text>
            <Text style={paragraph}>
              Kami ingin memberitahukan bahwa Anda belum mengembalikan sepeda yang Anda pinjam dari IPB Bike Center.
              Detail peminjaman Anda adalah sebagai berikut:
            </Text>

            <Section style={detailsContainer}>
              <Text style={detailItem}>
                <strong>Sepeda:</strong> {merkSepeda} {jenisSepeda}
              </Text>
              <Text style={detailItem}>
                <strong>Nomor Seri:</strong> {nomorSeriSepeda}
              </Text>
              <Text style={detailItem}>
                <strong>Tanggal Peminjaman:</strong> {tanggalPeminjaman}
              </Text>
              <Text style={detailItem}>
                <strong>Tanggal Pengembalian Seharusnya:</strong> {tanggalPengembalian}
              </Text>
              <Text style={detailItem}>
                <strong>Keterlambatan:</strong> {jamAtauHariTerlambat}
              </Text>
            </Section>

            <Text style={paragraph}>
              Mohon untuk segera mengembalikan sepeda ke lokasi pengembalian terdekat. Keterlambatan pengembalian dapat
              memengaruhi kesempatan Anda untuk meminjam sepeda di masa mendatang.
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href="https://ipbbike.my.id/dashboard/peminjaman">
                Lihat Detail Peminjaman
              </Button>
            </Section>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Jika Anda sudah mengembalikan sepeda ini atau merasa ada kesalahan, silakan hubungi kami di{" "}
            <Link href="mailto:bikecenter@apps.ipb.ac.id" style={link}>
              bikecenter@apps.ipb.ac.id
            </Link>
            .
          </Text>

          <Text style={footer}>&copy; {new Date().getFullYear()} IPB Bike Center. Semua hak dilindungi.</Text>
        </Container>
      </Body>
    </Html>
  )
}

export default EmailKeterlambatan

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
}

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px",
  maxWidth: "600px",
  borderRadius: "8px",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
}

const logo = {
  margin: "0 auto 20px auto",
  display: "block",
}

const header = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center" as const,
  margin: "30px 0",
  padding: "0",
}

const section = {
  padding: "0 20px",
}

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#333",
}

const detailsContainer = {
  backgroundColor: "#f9f9f9",
  borderRadius: "8px",
  padding: "15px",
  marginBottom: "20px",
}

const detailItem = {
  margin: "8px 0",
  fontSize: "15px",
  color: "#333",
}

const buttonContainer = {
  textAlign: "center" as const,
  margin: "30px 0",
}

const button = {
  backgroundColor: "#0084d1",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  padding: "12px 24px",
}

const hr = {
  borderColor: "#e6ebf1",
  margin: "20px 0",
}

const footer = {
  color: "#8898aa",
  fontSize: "14px",
  lineHeight: "22px",
  textAlign: "center" as const,
  marginTop: "16px",
}

const link = {
  color: "#0084d1",
  textDecoration: "underline",
}
