"use server"

import { Resend } from "resend"
import { EmailKeterlambatan } from "@/components/emails/email-keterlambatan"
import { format, differenceInDays, differenceInHours, parseISO } from "date-fns"
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

      // Hitung hari keterlambatan dan jam keterlambatan berdasarkan jam tutup
      const pengembalianDate = parseISO(peminjaman.tanggalPengembalian)
      const now = new Date()

      // Buat tanggal batas keterlambatan (jam tutup)
      let batasTerlambat = new Date(pengembalianDate)
      const hari = batasTerlambat.getDay() // 0 = Minggu, 1 = Senin, ..., 6 = Sabtu

      if (hari === 0) {
        // Minggu, tidak dihitung, skip ke Senin berikutnya jam 16:00
        batasTerlambat.setDate(batasTerlambat.getDate() + 1)
        batasTerlambat.setHours(16, 0, 0, 0)
      } else if (hari >= 1 && hari <= 5) {
        // Senin - Jumat, jam tutup 16:00
        batasTerlambat.setHours(16, 0, 0, 0)
      } else if (hari === 6) {
        // Sabtu, jam tutup 12:00
        batasTerlambat.setHours(12, 0, 0, 0)
      }

      // Koreksi zona waktu ke UTC+7
      batasTerlambat.setHours(batasTerlambat.getHours() - (batasTerlambat.getTimezoneOffset() / 60 - 7))

      // Jika batasTerlambat hari Minggu, skip ke Senin jam 16:00
      if (batasTerlambat.getDay() === 0) {
        batasTerlambat.setDate(batasTerlambat.getDate() + 1)
        batasTerlambat.setHours(16, 0, 0, 0)
        batasTerlambat.setHours(batasTerlambat.getHours() - (batasTerlambat.getTimezoneOffset() / 60 - 7))
      }

      // Hitung keterlambatan hanya pada hari kerja (Senin-Sabtu)
      let hariTerlambat = 0
      let jamTerlambat = 0
      if (now > batasTerlambat) {
        // Hitung jumlah hari kerja yang dilewati (tidak termasuk Minggu)
        let temp = new Date(batasTerlambat)
        while (temp < now) {
          temp.setDate(temp.getDate() + 1)
          if (temp.getDay() !== 0) hariTerlambat++
        }
        // Hitung jam keterlambatan dari batasTerlambat ke sekarang (jika hariTerlambat == 0)
        if (hariTerlambat === 0) {
          jamTerlambat = differenceInHours(now, batasTerlambat)
        }
      }

      const hariTerlambatFormat =
        hariTerlambat > 0 ? `${hariTerlambat} Hari` : jamTerlambat > 0 ? `${jamTerlambat} Jam` : "0 Jam"

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
          jamAtauHariTerlambat: hariTerlambatFormat,
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
