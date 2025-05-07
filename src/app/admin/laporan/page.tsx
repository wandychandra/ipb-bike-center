import ReportDashboard from "@/features/laporan/dashboard-laporan"
import PageContainer from "@/components/layout/page-container"

export const metadata = {
  title: "Laporan Peminjaman | IPB Bike Center",
  description: "Laporan data peminjaman sepeda di IPB Bike Center",
}

export default async function ReportPage() {
  return (
    <PageContainer scrollable={true}>
    <div className='flex flex-1 flex-col space-y-4'>
      <h1 className="text-3xl font-bold mb-6">Laporan Peminjaman Sepeda</h1>
      <ReportDashboard />
    </div>
    </PageContainer>
  )
}
