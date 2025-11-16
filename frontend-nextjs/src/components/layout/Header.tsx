import Image from 'next/image';
import { PRODUCT_NAME, logoLight } from '@/config/branding';

export default function Header() {
  return (
    <div className="flex items-center justify-between border-b border-gray-800 p-4">
      <Image src={logoLight} alt={PRODUCT_NAME} width={120} height={32} />
    </div>
  );
}
