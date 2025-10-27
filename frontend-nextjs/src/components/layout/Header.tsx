import Image from 'next/image';
export default function Header() {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-800">
      <Image src="/brand/noor-logo-light.svg" alt="Noor" width={120} height={32} />
    </div>
  );
}
