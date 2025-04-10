import { Metadata } from 'next';
import { SignInViewPage } from 'src/features/auth/components/sign-in-view';

export const metadata: Metadata = {
  title: 'Sign In | IPB Bike Center',
  description: 'Halaman Sign In untuk IPB Bike Center.'
};

export default function Page() {
  return <SignInViewPage />;
}
