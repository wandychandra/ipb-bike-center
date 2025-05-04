import { supabase } from "@/lib/supabase";

export async function JumlahSepedaTersedia(): Promise<number> {
  const { count, error } = await supabase
    .from('DataSepeda')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Tersedia');

  if (error) {
    throw new Error(`Gagal mendapatkan jumlah sepeda: ${error.message}`);
  }

  return count || 0;
}

export async function JumlahSepedaDipinjam(): Promise<number> {
  const { count, error } = await supabase
    .from('DataSepeda')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Dipinjam');

  if (error) {
    throw new Error(`Gagal mendapatkan jumlah sepeda: ${error.message}`);
  }

  return count || 0;
}

export async function JumlahPeminjamanBulanan(): Promise<number> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // getMonth() is zero-based

  const firstDay = `${year}-${month}-01`;
  const lastDay = `${year}-${month}-31`;

  const { count, error } = await supabase
    .from('Peminjaman')
    .select('*', { count: 'exact', head: true })
    .gte('tanggalPeminjaman', firstDay)
    .lte('tanggalPeminjaman', lastDay);

  if (error) {
    throw new Error(`Gagal mendapatkan jumlah peminjaman bulanan: ${error.message}`);
  }

  return count || 0;
}
