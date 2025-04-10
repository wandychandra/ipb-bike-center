import { Metadata } from 'next';
import { SignUpViewPage } from 'src/features/auth/components/sign-up-view';

export const metadata: Metadata = {
  title: 'Sign Up | IPB Bike Center',
  description: 'Halaman Sign Up untuk IPB Bike Center.'
};

export default function Page() {
  return <SignUpViewPage />;
}
