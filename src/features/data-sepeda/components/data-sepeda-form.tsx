'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DataSepeda } from '@/constants/database-api';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const formSchema = z.object({
  nomorSeri: z
    .string()
    .min(5, {
      message: 'Nomor seri harus terdiri dari minimal 5 karakter.'
    })
    .regex(/^[a-zA-Z0-9]+$/, {
      message: 'Nomor seri hanya boleh mengandung karakter alfanumerik.'
    }),
  merk: z
    .string()
    .regex(/^[a-zA-Z\s]+$/, {
      message: 'Merk hanya boleh mengandung karakter alfanumerik dan spasi.'
    }),
  jenis: z.string(),
  status: z.enum(['Tersedia', 'Dipinjam', 'Sedang Perawatan']),
  tanggalPerawatanTerakhir: z.string().optional(),
  deskripsi: z.string()
});

function getCurrentDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}


export default function DataSepedaForm({
  initialData,
  pageTitle
}: {
  initialData: DataSepeda | null;
  pageTitle: string;
}) {
  const defaultValues = {
    nomorSeri: initialData?.nomorSeri || '',
    merk: initialData?.merk || '',
    jenis: initialData?.jenis || '',
    status: initialData?.status as 'Tersedia' | 'Dipinjam' | 'Sedang Perawatan' || 'Tersedia',
    tanggalPerawatanTerakhir: initialData?.tanggalPerawatanTerakhir || getCurrentDate(),
    deskripsi: initialData?.deskripsi || ''
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: defaultValues
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // Memastikan nomorSeri tidak kosong
      const submissionData = {
        ...values,
        nomorSeri: values.nomorSeri || ''
      };

      if (initialData) {
        const { error } = await supabase
          .from('DataSepeda')
          .update(submissionData)
          .eq('nomorSeri', initialData.nomorSeri);

        if (error) {
          throw toast.error(error.message, {
            richColors: true,
            position: 'top-center',
          });
        }
        toast.success('Data sepeda berhasil diperbarui!', {
          richColors: true,
          position: 'top-center',
        });
        
      } else {
        const { error } = await supabase
          .from('DataSepeda')
          .insert(submissionData);

        if (error) {
          throw toast.error(error.message, {
            richColors: true,
            position: 'top-center',
          });
        }
        toast.success('Data sepeda baru berhasil ditambahkan!', {
          richColors: true,
          position: 'top-center',
        });
      }

      setTimeout(() => {
        window.location.href = '/admin/data-sepeda';
      }, 1000);
    } catch {
      toast.error(`Gagal menyimpan data! Cek bagian form yang belum terisi atau ID duplikat!`, {
        richColors: true,
        position: 'top-center',
      });
    }
  }

  return (
    <Card className='mx-auto w-full'>
      <CardHeader>
        <CardTitle className='text-left text-2xl font-bold'>
          {pageTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
            <FormField
              control={form.control}
              name='nomorSeri'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nomor Seri</FormLabel>
                  <FormControl>
                    <Input placeholder='Masukkan nomor seri' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='merk'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Merk</FormLabel>
                  <FormControl>
                    <Input placeholder='Masukkan merk sepeda' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='jenis'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jenis Sepeda</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value)}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Pilih jenis sepeda' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='Gunung'>Gunung</SelectItem>
                      <SelectItem value='Keranjang'>Keranjang</SelectItem>
                      <SelectItem value='Lipat'>Lipat</SelectItem>
                      <SelectItem value='Listrik'>Listrik</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='status'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value)}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Pilih status sepeda' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='Tersedia'>Tersedia</SelectItem>
                      <SelectItem value='Dipinjam'>Dipinjam</SelectItem>
                      <SelectItem value='Sedang Perawatan'>Sedang Perawatan</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='tanggalPerawatanTerakhir'
                render={({ field }) => (
                <FormItem>
                  <FormLabel>Tanggal Perawatan Terakhir</FormLabel>
                  <FormControl>
                    <Input type='date' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
          control={form.control}
          name='deskripsi'
          render={({ field }) => (
          <FormItem>
            <FormLabel>Deskripsi</FormLabel>
            <FormControl>
            <Textarea
              placeholder='Masukkan deskripsi sepeda'
              className='resize-none'
              {...field}
            />
            </FormControl>
            <FormMessage />
          </FormItem>
          )}
        />
        <Button type='submit'>Simpan Data Sepeda</Button>
        </form>
      </Form>
      </CardContent>
    </Card>
  );
}