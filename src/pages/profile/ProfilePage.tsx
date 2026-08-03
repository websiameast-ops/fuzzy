import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, KeyRound, MessageCircle, Plus, QrCode, Users } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/contexts/ToastContext';
import { NOTIF_CATEGORIES, useNotifications } from '@/contexts/NotificationContext';
import { ContactSECard, Modal, StatusBadge, Switch } from '@/components/common';
import { mockUsers } from '@/data/mockUsers';
import { fmtDate, initials } from '@/utils/format';
import type { NotificationPrefs, PortalRole, PortalUser } from '@/types';

const ROLES: PortalRole[] = ['Company administrator', 'Maintenance manager', 'Engineer', 'Procurement', 'Finance', 'Viewer'];

const ROLE_TH: Record<PortalRole, string> = {
  'Company administrator': 'ผู้ดูแลระบบบริษัท',
  'Maintenance manager': 'ผู้จัดการฝ่ายซ่อมบำรุง',
  Engineer: 'วิศวกร',
  Procurement: 'ฝ่ายจัดซื้อ',
  Finance: 'ฝ่ายการเงิน',
  Viewer: 'ผู้ดูข้อมูล',
};

/* ---------------- Profile overview ---------------- */

export function ProfilePage() {
  const { lang, setLang, t } = useLang();
  const { customerCode, company } = useCompany();
  const { user } = useAuth();
  const { showToast } = useToast();

  const me = mockUsers.find((u) => u.email === user?.email && u.customerCode === customerCode) ?? mockUsers[0]!;

  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  const changePw = () => {
    if (!curPw || !newPw) {
      showToast(t('Please fill in the password fields.', 'กรุณากรอกช่องรหัสผ่าน'), 'error');
      return;
    }
    if (newPw !== confirmPw) {
      showToast(t('New passwords do not match.', 'รหัสผ่านใหม่ไม่ตรงกัน'), 'error');
      return;
    }
    setCurPw(''); setNewPw(''); setConfirmPw('');
    showToast(t('Password updated (demo).', 'เปลี่ยนรหัสผ่านแล้ว (เดโม)'), 'success');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('Profile & Settings', 'โปรไฟล์และการตั้งค่า')}</h1>
          <p className="page-sub">{t('Your account, language, security and SE contacts.', 'บัญชี ภาษา ความปลอดภัย และผู้ติดต่อ SE ของคุณ')}</p>
        </div>
        <div className="page-actions">
          <Link to="/portal/profile/users" className="btn btn-outline">
            <Users size={16} aria-hidden />
            {t('User management', 'จัดการผู้ใช้งาน')}
          </Link>
          <Link to="/portal/profile/notifications" className="btn btn-outline">
            <Bell size={16} aria-hidden />
            {t('Notifications', 'การแจ้งเตือน')}
          </Link>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: 16 }}>
          <div className="card" style={{ padding: 18 }}>
            <div className="flex" style={{ gap: 14, marginBottom: 12 }}>
              <span className="avatar" style={{ width: 52, height: 52, fontSize: 18 }}>{initials(me.name)}</span>
              <div>
                <div className="fw-600" style={{ fontSize: 16 }}>{me.name}</div>
                <div className="muted small">{me.jobTitle}</div>
              </div>
            </div>
            <div className="stat-line"><span className="k">{t('Email', 'อีเมล')}</span><span className="v">{me.email}</span></div>
            <div className="stat-line"><span className="k">{t('Phone', 'โทรศัพท์')}</span><span className="v">{me.phone}</span></div>
            <div className="stat-line">
              <span className="k">{t('Role', 'บทบาท')}</span>
              <span className="v"><StatusBadge label={lang === 'th' ? ROLE_TH[me.role] : me.role} tone="brand" /></span>
            </div>
            <div className="stat-line">
              <span className="k">{t('Site access', 'สิทธิ์เข้าถึงไซต์')}</span>
              <span className="v">{me.siteIds.map((s) => company.sites.find((x) => x.id === s)?.[lang === 'th' ? 'nameTh' : 'name'] ?? s).join(', ')}</span>
            </div>
            <div className="stat-line"><span className="k">{t('Company', 'บริษัท')}</span><span className="v">{lang === 'th' ? company.nameTh : company.name} ({customerCode})</span></div>
          </div>

          <div className="card" style={{ padding: 18 }}>
            <h3 style={{ marginTop: 0 }}>{t('Language', 'ภาษา')}</h3>
            <p className="muted small" style={{ marginTop: 0 }}>
              {t('Applies to the whole portal immediately.', 'มีผลกับพอร์ทัลทั้งหมดทันที')}
            </p>
            <div className="seg" role="group" aria-label={t('Language', 'ภาษา')} style={{ width: 'fit-content' }}>
              <button className={lang === 'th' ? 'active' : ''} onClick={() => setLang('th')} aria-pressed={lang === 'th'}>ไทย</button>
              <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')} aria-pressed={lang === 'en'}>English</button>
            </div>
          </div>

          <div className="card" style={{ padding: 18 }}>
            <h3 style={{ marginTop: 0 }}><KeyRound size={17} aria-hidden style={{ verticalAlign: -3 }} /> {t('Change password', 'เปลี่ยนรหัสผ่าน')}</h3>
            <div className="field">
              <label htmlFor="pw-cur">{t('Current password', 'รหัสผ่านปัจจุบัน')}</label>
              <input id="pw-cur" type="password" value={curPw} onChange={(e) => setCurPw(e.target.value)} autoComplete="current-password" />
            </div>
            <div className="grid-2">
              <div className="field">
                <label htmlFor="pw-new">{t('New password', 'รหัสผ่านใหม่')}</label>
                <input id="pw-new" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} autoComplete="new-password" />
              </div>
              <div className="field">
                <label htmlFor="pw-conf">{t('Confirm new password', 'ยืนยันรหัสผ่านใหม่')}</label>
                <input id="pw-conf" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} autoComplete="new-password" />
              </div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={changePw}>{t('Update password', 'อัปเดตรหัสผ่าน')}</button>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          <div className="card" style={{ padding: 18 }}>
            <h3 style={{ marginTop: 0 }}><MessageCircle size={17} aria-hidden style={{ verticalAlign: -3 }} /> {t('LINE Official Account', 'บัญชี LINE Official')}</h3>
            <div className="between" style={{ gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div className="fw-600 small">@seconnex</div>
                <p className="muted small" style={{ margin: '4px 0 0' }}>
                  {t('Link LINE to receive appointment reminders and alarm alerts on your phone.', 'เชื่อม LINE เพื่อรับเตือนนัดหมายและสัญญาณเตือนบนมือถือ')}
                </p>
                <StatusBadge label={t('Not linked yet', 'ยังไม่ได้เชื่อมต่อ')} tone="grey" />
              </div>
              <div className="qr-mini" aria-hidden>
                <QrCode size={64} strokeWidth={1.1} />
                <span className="small muted">{t('Scan with LINE', 'สแกนด้วย LINE')}</span>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 18 }}>
            <h3 style={{ marginTop: 0 }}>{t('Your SE contacts', 'ผู้ติดต่อ SE ของคุณ')}</h3>
            <div style={{ display: 'grid', gap: 10 }}>
              <ContactSECard
                name={company.accountManager.name}
                role={lang === 'th' ? company.accountManager.roleTh : company.accountManager.role}
                phone={company.accountManager.phone}
                email={company.accountManager.email}
                line={company.accountManager.line}
              />
              <ContactSECard
                name={company.serviceCoordinator.name}
                role={lang === 'th' ? company.serviceCoordinator.roleTh : company.serviceCoordinator.role}
                phone={company.serviceCoordinator.phone}
                email={company.serviceCoordinator.email}
                line={company.serviceCoordinator.line}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- User management ---------------- */

