"use server"

import { Resend } from "resend"
import { EmailKeterlambatan } from "@/components/emails/email-keterlambatan"
import { format, differenceInDays, differenceInHours, differenceInMinutes, parseISO } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { supabaseAdmin } from "@/lib/supabase"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function kirimEmailKeterlambatanByServer() {
  try {
    // Ambil semua peminjaman yang statusId = 6 dan notifikasiTerkirim = false
    const { data: peminjamanList, error } = await supabaseAdmin
      .from("Peminjaman")
      .select("*")
      .eq("statusId", 6)
      .eq("notifikasiTerkirim", false)

    if (error || !peminjamanList || peminjamanList.length === 0) {
      console.error("Tidak ada data peminjaman yang perlu dikirim notifikasi:", error)
      return { sukses: false, error: "Tidak ada data peminjaman" }
    }

    const results = []

    for (const peminjaman of peminjamanList) {
      // Ambil data user
      const { data: user, error: errorUser } = await supabaseAdmin
        .from("Users")
        .select("nama, email, nomorTelepon")
        .eq("id", peminjaman.userId)
        .single()

      if (errorUser || !user?.email) {
        console.error("Data email pengguna tidak ditemukan untuk peminjaman id:", peminjaman.id)
        results.push({ id: peminjaman.id, sukses: false, error: "Email pengguna tidak ditemukan" })
        continue
      }

      // Ambil data sepeda
      const { data: sepeda, error: errorSepeda } = await supabaseAdmin
        .from("DataSepeda")
        .select("merk, jenis")
        .eq("nomorSeri", peminjaman.nomorSeriSepeda)
        .single()

      if (errorSepeda || !sepeda) {
        console.error("Data sepeda tidak ditemukan untuk peminjaman id:", peminjaman.id)
        results.push({ id: peminjaman.id, sukses: false, error: "Data sepeda tidak ditemukan" })
        continue
      }

      // Format tanggal untuk email
      const tanggalPeminjamanFormat = format(parseISO(peminjaman.tanggalPeminjaman), "d MMMM yyyy", { locale: localeId })
      const tanggalPengembalianFormat = format(parseISO(peminjaman.tanggalPengembalian), "d MMMM yyyy", {
        locale: localeId,
      })

      // Tentukan batas pengembalian: Senin-Jumat jam 16:00, Sabtu jam 12:00
      const now = new Date()
      const hari = now.getDay() // 0: Minggu, 1: Senin, ..., 6: Sabtu

      let batasPeminjaman = now
      if (hari === 6) {
        batasPeminjaman.setHours(12, 0, 0, 0)
      } else {
        batasPeminjaman.setHours(16, 0, 0, 0)
      }

      // Hitung hari keterlambatan
      const hariTerlambat = differenceInDays(batasPeminjaman, parseISO(peminjaman.tanggalPengembalian))
      const jamTerlambat = differenceInHours(batasPeminjaman, parseISO(peminjaman.tanggalPengembalian))
      const menitTerlambat = differenceInMinutes(batasPeminjaman, parseISO(peminjaman.tanggalPengembalian))

      const waktuTerlambat = hariTerlambat > 0 ? `${hariTerlambat} Hari ${jamTerlambat} Jam` : jamTerlambat > 0 ? `${jamTerlambat} Jam` : `${menitTerlambat} Menit`

      // Kirim email menggunakan Resend
      const { data, error: errorKirim } = await resend.emails.send({
        from: "IPB Bike Center <no-reply@info.ipbbike.my.id>",
        to: [user.email],
        subject: "Pemberitahuan Keterlambatan Pengembalian Sepeda",
        react: EmailKeterlambatan({
          namaUser: user.nama,
          merkSepeda: sepeda.merk,
          jenisSepeda: sepeda.jenis,
          nomorSeriSepeda: peminjaman.nomorSeriSepeda,
          tanggalPeminjaman: tanggalPeminjamanFormat,
          tanggalPengembalian: tanggalPengembalianFormat,
          jamAtauHariTerlambat: waktuTerlambat,
        }),
      })

      if (errorKirim) {
        console.error("Error mengirim email untuk peminjaman id:", peminjaman.id, errorKirim)
        results.push({ id: peminjaman.id, sukses: false, error: errorKirim })
        continue
      }

      // Update catatan peminjaman untuk menandai bahwa notifikasi telah dikirim
      await supabaseAdmin.from("Peminjaman").update({ notifikasiTerkirim: true }).eq("id", peminjaman.id)
      results.push({ id: peminjaman.id, sukses: true, data })
    }
    return { sukses: true, results }
  } catch (error) {
    console.error("Error dalam kirimEmailKeterlambatan:", error)
    return { sukses: false, error }
  }
}
