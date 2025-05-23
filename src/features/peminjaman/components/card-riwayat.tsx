'use client';

import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { toast } from 'sonner';
import { useState, useRef } from 'react';
import { Loader2, Camera } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { FileUploader } from '@/components/file-uploader';
import QrScanner from 'qr-scanner';
import { validateQRCode } from '@/lib/qr-crypto';
import { deleteFileFromStorageSingle } from '@/lib/upload-utils';
import { useUser } from '@clerk/nextjs';
import { useEffect } from 'react';

interface CardRiwayatProps {
  id: string;
  nomorSeriSepeda: string;
  tanggalPeminjaman: string;
  jangkaPeminjaman: string;
  tanggalPengembalian: string;
  statusId: number;
  statusNama: string;
  jenisSepeda: string;
  merkSepeda: string;
  onStatusUpdate: () => void;
}

export function CardRiwayat({
  id,
  nomorSeriSepeda,
  tanggalPeminjaman,
  jangkaPeminjaman,
  tanggalPengembalian,
  statusId,
  statusNama,
  jenisSepeda,
  merkSepeda,
  onStatusUpdate
}: CardRiwayatProps) {
  const { user } = useUser();

  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { supabase } = useSupabaseAuth();
  const [isQRDialogOpen, setIsQRDialogOpen] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scanner, setScanner] = useState<QrScanner>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [qrFiles, setQrFiles] = useState<File[]>([]);
  const [scanResult, setScanResult] = useState<string | null>(null);

  // Format tanggal
  const formatTanggal = (tanggal: string) => {
    try {
      return format(parseISO(tanggal), 'd MMMM yyyy', { locale: localeId });
    } catch {
      return tanggal;
    }
  };

  // Cek keterlambatan pengembalian
  const isTerlambat = async () => {
    if (!tanggalPengembalian) return false;
    try {
      // Konversi tanggalPengembalian ke Date (anggap sudah dalam format ISO)
      const pengembalianDate = parseISO(tanggalPengembalian);

      // Waktu sekarang dalam WIB (UTC+7)
      const now = new Date();
      const nowWIB = new Date(now.getTime() + 7 * 60 * 60 * 1000);

      // Hari dalam minggu (0 = Minggu, 1 = Senin, ..., 6 = Sabtu)
      const dayOfWeek = nowWIB.getUTCDay();
      const hour = nowWIB.getUTCHours();

      // Cek apakah sudah lewat jam batas
      let batasJam = null;
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        // Senin-Jumat
        batasJam = 16;
      } else if (dayOfWeek === 6) {
        // Sabtu
        batasJam = 12;
      } else {
        // Minggu tidak dihitung keterlambatan
        return false;
      }

      // Jika sudah lewat jam batas dan tanggalPengembalian < sekarang WIB
      if (hour >= batasJam && pengembalianDate < nowWIB) {
        // Jika status masih 2 (aktif), update ke 6 (terlambat)
        if (statusId === 2) {
          await supabase.from('Peminjaman').update({ statusId: 6 }).eq('id', id);
          onStatusUpdate();
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Jalankan cek keterlambatan saat komponen mount atau statusId berubah
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (statusId === 2) {
      isTerlambat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusId]);

  // Warna badge
  const getStatusColor = (statusId: number) => {
    switch (statusId) {
      case 1: // Menunggu Persetujuan
        return 'bg-yellow-100 text-yellow-800';
      case 2: // Aktif
        return 'bg-green-100 text-green-800';
      case 3: // Ditolak
        return 'bg-red-100 text-red-800';
      case 4: // Selesai
        return 'bg-blue-100 text-blue-800';
      case 5: // Dibatalkan
        return 'bg-gray-100 text-gray-800';
      case 6: // Terlambat
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  // Fungsi async untuk mengambil nama file dari kolom Supabase Storage (misal: fotoKTM)
  const getFileNameFromSupabase = async (columnName: string) => {
    const { data, error } = await supabase
      .from('Peminjaman')
      .select(columnName)
      .eq('id', id)
      .single();

    const row = data as Record<string, any> | null;

    if (error || !row || !row[columnName]) return '';
    try {
      const url = row[columnName] as string;
      const parts = url.split('/');
      return parts[parts.length - 1];
    } catch {
      return '';
    }
  };

  // Contoh penggunaan:
  // const fileName = await getFileNameFromSupabase('fotoKTM');

  // Batalkan peminjaman
  const handleCancel = async () => {
    setIsLoading(true);
    try {
      let fileNamaKTM = await getFileNameFromSupabase('fotoKTM');
      let fileNamaPeminjam = await getFileNameFromSupabase('fotoPeminjam');
      let fileNamaSurat = await getFileNameFromSupabase('suratPeminjaman');

      await supabase.from('Peminjaman').update({ statusId: 5 }).eq('id', id);
      await supabase
        .from('DataSepeda')
        .update({ status: 'Tersedia' })
        .eq('nomorSeri', nomorSeriSepeda);
      await supabase
        .from('Peminjaman')
        .update({ fotoPeminjam: null, fotoKTM: null, suratPeminjaman: null })
        .eq('id', id);
        
      if (user) {
        await deleteFileFromStorageSingle(supabase, 'peminjaman', `ktm/${user.id}/${fileNamaKTM}`);
        await deleteFileFromStorageSingle(
          supabase,
          'peminjaman',
          `peminjam/${user.id}/${fileNamaPeminjam}`
        );
        await deleteFileFromStorageSingle(
          supabase,
          'peminjaman',
          `surat/${user.id}/${fileNamaSurat}`
        );
      } else {
        throw new Error('User is not authenticated.');
      }
      toast.success('Peminjaman berhasil dibatalkan', { richColors: true });
      onStatusUpdate();
    } catch {
      toast.error('Gagal membatalkan peminjaman', { richColors: true });
    } finally {
      setIsLoading(false);
    }
  };

  // Proses QR code yang terdeteksi
  const processQRResult = async (result: string) => {
    setIsLoading(true);
    setScanResult(result);

    try {
      // Validasi QR code menggunakan fungsi decrypt
      const isValid = await validateQRCode(result, nomorSeriSepeda);

      if (isValid) {
        let fileNamaKTM = await getFileNameFromSupabase('fotoKTM');
        let fileNamaPeminjam = await getFileNameFromSupabase('fotoPeminjam');
        let fileNamaSurat = await getFileNameFromSupabase('suratPeminjaman');
        
        // Update status peminjaman menjadi "Selesai" (statusId 4)
        await supabase.from('Peminjaman').update({ statusId: 4 }).eq('id', id);
        await supabase
          .from('DataSepeda')
          .update({ status: 'Tersedia' })
          .eq('nomorSeri', nomorSeriSepeda);

      if (user) {
        await deleteFileFromStorageSingle(supabase, 'peminjaman', `ktm/${user.id}/${fileNamaKTM}`);
        await deleteFileFromStorageSingle(
          supabase,
          'peminjaman',
          `peminjam/${user.id}/${fileNamaPeminjam}`
        );
        await deleteFileFromStorageSingle(
          supabase,
          'peminjaman',
          `surat/${user.id}/${fileNamaSurat}`
        );
      } else {
        throw new Error('User is not authenticated.');
      }

        toast.success('Sepeda berhasil dikembalikan!', { richColors: true });
        stopCamera();
        setIsQRDialogOpen(false);
        onStatusUpdate();
      } else {
        toast.error('QR code tidak valid.', { richColors: true });
      }
    } catch (error) {
      toast.error(`Gagal memproses QR code: ${error}`, { richColors: true });
    } finally {
      setIsLoading(false);
    }
  };

  // Mulai kamera & QR-scanning otomatis
  const startCamera = async () => {
    setIsCameraActive(true);
    await new Promise(requestAnimationFrame);

    const videoEl = videoRef.current!;
    // nonaktifkan PIP bila ada
    if ('disablePictureInPicture' in videoEl) {
      videoEl.disablePictureInPicture = true;
    }

    const qr = new QrScanner(
      videoEl,
      (result) => {
        // Process the QR code result
        processQRResult(result.data);
      },
      {
        preferredCamera: 'environment',
        maxScansPerSecond: 25,
        highlightScanRegion: true,
        highlightCodeOutline: true,
        returnDetailedScanResult: true
      }
    );

    setScanner(qr);
    await qr.start();
  };

  // Hentikan kamera
  const stopCamera = () => {
    scanner?.stop();
    scanner?.destroy();
    setScanner(undefined);
    setIsCameraActive(false);
  };

  // Scan dari upload file
  const handleQRFile = async (files: File[]) => {
    if (!files.length) return;
    setIsLoading(true);
    try {
      const file = files[0];
      // scanImage mengembalikan string atau null
      const result = await QrScanner.scanImage(file);
      if (result) {
        processQRResult(result);
      } else {
        toast.error('Tidak dapat mendeteksi QR code dalam gambar.', {
          richColors: true
        });
      }
    } catch (error) {
      toast.error(`Gagal memindai file QR: ${error}`, { richColors: true });
    } finally {
      setIsLoading(false);
    }
  };

  const openDialog = () => {
    setIsQRDialogOpen(true);
    setScanResult(null);
  };

  const closeDialog = () => {
    stopCamera();
    setIsQRDialogOpen(false);
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={handleCancel}
        loading={isLoading}
      />
      <Card>
        <CardHeader>
          <div className='flex items-start justify-between'>
            <CardTitle>
              Sepeda {merkSepeda} {jenisSepeda}
            </CardTitle>
            <Badge className={getStatusColor(statusId)}>{statusNama}</Badge>
          </div>
        </CardHeader>
        <CardContent className='space-y-2 text-sm'>
          <div className='flex justify-between'>
            <span className='text-muted-foreground'>Nomor Seri:</span>
            <span className='font-medium'>{nomorSeriSepeda}</span>
          </div>
          <div className='flex justify-between'>
            <span className='text-muted-foreground'>Tanggal Peminjaman:</span>
            <span className='font-medium'>
              {formatTanggal(tanggalPeminjaman)}
            </span>
          </div>
          <div className='flex justify-between'>
            <span className='text-muted-foreground'>Jangka Waktu:</span>
            <span className='font-medium'>{jangkaPeminjaman}</span>
          </div>
          <div className='flex justify-between'>
            <span className='text-muted-foreground'>Tanggal Pengembalian:</span>
            <span className='font-medium'>
              {formatTanggal(tanggalPengembalian)}
            </span>
          </div>
        </CardContent>
        <CardFooter className='flex gap-2'>
          {statusId === 1 && (
            <Button
              variant='destructive'
              className='w-full'
              onClick={() => setOpen(true)}
            >
              {isLoading ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                'Batalkan Peminjaman'
              )}
            </Button>
          )}
          {statusId === 2 || statusId === 6 && (
            <Button
              variant='outline'
              className='w-full'
              onClick={openDialog}
              disabled={isLoading}
            >
              Upload / Scan QR Pengembalian
            </Button>
          )}
        </CardFooter>
      </Card>

      <Dialog open={isQRDialogOpen} onOpenChange={closeDialog}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Scan QR Code Pengembalian</DialogTitle>
            <DialogDescription>
              Pilih opsi untuk scan langsung dari kamera atau upload file gambar
              QR.
            </DialogDescription>
          </DialogHeader>

          <div className='flex flex-col gap-4'>
            {isCameraActive ? (
              <div className='border-input relative overflow-hidden rounded-lg border'>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className='h-64 w-full object-cover'
                />
                {/* QR Scanner detection box */}
                <div>
                  <div className='absolute top-0 left-0 h-4 w-4 rounded-tl border-t-2 border-l-2 border-green-500'></div>
                  <div className='absolute top-0 right-0 h-4 w-4 rounded-tr border-t-2 border-r-2 border-green-500'></div>
                  <div className='absolute bottom-0 left-0 h-4 w-4 rounded-bl border-b-2 border-l-2 border-green-500'></div>
                  <div className='absolute right-0 bottom-0 h-4 w-4 rounded-br border-r-2 border-b-2 border-green-500'></div>
                </div>

                {/* Scanning indicator */}
                <div className='bg-opacity-50 absolute right-0 bottom-0 left-0 bg-black py-1 text-center text-sm text-white'>
                  {isLoading ? 'Memproses QR...' : 'Arahkan kamera ke QR Code'}
                </div>

                <div className='mt-2 flex justify-end'>
                  <Button
                    variant='outline'
                    onClick={stopCamera}
                    disabled={isLoading}
                  >
                    Tutup Kamera
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <Button
                  variant='outline'
                  className='w-full'
                  onClick={startCamera}
                  disabled={isLoading}
                >
                  <Camera className='mr-2 h-4 w-4' />
                  Buka Kamera
                </Button>

                <FileUploader
                  value={qrFiles}
                  onValueChange={setQrFiles}
                  onUpload={handleQRFile}
                  accept={{ 'image/*': [] }}
                  maxSize={1024 * 1024 * 2}
                  maxFiles={1}
                />
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