const EMPTY_FORM = { name: '', email: '', phone: '', jobTitle: '', role: 'Viewer' as PortalRole, siteIds: [] as string[] };

export function UsersPage() {
  const { lang, t } = useLang();
  const { customerCode, company } = useCompany();
  const { users, inviteUser, updateUser } = useData();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const mine = useMemo(() => users.filter((u) => u.customerCode === customerCode), [users, customerCode]);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [editUser, setEditUser] = useState<PortalUser | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const toggleSite = (id: string) => {
    setForm((f) => ({ ...f, siteIds: f.siteIds.includes(id) ? f.siteIds.filter((s) => s !== id) : [...f.siteIds, id] }));
  };

  const sendInvite = () => {
    if (!form.name.trim() || !form.email.trim()) {
      showToast(t('Name and email are required.', 'ต้องกรอกชื่อและอีเมล'), 'error');
      return;
    }
    if (form.siteIds.length === 0) {
      showToast(t('Choose at least one site.', 'เลือกอย่างน้อยหนึ่งไซต์'), 'error');
      return;
    }
    inviteUser({ customerCode, name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() || '—', jobTitle: form.jobTitle.trim() || '—', role: form.role, siteIds: form.siteIds });
    setInviteOpen(false);
    setForm(EMPTY_FORM);
    showToast(t(`Invitation sent to ${form.email} (demo).`, `ส่งคำเชิญไปที่ ${form.email} แล้ว (เดโม)`), 'success');
  };

  const openEdit = (u: PortalUser) => {
    setEditUser(u);
    setForm({ name: u.name, email: u.email, phone: u.phone, jobTitle: u.jobTitle, role: u.role, siteIds: [...u.siteIds] });
  };

  const saveEdit = () => {
    if (!editUser) return;
    if (form.siteIds.length === 0) {
      showToast(t('Choose at least one site.', 'เลือกอย่างน้อยหนึ่งไซต์'), 'error');
      return;
    }
    updateUser(editUser.id, { role: form.role, siteIds: form.siteIds });
    setEditUser(null);
    showToast(t(`Access updated for ${editUser.name}.`, `อัปเดตสิทธิ์ของ ${editUser.name} แล้ว`), 'success');
  };

  const toggleStatus = (u: PortalUser) => {
    const next = u.status === 'disabled' ? 'active' : 'disabled';
    updateUser(u.id, { status: next });
    showToast(
      next === 'disabled'
        ? t(`${u.name} can no longer sign in.`, `${u.name} ไม่สามารถเข้าสู่ระบบได้แล้ว`)
        : t(`${u.name} was reactivated.`, `เปิดใช้งาน ${u.name} อีกครั้งแล้ว`),
      'info',
    );
  };

  const roleLabel = (r: PortalRole) => (lang === 'th' ? ROLE_TH[r] : r);

  const siteFields = (
    <>
      <div className="field">
        <label>{t('Role', 'บทบาท')}</label>
        <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as PortalRole }))}>
          {ROLES.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
        </select>
      </div>
      <div className="field">
        <label>{t('Site access', 'สิทธิ์เข้าถึงไซต์')}</label>
        <div style={{ display: 'grid', gap: 6 }}>
          {company.sites.map((s) => (
            <label key={s.id} className="checkbox-row">
              <input type="checkbox" checked={form.siteIds.includes(s.id)} onChange={() => toggleSite(s.id)} />
              <span>{lang === 'th' ? s.nameTh : s.name}</span>
            </label>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <div>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/portal/profile')} style={{ marginBottom: 12, marginLeft: -8 }}>
        <ArrowLeft size={16} aria-hidden />
        {t('Profile & settings', 'โปรไฟล์และการตั้งค่า')}
      </button>

      <div className="page-header">
        <div>
          <h1 className="page-title">{t('User management', 'จัดการผู้ใช้งาน')}</h1>
          <p className="page-sub">{t(`${mine.length} portal users for ${lang === 'th' ? company.nameTh : company.name}.`, `ผู้ใช้งานพอร์ทัล ${mine.length} คนของ${company.nameTh}`)}</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => { setForm(EMPTY_FORM); setInviteOpen(true); }}>
            <Plus size={16} aria-hidden />
            {t('Invite user', 'เชิญผู้ใช้งาน')}
          </button>
        </div>
      </div>

      <div className="card table-to-cards" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="se-table">
            <thead>
              <tr>
                <th>{t('User', 'ผู้ใช้งาน')}</th>
                <th>{t('Role', 'บทบาท')}</th>
                <th>{t('Sites', 'ไซต์')}</th>
                <th>{t('Last active', 'ใช้งานล่าสุด')}</th>
                <th>{t('Status', 'สถานะ')}</th>
                <th aria-label={t('Actions', 'การทำงาน')} />
              </tr>
            </thead>
            <tbody>
              {mine.map((u) => (
                <tr key={u.id}>
                  <td data-label={t('User', 'ผู้ใช้งาน')}>
                    <div className="flex" style={{ gap: 10 }}>
                      <span className="avatar" aria-hidden>{initials(u.name)}</span>
                      <div>
                        <div className="fw-600">{u.name}</div>
                        <div className="muted small">{u.email} · {u.jobTitle}</div>
                      </div>
                    </div>
                  </td>
                  <td data-label={t('Role', 'บทบาท')}><StatusBadge label={roleLabel(u.role)} tone={u.role === 'Company administrator' ? 'brand' : 'grey'} /></td>
                  <td data-label={t('Sites', 'ไซต์')} className="small">
                    {u.siteIds.map((s) => company.sites.find((x) => x.id === s)?.[lang === 'th' ? 'nameTh' : 'name'] ?? s).join(', ')}
                  </td>
                  <td data-label={t('Last active', 'ใช้งานล่าสุด')}>{u.status === 'invited' ? t('Invitation pending', 'รอตอบรับคำเชิญ') : fmtDate(u.lastActive, lang)}</td>
                  <td data-label={t('Status', 'สถานะ')}>
                    <StatusBadge
                      label={u.status === 'active' ? t('Active', 'ใช้งานอยู่') : u.status === 'invited' ? t('Invited', 'เชิญแล้ว') : t('Disabled', 'ปิดใช้งาน')}
                      tone={u.status === 'active' ? 'green' : u.status === 'invited' ? 'blue' : 'grey'}
                    />
                  </td>
                  <td data-label={t('Actions', 'การทำงาน')}>
                    <div className="flex" style={{ gap: 6 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(u)}>{t('Edit', 'แก้ไข')}</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => toggleStatus(u)}>
                        {u.status === 'disabled' ? t('Reactivate', 'เปิดใช้งาน') : t('Disable', 'ปิดใช้งาน')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite modal */}
      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title={t('Invite a portal user', 'เชิญผู้ใช้งานพอร์ทัล')}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setInviteOpen(false)}>{t('Cancel', 'ยกเลิก')}</button>
            <button className="btn btn-primary" onClick={sendInvite}>{t('Send invitation', 'ส่งคำเชิญ')}</button>
          </>
        }
      >
        <div className="grid-2">
          <div className="field">
            <label>{t('Full name', 'ชื่อ-นามสกุล')}</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="field">
            <label>{t('Email', 'อีเมล')}</label>
            <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="field">
            <label>{t('Phone (optional)', 'โทรศัพท์ (ไม่บังคับ)')}</label>
            <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="field">
            <label>{t('Job title (optional)', 'ตำแหน่ง (ไม่บังคับ)')}</label>
            <input value={form.jobTitle} onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))} />
          </div>
        </div>
        {siteFields}
      </Modal>

      {/* Edit modal */}
      <Modal
        open={editUser !== null}
        onClose={() => setEditUser(null)}
        title={editUser ? t(`Edit access — ${editUser.name}`, `แก้ไขสิทธิ์ — ${editUser.name}`) : ''}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setEditUser(null)}>{t('Cancel', 'ยกเลิก')}</button>
            <button className="btn btn-primary" onClick={saveEdit}>{t('Save changes', 'บันทึก')}</button>
          </>
        }
      >
        {siteFields}
      </Modal>
    </div>
  );
}

