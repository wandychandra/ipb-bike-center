-- Tabel untuk menyimpan data pengguna
CREATE TABLE IF NOT EXISTS "Users" (
  "id" UUID PRIMARY KEY,
  "email" VARCHAR NOT NULL,
  "nama" VARCHAR NOT NULL,
  "nomorTelepon" VARCHAR,
  "role" VARCHAR DEFAULT 'user',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "deleted" BOOLEAN DEFAULT FALSE
);

-- Tabel untuk menyimpan data sepeda (mempertahankan struktur asli)
CREATE TABLE IF NOT EXISTS "DataSepeda" (
  "nomorSeri" VARCHAR PRIMARY KEY,
  "merk" VARCHAR NOT NULL,
  "jenis" VARCHAR NOT NULL,
  "status" VARCHAR NOT NULL,
  "tanggalPerawatanTerakhir" DATE NOT NULL,
  "deskripsi" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel untuk menyimpan status peminjaman
CREATE TABLE IF NOT EXISTS "StatusPeminjaman" (
  "id" SERIAL PRIMARY KEY,
  "nama" VARCHAR NOT NULL UNIQUE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel untuk menyimpan data peminjaman
CREATE TABLE IF NOT EXISTS "Peminjaman" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "Users"("id"),
  "nomorSeriSepeda" VARCHAR NOT NULL REFERENCES "DataSepeda"("nomorSeri"),
  "tanggalPeminjaman" DATE NOT NULL,
  "jangkaPeminjaman" VARCHAR NOT NULL,
  "tanggalPengembalian" DATE NOT NULL,
  "statusId" INTEGER NOT NULL REFERENCES "StatusPeminjaman"("id"),
  "nomorTeleponAktif" VARCHAR NOT NULL,
  "fotoPeminjam" VARCHAR,
  "fotoKTP" VARCHAR,
  "fotoQRPengembalian" VARCHAR,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel untuk menyimpan riwayat perawatan sepeda
CREATE TABLE IF NOT EXISTS "RiwayatPerawatan" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "nomorSeriSepeda" VARCHAR NOT NULL REFERENCES "DataSepeda"("nomorSeri"),
  "tanggalPerawatan" DATE NOT NULL,
  "deskripsi" TEXT NOT NULL,
  "teknisiId" UUID REFERENCES "Users"("id"),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mengisi data awal untuk tabel status peminjaman
INSERT INTO "StatusPeminjaman" ("nama") VALUES 
  ('Menunggu Persetujuan'), ('Disetujui'), ('Ditolak'), ('Selesai'), ('Dibatalkan')
ON CONFLICT DO NOTHING;

-- Fungsi untuk mengupdate timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger untuk mengupdate timestamp
CREATE TRIGGER update_users_timestamp
BEFORE UPDATE ON "Users"
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_datasepeda_timestamp
BEFORE UPDATE ON "DataSepeda"
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_peminjaman_timestamp
BEFORE UPDATE ON "Peminjaman"
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_riwayatperawatan_timestamp
BEFORE UPDATE ON "RiwayatPerawatan"
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

-- Tambahkan trigger untuk DataSepeda jika tabel sudah ada
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'DataSepeda') THEN
    -- Pastikan kolom updatedAt ada
    IF EXISTS (SELECT FROM information_schema.columns 
               WHERE table_schema = 'public' AND table_name = 'DataSepeda' AND column_name = 'updatedAt') THEN
      -- Buat trigger
      CREATE TRIGGER update_datasepeda_timestamp
      BEFORE UPDATE ON "DataSepeda"
      FOR EACH ROW EXECUTE PROCEDURE update_timestamp();
    END IF;
  END IF;
END
$$;

ALTER TABLE public."Peminjaman"
DROP CONSTRAINT Peminjaman_userId_fkey,
ADD CONSTRAINT Peminjaman_userId_fkey FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON DELETE CASCADE;
