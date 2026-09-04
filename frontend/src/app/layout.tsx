import './globals.css';
import MegaNavbar from '@/components/MegaNavbar';
import MegaFooter from '@/components/MegaFooter';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/context/AuthContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <AuthProvider>
          <MegaNavbar />
          <main className="flex-grow">
            <Toaster />
            {children}
          </main>
          <MegaFooter />
        </AuthProvider>
      </body>
    </html>
  );
}