/* ---------------- Notification preferences ---------------- */

export function NotificationsPage() {
  const { lang, t } = useLang();
  const { prefs, setPrefs, resetPrefs } = useNotifications();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [draft, setDraft] = useState<NotificationPrefs>(() => JSON.parse(JSON.stringify(prefs)) as NotificationPrefs);

  const setChannel = (cat: keyof NotificationPrefs, channel: 'inapp' | 'email' | 'line' | 'sms', value: boolean) => {
    setDraft((d) => ({ ...d, [cat]: { ...d[cat], [channel]: value } }));
  };

  const save = () => {
    setPrefs(draft);
    showToast(t('Notification preferences saved — they take effect across the portal immediately.', 'บันทึกการตั้งค่าแจ้งเตือนแล้ว — มีผลทั่วทั้งพอร์ทัลทันที'), 'success');
  };

  const reset = () => {
    resetPrefs();
    setDraft((): NotificationPrefs => {
      const fresh = {} as NotificationPrefs;
      for (const c of NOTIF_CATEGORIES) fresh[c.key] = { inapp: true, email: true, line: false, sms: false };
      return fresh;
    });
    showToast(t('Preferences reset to defaults.', 'คืนค่าการตั้งค่าเริ่มต้นแล้ว'), 'info');
  };

  return (
    <div style={{ maxWidth: 900 }}>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/portal/profile')} style={{ marginBottom: 12, marginLeft: -8 }}>
        <ArrowLeft size={16} aria-hidden />
        {t('Profile & settings', 'โปรไฟล์และการตั้งค่า')}
      </button>

      <div className="page-header">
        <div>
          <h1 className="page-title">{t('Notification preferences', 'การตั้งค่าแจ้งเตือน')}</h1>
          <p className="page-sub">
            {t('Choose how each type of alert reaches you. The in-app column also controls which alerts appear inside the portal.', 'เลือกช่องทางรับแจ้งเตือนแต่ละประเภท คอลัมน์ “ในพอร์ทัล” ยังกำหนดว่าการแจ้งเตือนใดจะแสดงในพอร์ทัลด้วย')}
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: 18, marginBottom: 16 }}>
        <div className="notif-grid" role="table" aria-label={t('Notification preferences', 'การตั้งค่าแจ้งเตือน')}>
          <div className="notif-grid-row head" role="row">
            <div role="columnheader">{t('Category', 'หมวด')}</div>
            <div role="columnheader">{t('In-app', 'ในพอร์ทัล')}</div>
            <div role="columnheader">{t('Email', 'อีเมล')}</div>
            <div role="columnheader">LINE</div>
            <div role="columnheader">SMS</div>
          </div>
          {NOTIF_CATEGORIES.map((c) => (
            <div key={c.key} className="notif-grid-row" role="row">
              <div role="cell" className="small">{lang === 'th' ? c.th : c.en}</div>
              <div role="cell"><Switch checked={draft[c.key].inapp} onChange={(v) => setChannel(c.key, 'inapp', v)} label={`${c.en} in-app`} /></div>
              <div role="cell"><Switch checked={draft[c.key].email} onChange={(v) => setChannel(c.key, 'email', v)} label={`${c.en} email`} /></div>
              <div role="cell"><Switch checked={draft[c.key].line} onChange={(v) => setChannel(c.key, 'line', v)} label={`${c.en} LINE`} /></div>
              <div role="cell">
                <Switch checked={false} onChange={() => undefined} label={`${c.en} SMS (coming soon)`} disabled />
              </div>
            </div>
          ))}
        </div>
        <p className="muted small" style={{ margin: '10px 0 0' }}>
          {t('SMS notifications are coming soon. LINE requires linking the @seconnex official account from your profile page.', 'การแจ้งเตือนทาง SMS จะเปิดให้บริการเร็ว ๆ นี้ ส่วน LINE ต้องเชื่อมบัญชี @seconnex จากหน้าโปรไฟล์ก่อน')}
        </p>
        <div className="flex" style={{ gap: 10, marginTop: 14 }}>
          <button className="btn btn-primary" onClick={save}>{t('Save preferences', 'บันทึกการตั้งค่า')}</button>
          <button className="btn btn-outline" onClick={reset}>{t('Reset to defaults', 'คืนค่าเริ่มต้น')}</button>
        </div>
      </div>

      <div className="card" style={{ padding: 18 }}>
        <div className="between" style={{ gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div className="fw-600">{t('Get alerts in LINE', 'รับแจ้งเตือนใน LINE')}</div>
            <p className="muted small" style={{ margin: '4px 0 0' }}>
              {t('Scan to add @seconnex, then LINE toggles above become active.', 'สแกนเพื่อเพิ่ม @seconnex แล้วสวิตช์ LINE ด้านบนจะพร้อมใช้งาน')}
            </p>
          </div>
          <div className="qr-mini" aria-hidden>
            <QrCode size={64} strokeWidth={1.1} />
            <span className="small muted">@seconnex</span>
          </div>
        </div>
      </div>
    </div>
  );
}
