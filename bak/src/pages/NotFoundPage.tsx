import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { EmptyState } from '@/components/common';

export function NotFoundPage() {
  const { t } = useLang();
  return (
    <div style={{ padding: '40px 0' }}>
      <EmptyState
        icon={<Compass size={26} />}
        title={t('Page not found', 'ไม่พบหน้าที่ต้องการ')}
        body={t('The page you are looking for may have moved or does not exist.', 'หน้าที่คุณค้นหาอาจถูกย้ายหรือไม่มีอยู่')}
        action={<Link to="/portal" className="btn btn-primary btn-sm">{t('Back to dashboard', 'กลับไปหน้าหลัก')}</Link>}
      />
    </div>
  );
}
