import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import {
  User,
  LogOut,
  Settings,
  Globe,
  DollarSign,
  Bell,
  Shield,
  HelpCircle,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import type { User as AuthUser } from '@/lib/supabase';

export default function Profile() {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name ?? '',
    timezone: user?.timezone ?? 'Asia/Jakarta',
    currency: user?.currency ?? 'IDR',
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <AlertCircle className="w-6 h-6 text-muted-foreground mr-2" />
        <p className="text-muted-foreground">Silakan login terlebih dahulu</p>
      </div>
    );
  }

  const userInitials = (user.name ?? 'U').slice(0, 2).toUpperCase();
  const avatarSeed = user.name ?? 'user';

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: formData.name,
          timezone: formData.timezone,
          currency: formData.currency,
        })
        .eq('user_id', user.userId);

      if (error) {
        toast.error('Gagal menyimpan profil');
        return;
      }

      toast.success('Profil berhasil diperbarui');
      setIsEditing(false);
      // Note: In production, you'd refresh user context here
    } catch (err) {
      toast.error('Terjadi kesalahan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    if (confirm('Yakin ingin logout?')) {
      logout();
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">👤 Profil</h1>
        <p className="text-sm text-muted-foreground">Kelola informasi dan pengaturan akun Anda</p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Informasi Profil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar + Basic Info */}
          <div className="flex items-start gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`} />
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase">Nama Lengkap</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nama Anda"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Simpan
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({ ...formData, name: user.name ?? '' });
                      }}
                    >
                      Batal
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-xl font-bold">{user.name}</h2>
                  <p className="text-sm text-muted-foreground">ID: {user.userId}</p>
                  <p className="text-xs text-muted-foreground mt-2">Tier: {user.tier ?? 'free'}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Nama
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t" />

          {/* Account Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Aktif
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Tier Akun</p>
              <Badge variant="secondary" className="capitalize">
                {user.tier ?? 'free'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="w-5 h-5" /> Pengaturan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Timezone */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Globe className="w-4 h-4" /> Zona Waktu
            </Label>
            <select
              value={formData.timezone}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              disabled={!isEditing}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            >
              <option value="Asia/Jakarta">Jakarta (UTC+7)</option>
              <option value="Asia/Surabaya">Surabaya (UTC+7)</option>
              <option value="Asia/Bangkok">Bangkok (UTC+7)</option>
              <option value="Asia/Singapore">Singapore (UTC+8)</option>
              <option value="Asia/Manila">Manila (UTC+8)</option>
              <option value="Australia/Sydney">Sydney (UTC+10)</option>
            </select>
            <p className="text-xs text-muted-foreground">Digunakan untuk menampilkan waktu dan jadwal laporan</p>
          </div>

          {/* Currency */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Mata Uang
            </Label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              disabled={!isEditing}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            >
              <option value="IDR">IDR - Indonesian Rupiah</option>
              <option value="USD">USD - US Dollar</option>
              <option value="SGD">SGD - Singapore Dollar</option>
              <option value="PHP">PHP - Philippine Peso</option>
            </select>
            <p className="text-xs text-muted-foreground">Format angka dan simbol mata uang di seluruh aplikasi</p>
          </div>

          {/* Save Settings Button */}
          {isEditing && (
            <div className="pt-2 flex gap-2">
              <Button size="sm" onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Simpan Pengaturan
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    name: user.name ?? '',
                    timezone: user.timezone ?? 'Asia/Jakarta',
                    currency: user.currency ?? 'IDR',
                  });
                }}
              >
                Batal
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Connected Services */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5" /> Layanan Terhubung
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Telegram */}
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <p className="font-medium text-sm">📱 Telegram</p>
              <p className="text-xs text-muted-foreground mt-1">
                {user.username ? `@${user.username} (ID: ${user.userId})` : 'Belum terhubung'}
              </p>
            </div>
            {user.username && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Terhubung
              </Badge>
            )}
          </div>

          {/* Google OAuth */}
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <p className="font-medium text-sm">🔐 Google Account</p>
              <p className="text-xs text-muted-foreground mt-1">Untuk login dan sinkronisasi data</p>
            </div>
            <Badge variant="secondary" className="bg-gray-100 text-gray-700">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Terhubung
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Help & Support */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <HelpCircle className="w-5 h-5" /> Bantuan & Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <a
            href="https://github.com/yourusername/gajian-aman"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
          >
            <span className="text-sm font-medium">📖 Dokumentasi</span>
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </a>
          <a
            href="https://github.com/yourusername/gajian-aman/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
          >
            <span className="text-sm font-medium">🐛 Laporkan Bug</span>
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </a>
          <div className="p-3 rounded-lg border text-sm">
            <p className="text-muted-foreground">Versi: 2.1.0</p>
            <p className="text-xs text-muted-foreground mt-1">© 2026 Gajian Aman. Built with Claude.</p>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 bg-red-50/30">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-red-900">⚠️ Zona Berbahaya</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-red-900/70">
            Tindakan di bawah ini tidak dapat dibatalkan. Pastikan Anda yakin sebelum melanjutkan.
          </p>
          <Button
            variant="outline"
            className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
